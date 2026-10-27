/* ==========================================================================
   ia-core.js — Núcleo de los simuladores de Analítica para los Negocios II

   Expone window.IA con:
     · h / svg            → crear elementos HTML y SVG
     · motion             → animaciones con Motion (motion.dev), personalidad
                            "Playful": entradas con leve rebote, pop al acertar,
                            sacudida al fallar. Respeta prefers-reduced-motion.
     · panel / slider / buttons / stat / note / btn → piezas de interfaz
     · register(nombre, fn) → registra un simulador; se monta en cada
                            <div class="econ-widget ia-widget" data-widget="nombre">
   También monta los quizzes (.econ-quiz) y los bloques de práctica
   (.econ-practica) con el mismo marcado que el curso de Econometría.

   Se re-monta en cada cambio de página vía document$ (navegación instantánea
   de Material for MkDocs).
   ========================================================================== */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const WIDGETS = {};

  /* ---------- Creación de elementos ---------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(String(c))));
    return e;
  }

  function svg(tag, attrs, ...kids) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(String(c))));
    return e;
  }

  /* ---------- Motion: identidad de movimiento del curso ----------
     Easing firma (80 % de los casos): ease-out-back suave.
     Duraciones: quick 0.16 s · std 0.28 s · slow 0.45 s.
     Patrón de entrada: subir 14 px + aparecer, una sola vez al entrar en pantalla. */
  const EASE = {
    back: [0.34, 1.36, 0.64, 1],     // entrada con ~12 % de rebote
    out: [0.2, 0, 0, 1],             // cambios de estado sin rebote
    in: [0.3, 0, 1, 1],              // salidas
  };
  const DUR = { quick: 0.16, std: 0.28, slow: 0.45 };
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const M = () => window.Motion;

  function anim(el, kf, opts) {
    if (!el) return Promise.resolve();
    if (!M() || reduced()) {
      // Estado final inmediato
      const last = {};
      for (const [k, v] of Object.entries(kf)) last[k] = Array.isArray(v) ? v[v.length - 1] : v;
      if ("opacity" in last) el.style.opacity = last.opacity;
      if ("width" in last) el.style.width = typeof last.width === "number" ? last.width + "px" : last.width;
      if ("height" in last) el.style.height = typeof last.height === "number" ? last.height + "px" : last.height;
      if ("backgroundColor" in last) el.style.backgroundColor = last.backgroundColor;
      el.style.transform = "";
      return Promise.resolve();
    }
    return M().animate(el, kf, Object.assign({ duration: DUR.std, ease: EASE.out }, opts)).finished;
  }

  const motion = {
    EASE, DUR, reduced, anim,
    /** Entrada estándar: sube y aparece. */
    enter(el, delay = 0) {
      return anim(el, { opacity: [0, 1], y: [14, 0] }, { duration: DUR.slow, ease: EASE.back, delay });
    },
    /** Varios elementos en cascada (presupuesto total < 450 ms). */
    stagger(els, opts = {}) {
      els = [...els];
      if (!els.length) return Promise.resolve();
      const step = Math.min(opts.step ?? 0.05, 0.45 / els.length);
      if (!M() || reduced()) return Promise.all(els.map((e) => anim(e, opts.kf || { opacity: 1 })));
      return M().animate(els, opts.kf || { opacity: [0, 1], y: [10, 0] },
        { duration: opts.duration ?? DUR.std, ease: opts.ease || EASE.back, delay: M().stagger(step, { startDelay: opts.delay || 0 }) }).finished;
    },
    /** Pop de éxito. */
    pop(el) {
      return anim(el, { scale: [1, 1.06, 1] }, { duration: DUR.std, ease: EASE.back });
    },
    /** Sacudida de error (firme, sin rebote). */
    shake(el) {
      return anim(el, { x: [0, -8, 7, -5, 3, 0] }, { duration: 0.36, ease: "easeInOut" });
    },
    /** Pulso de atención para señalar un resultado que cambió. */
    pulse(el) {
      return anim(el, { scale: [1, 1.04, 1], opacity: [0.65, 1] }, { duration: DUR.std, ease: EASE.out });
    },
    /** Interpola un número dentro de un elemento de texto. */
    count(el, from, to, fmt = (v) => v.toFixed(2), duration = DUR.slow) {
      if (!M() || reduced()) { el.textContent = fmt(to); return Promise.resolve(); }
      return M().animate(from, to, { duration, ease: EASE.out, onUpdate: (v) => { el.textContent = fmt(v); } }).finished;
    },
    /** Anima un atributo SVG numérico (x, y, width, height, r, cx…). */
    attr(el, name, to, opts = {}) {
      const from = parseFloat(el.getAttribute(name)) || 0;
      if (!M() || reduced()) { el.setAttribute(name, to); return Promise.resolve(); }
      return M().animate(from, to, Object.assign({ duration: DUR.std, ease: EASE.out,
        onUpdate: (v) => el.setAttribute(name, v) }, opts)).finished;
    },
    /** Ejecuta fn la primera vez que el elemento entra en pantalla. */
    onView(el, fn) {
      if (M() && M().inView) {
        const stop = M().inView(el, () => { fn(); stop && stop(); }, { amount: 0.25 });
      } else fn();
    },
  };

  /* ---------- Piezas de interfaz (mismo estilo que Econometría) ---------- */
  function panel(root, title, sub) {
    root.classList.add("econ-widget");
    if (title) root.append(h("p", { class: "econ-widget-title" }, title));
    if (sub) root.append(h("p", { class: "econ-widget-sub", html: sub }));
    return root;
  }

  function controls(parent) {
    const c = h("div", { class: "econ-controls" });
    parent.append(c);
    return c;
  }

  /** Deslizador con etiqueta y valor. Devuelve el <input>. */
  function slider(parent, label, { min = 0, max = 1, step = 0.01, value = 0, fmt = (v) => v }, onInput) {
    const out = h("output", {}, fmt(+value));
    const input = h("input", { type: "range", min, max, step, value, "aria-label": label });
    input.addEventListener("input", () => { out.textContent = fmt(+input.value); onInput && onInput(+input.value); });
    parent.append(h("div", { class: "econ-control" }, h("label", {}, label + " ", out), input));
    return input;
  }

  function btn(parent, label, onClick, cls = "") {
    const b = h("button", { type: "button", class: "econ-btn " + cls }, label);
    b.addEventListener("click", (ev) => { motion.anim(b, { scale: [0.96, 1] }, { duration: DUR.quick, ease: EASE.back }); onClick(ev); });
    parent.append(b);
    return b;
  }

  /** Grupo de botones excluyentes. options: [{label, value}] */
  function buttons(parent, options, onSelect, initial) {
    const wrap = h("div", { class: "econ-buttons", role: "group" });
    const bs = options.map((o) => {
      const b = h("button", { type: "button", class: "econ-btn econ-btn-ghost", "aria-pressed": String(o.value === initial) }, o.label);
      b.addEventListener("click", () => {
        bs.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        motion.anim(b, { scale: [0.95, 1] }, { duration: DUR.quick, ease: EASE.back });
        onSelect(o.value);
      });
      wrap.append(b);
      return b;
    });
    parent.append(wrap);
    return wrap;
  }

  /** Tarjeta de estadístico. Devuelve set(valor) que anima el cambio. */
  function stat(parent, label, initial = "—", cls = "") {
    const strong = h("strong", {}, initial);
    const card = h("div", { class: "econ-stat " + cls }, h("span", {}, label), strong);
    let row = parent.querySelector(":scope > .econ-stats");
    if (!row) { row = h("div", { class: "econ-stats" }); parent.append(row); }
    row.append(card);
    return (v) => {
      if (strong.textContent === String(v)) return;
      strong.textContent = v;
      motion.pulse(strong);
    };
  }

  function note(parent, html) {
    const p = h("p", { class: "econ-note", html });
    parent.append(p);
    return p;
  }

  /* ---------- Quizzes de selección múltiple ----------
     <div class="econ-quiz">
       <p class="econ-quiz-q">Pregunta</p>
       <div class="econ-quiz-opts">
         <button class="econ-quiz-opt" data-correct>Correcta</button>
         <button class="econ-quiz-opt" data-why="Por qué no">Incorrecta</button>
       </div>
       <p class="econ-quiz-fb">✅ Explicación de la correcta</p>
     </div> */
  function mountQuiz(q) {
    if (q.dataset.mounted) return;
    q.dataset.mounted = "1";
    const opts = q.querySelectorAll(".econ-quiz-opt");
    const fb = q.querySelector(".econ-quiz-fb");
    const why = h("p", { class: "econ-quiz-why", "aria-live": "polite" });
    q.querySelector(".econ-quiz-opts").after(why);
    opts.forEach((o) => {
      o.type = "button";
      o.addEventListener("click", () => {
        const ok = o.hasAttribute("data-correct");
        o.classList.add(ok ? "is-right" : "is-wrong");
        if (!q.dataset.first) q.dataset.first = ok ? "right" : "wrong";
        if (ok) {
          opts.forEach((x) => { x.disabled = true; });
          why.textContent = "";
          motion.pop(o);
          if (fb) { fb.classList.add("is-visible"); motion.enter(fb); }
          q.dataset.done = "1";
          const set = q.closest(".econ-practica");
          if (set) scorePractica(set);
        } else {
          why.textContent = "❌ " + (o.dataset.why || "No es esta. Vuelve a intentarlo.");
          o.disabled = true;
          motion.shake(o);
        }
      });
    });
  }

  function scorePractica(set) {
    const qs = [...set.querySelectorAll(".econ-quiz")];
    const done = qs.filter((q) => q.dataset.done).length;
    const right = qs.filter((q) => q.dataset.first === "right").length;
    const out = set.querySelector(".econ-practica-score");
    if (!out) return;
    out.textContent = done < qs.length
      ? `${done} de ${qs.length} respondidas`
      : `${right} de ${qs.length} correctas a la primera ${right === qs.length ? "🎉" : "· revisa las explicaciones"}`;
    const complete = done === qs.length;
    out.classList.toggle("is-complete", complete);
    if (complete) motion.pop(out);
  }

  function mountPractica(set) {
    if (set.dataset.mounted) return;
    set.dataset.mounted = "1";
    const head = set.querySelector(".econ-practica-t");
    if (!head) return;
    head.append(h("span", { class: "econ-practica-score" }));
    const reset = btn(head, "↺ Reintentar", () => {
      set.querySelectorAll(".econ-quiz").forEach((q) => {
        delete q.dataset.first;
        delete q.dataset.done;
        q.querySelectorAll(".econ-quiz-opt").forEach((o) => { o.disabled = false; o.classList.remove("is-right", "is-wrong"); });
        q.querySelector(".econ-quiz-fb")?.classList.remove("is-visible");
        const w = q.querySelector(".econ-quiz-why");
        if (w) w.textContent = "";
      });
      scorePractica(set);
    }, "econ-btn-ghost econ-btn-sm");
    reset.setAttribute("aria-label", "Reintentar las preguntas de este tema");
    scorePractica(set);
  }

  /* ---------- Montaje ---------- */
  function register(name, fn) {
    WIDGETS[name] = fn;
  }

  function mountAll() {
    document.querySelectorAll(".ia-widget[data-widget]").forEach((root) => {
      if (root.dataset.mounted) return;
      const fn = WIDGETS[root.dataset.widget];
      if (!fn) return;
      root.dataset.mounted = "1";
      try {
        fn(root);
      } catch (err) {
        console.error("ia-core:", root.dataset.widget, err);
        root.append(h("p", { class: "econ-note" }, "No se pudo cargar este simulador."));
      }
    });
    document.querySelectorAll(".econ-quiz").forEach(mountQuiz);
    document.querySelectorAll(".econ-practica").forEach(mountPractica);

    // Entrada única de bloques al aparecer en pantalla
    if (!reduced() && M()) {
      document.querySelectorAll(".ia-widget, .py-run, .econ-practica, .usm-card, .ia-step").forEach((el) => {
        if (el.dataset.entered) return;
        el.dataset.entered = "1";
        el.style.opacity = "0";
        motion.onView(el, () => motion.enter(el));
      });
    }
  }

  window.IA = { h, svg, motion, panel, controls, slider, btn, buttons, stat, note, register, mountAll, WIDGETS };

  // Los archivos de cada clase (widgets-claseN.js) se cargan después y registran
  // sus simuladores; montamos cuando el DOM está listo y en cada navegación.
  const start = () => setTimeout(mountAll, 0);
  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
