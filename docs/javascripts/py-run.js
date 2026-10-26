/* ==========================================================================
   py-run.js — Ejercicios de Python que se ejecutan en el navegador.

   Cada bloque <div class="py-run" markdown> contiene un bloque de código
   Python. Este script le agrega una barra con "Ejecutar", "Copiar" y
   "Restaurar", y hace editable el código para que el estudiante lo cambie.

   Python corre con Pyodide (CPython compilado a WebAssembly). Se descarga SOLO
   la primera vez que alguien presiona "Ejecutar" (~10–20 s); después cada
   ejecución es inmediata. Todos los bloques de la página comparten la misma
   sesión: una variable creada en un bloque existe en los siguientes.

   Extras disponibles dentro del código:
     · DATA  → URL de la carpeta de datasets del sitio (DATA + "archivo.csv")
     · pd.read_csv(url) funciona con URLs (se descarga vía HTTP del navegador)
     · Los gráficos de matplotlib se muestran solos (plt.show() es opcional)
     · Si la última línea es una expresión, se muestra su valor (como en Colab)
   ========================================================================== */
(function () {
  "use strict";
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
  let pyPromise = null;

  // Raíz del sitio a partir de la URL de este script (…/javascripts/py-run.js)
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
  const SITE_ROOT = SCRIPT_SRC ? new URL("../", SCRIPT_SRC).href : new URL("./", location.href).href;

  const PRELUDE = `
import os, sys, io, base64, warnings
os.environ["MPLBACKEND"] = "AGG"
warnings.filterwarnings("ignore", message=".*non-interactive.*")
warnings.filterwarnings("ignore", category=FutureWarning)
DATA = "${SITE_ROOT}datasets/"

def _ia_patch_pandas():
    if "pandas" not in sys.modules or getattr(sys.modules["pandas"], "_ia_patched", False):
        return
    import pandas as _pd
    from pyodide.http import open_url
    _orig = _pd.read_csv
    def read_csv(path, *a, **k):
        if isinstance(path, str) and path.startswith(("http://", "https://")):
            path = open_url(path)
        return _orig(path, *a, **k)
    _pd.read_csv = read_csv
    _pd._ia_patched = True

def _ia_figs():
    if "matplotlib.pyplot" not in sys.modules:
        return []
    import matplotlib.pyplot as plt
    out = []
    for n in plt.get_fignums():
        f = plt.figure(n)
        b = io.BytesIO()
        f.savefig(b, format="png", dpi=110, bbox_inches="tight")
        out.append(base64.b64encode(b.getvalue()).decode())
    plt.close("all")
    return out

def _ia_repr(v):
    if v is None:
        return None
    if hasattr(v, "_repr_html_"):
        try:
            html = v._repr_html_()
            if html:
                return ["html", html]
        except Exception:
            pass
    return ["text", repr(v)]
`;

  function getPy(status) {
    if (!pyPromise) {
      status("⏳ Cargando Python en tu navegador (solo la primera vez, puede tardar unos 15 segundos)…");
      pyPromise = new Promise((resolve, reject) => {
        if (window.loadPyodide) return resolve();
        const s = document.createElement("script");
        s.src = PYODIDE_URL + "pyodide.js";
        s.onload = resolve;
        s.onerror = () => reject(new Error("No se pudo descargar Pyodide."));
        document.head.append(s);
      }).then(async () => {
        const py = await window.loadPyodide({ indexURL: PYODIDE_URL });
        await py.runPythonAsync(PRELUDE);
        return py;
      }).catch((err) => {
        pyPromise = null;
        throw err;
      });
    }
    return pyPromise;
  }

  function mk(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }

  function mount(block) {
    if (block.dataset.mounted) return;
    const code = block.querySelector("pre code");
    if (!code) return;
    block.dataset.mounted = "1";
    const original = code.textContent;
    code.setAttribute("contenteditable", "plaintext-only");
    if (code.contentEditable !== "plaintext-only") code.setAttribute("contenteditable", "true");
    code.setAttribute("spellcheck", "false");
    code.setAttribute("aria-label", "Código Python editable");

    const bar = mk("div", "econ-r-bar");
    const run = mk("button", "econ-btn econ-btn-gold", "▶ Ejecutar en el navegador");
    const copy = mk("button", "econ-btn econ-btn-ghost", "Copiar");
    const reset = mk("button", "econ-btn econ-btn-ghost", "↺ Restaurar");
    [run, copy, reset].forEach((b) => { b.type = "button"; bar.append(b); });
    bar.append(mk("span", "econ-r-hint", "Puedes editar el código antes de ejecutarlo."));
    const out = mk("div", "econ-r-out py-run-out");
    out.setAttribute("aria-live", "polite");
    out.hidden = true;
    const host = code.closest(".highlight") || code.closest("pre");
    host.after(bar, out);

    const status = (msg) => {
      out.hidden = false;
      out.replaceChildren(mk("p", "econ-r-status", msg));
    };

    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        copy.textContent = "¡Copiado!";
      } catch (e) {
        copy.textContent = "Selecciona y copia (Ctrl+C)";
      }
      setTimeout(() => { copy.textContent = "Copiar"; }, 1600);
    });

    reset.addEventListener("click", () => {
      code.textContent = original;
      out.hidden = true;
      out.replaceChildren();
    });

    run.addEventListener("click", async () => {
      run.disabled = true;
      run.textContent = "⏳ Ejecutando…";
      const src = code.innerText;
      let printed = "";
      try {
        const py = await getPy(status);
        status("⏳ Instalando paquetes y ejecutando…");
        await py.loadPackagesFromImports(src);
        if (/\bpandas\b|\bpd\./.test(src)) await py.runPythonAsync("import pandas\n_ia_patch_pandas()");
        py.setStdout({ batched: (s) => { printed += s + "\n"; } });
        py.setStderr({ batched: (s) => { if (!/building the font cache/.test(s)) printed += s + "\n"; } });
        const result = await py.runPythonAsync(src);
        const reprFn = py.globals.get("_ia_repr");
        const rep = reprFn(result);
        reprFn.destroy();
        if (result && result.destroy) result.destroy();
        const figsFn = py.globals.get("_ia_figs");
        const figs = figsFn().toJs();
        figsFn.destroy();

        out.replaceChildren();
        if (printed.trim()) out.append(mk("pre", "econ-r-text", printed.replace(/\n$/, "")));
        if (rep) {
          const [kind, val] = rep.toJs();
          rep.destroy();
          if (kind === "html") {
            const div = mk("div", "py-run-html");
            div.innerHTML = val;
            out.append(div);
          } else {
            out.append(mk("pre", "econ-r-text", val));
          }
        }
        figs.forEach((b64) => {
          const img = mk("img", "econ-r-plot");
          img.src = "data:image/png;base64," + b64;
          img.alt = "Gráfico generado por el código";
          out.append(img);
        });
        if (!out.childNodes.length) out.append(mk("p", "econ-r-status", "✓ Listo (el código no imprimió resultados)."));
        if (window.IA) window.IA.motion.enter(out);
      } catch (err) {
        out.hidden = false;
        let msg = err && err.message ? err.message : String(err);
        // Mostrar solo la parte útil del traceback de Python
        const i = msg.lastIndexOf('File "<exec>"');
        if (i > 0) msg = "Traceback (resumen):\n  " + msg.slice(i);
        out.replaceChildren(mk("pre", "econ-r-text is-error",
          (printed ? printed + "\n" : "") + "Error: " + msg +
          "\n\nSi Python no carga, copia el código y ejecútalo en Google Colab."));
        if (window.IA) window.IA.motion.shake(out);
      } finally {
        run.disabled = false;
        run.textContent = "▶ Ejecutar en el navegador";
      }
    });
  }

  function mountAll() {
    document.querySelectorAll(".py-run").forEach(mount);
  }

  if (typeof document$ !== "undefined") document$.subscribe(mountAll);
  else document.addEventListener("DOMContentLoaded", mountAll);
})();
