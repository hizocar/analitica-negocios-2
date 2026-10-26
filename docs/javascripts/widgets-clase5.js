/* widgets-clase5.js — Simuladores de la Clase 5 (Del prototipo a la decisión):
   c5-matriz    · matriz de decisión ponderada con ranking que se reordena
   c5-roi       · calculadora de ROI de automatizar la derivación de reclamos
   c5-bootstrap · bootstrap pareado de la diferencia de accuracy entre dos modelos
   c5-piramide  · ordenar afirmaciones del pitch en la pirámide de Minto */
(function () {
  "use strict";
  const { h, svg, motion, panel, controls, slider, btn, buttons, stat, note, register } = window.IA;

  /* ---------- utilidades ---------- */
  const fmtNum = (v, d = 0) => v.toLocaleString("es-CL", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtCLP = (v) => (v < 0 ? "−$" : "$") + fmtNum(Math.abs(Math.round(v)));
  const fmtM = (v) => (v < 0 ? "−" : "") + "$" + fmtNum(Math.abs(v) / 1e6, 2) + " M";

  /** FLIP: anima elementos desde su posición anterior a la nueva tras mutar el DOM. */
  function flip(els, mutate) {
    const first = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
    mutate();
    const moved = [];
    els.forEach((e) => {
      const a = first.get(e);
      const b = e.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      moved.push(e);
      motion.anim(e, { x: [dx, 0], y: [dy, 0] }, { duration: motion.DUR.slow, ease: motion.EASE.back });
    });
    return moved;
  }

  /** Generador pseudoaleatorio con semilla (resultados reproducibles). */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Deslizador con valor fijado desde código (actualiza la etiqueta y recalcula). */
  function setSlider(input, v) {
    input.value = v;
    input.dispatchEvent(new Event("input"));
  }

  /* ======================================================================
     1) c5-matriz · matriz de decisión ponderada
     ====================================================================== */
  register("c5-matriz", (root) => {
    panel(root, "⚖️ Matriz de decisión: ¿qué enfoque pondrías en producción?",
      "Ajusta cuánto le importa cada criterio al negocio (0 = nada, 5 = muchísimo) o elige un perfil de empresa. " +
      "El ranking se reordena solo. <em>Puntajes ilustrativos de 1 a 5; reemplázalos por los de tu proyecto.</em>");

    const CRIT = [
      { k: "calidad", label: "Calidad (F1)", w: 5 },
      { k: "costo", label: "Costo bajo", w: 3 },
      { k: "latencia", label: "Latencia baja", w: 2 },
      { k: "pocos", label: "Funciona con pocos datos", w: 2 },
      { k: "mant", label: "Mantención simple", w: 3 },
      { k: "priv", label: "Privacidad", w: 4 },
      { k: "expl", label: "Explicabilidad", w: 3 },
    ];
    const ENF = [
      { name: "TF-IDF + logística", s: [4, 5, 5, 1, 4, 5, 5] },
      { name: "MLP (Keras)", s: [4, 5, 5, 1, 3, 5, 2] },
      { name: "Embeddings + clasificador", s: [4, 4, 4, 3, 3, 5, 2] },
      { name: "LLM zero-shot", s: [3, 2, 2, 5, 4, 2, 3] },
      { name: "Asistente RAG", s: [4, 1, 1, 5, 2, 2, 4] },
    ];
    const PRESETS = {
      equilibrado: [5, 3, 2, 2, 3, 4, 3],
      banco: [4, 2, 1, 1, 3, 5, 5],
      startup: [3, 2, 1, 5, 3, 1, 1],
      masivo: [3, 5, 5, 1, 4, 2, 1],
    };

    buttons(root, [
      { label: "⚖️ Equilibrado", value: "equilibrado" },
      { label: "🏦 Banco regulado", value: "banco" },
      { label: "🚀 Startup sin etiquetas", value: "startup" },
      { label: "📦 Volumen masivo", value: "masivo" },
    ], (v) => PRESETS[v].forEach((w, i) => setSlider(sliders[i], w)), "equilibrado");

    const ctr = controls(root);
    const sliders = CRIT.map((c) => slider(ctr, c.label, { min: 0, max: 5, step: 1, value: c.w, fmt: (v) => String(v) }, render));

    const list = h("ol", { class: "c5-rank", "aria-label": "Ranking de enfoques según los pesos" });
    root.append(list);
    const rows = ENF.map((e) => {
      const pos = h("span", { class: "c5-rank-pos" }, "1");
      const fill = h("span", { class: "c5-rank-fill" });
      const val = h("span", { class: "c5-rank-val" }, "—");
      const li = h("li", { class: "c5-rank-row" }, pos, h("span", { class: "c5-rank-name" }, e.name),
        h("span", { class: "c5-rank-track" }, fill), val);
      list.append(li);
      return { e, li, pos, fill, val, score: 0 };
    });

    const setWin = stat(root, "🥇 Ganador", "—", "is-gold");
    const setGap = stat(root, "Ventaja sobre el 2.º", "—");
    const setTie = stat(root, "Lectura", "—");

    let lastOrder = "";
    let lastWinner = "";
    function render() {
      const w = sliders.map((s) => +s.value);
      const sw = w.reduce((a, b) => a + b, 0);
      rows.forEach((r) => {
        r.score = sw ? r.e.s.reduce((acc, s, i) => acc + s * w[i], 0) / sw : 0;
        r.val.textContent = sw ? fmtNum(r.score, 2) : "—";
        r.fill.style.width = (sw ? (r.score / 5) * 100 : 0) + "%";
      });
      const sorted = [...rows].sort((a, b) => b.score - a.score);
      const order = sorted.map((r) => r.e.name).join("|");
      if (order !== lastOrder) {
        const els = rows.map((r) => r.li);
        flip(els, () => sorted.forEach((r, i) => { r.pos.textContent = String(i + 1); list.append(r.li); }));
        rows.forEach((r) => r.li.classList.toggle("is-top", r === sorted[0]));
        lastOrder = order;
      }
      if (!sw) {
        setWin("—"); setGap("—"); setTie("Pon al menos un peso > 0");
        return;
      }
      const gap = sorted[0].score - sorted[1].score;
      setWin(sorted[0].e.name);
      setGap(fmtNum(gap, 2) + " pts");
      setTie(gap < 0.15 ? "⚠️ Casi empate: decisión frágil" : gap < 0.4 ? "Ventaja moderada" : "Ventaja clara");
      if (lastWinner && sorted[0].e.name !== lastWinner) motion.pop(sorted[0].li);
      lastWinner = sorted[0].e.name;
    }
    render();
    note(root, "💡 Qué mirar: con el perfil <strong>banco regulado</strong>, privacidad y explicabilidad dejan arriba a la logística; " +
      "con <strong>startup sin etiquetas</strong>, el LLM pasa adelante, pero por muy poco. Cuando el indicador dice " +
      "«casi empate», tu recomendación debe decir de qué prioridad depende.");
  });

  /* ======================================================================
     2) c5-roi · calculadora de ROI
     ====================================================================== */
  register("c5-roi", (root) => {
    panel(root, "💰 Calculadora de ROI: automatizar la derivación de reclamos",
      "Mueve los supuestos o elige un escenario. La cascada muestra cómo el ahorro bruto se transforma en beneficio neto. " +
      "<em>Valores ilustrativos en pesos chilenos.</em>");

    const ESC = {
      pesimista: [4000, 4, 10000, 50, 8, 25000, 3000, 900000, 8000000],
      base: [6000, 6, 12000, 70, 4, 15000, 1000, 600000, 8000000],
      optimista: [8000, 8, 14000, 80, 3, 10000, 500, 400000, 8000000],
    };
    buttons(root, [
      { label: "🌧️ Pesimista", value: "pesimista" },
      { label: "⛅ Base", value: "base" },
      { label: "☀️ Optimista", value: "optimista" },
    ], (v) => { animateNext = true; ESC[v].forEach((x, i) => setSlider(sl[i], x)); animateNext = false; finish(); }, "base");

    const ctr = controls(root);
    const sl = [
      slider(ctr, "Reclamos por mes", { min: 500, max: 20000, step: 500, value: 6000, fmt: (v) => fmtNum(v) }, render),
      slider(ctr, "Minutos por caso", { min: 1, max: 15, step: 1, value: 6, fmt: (v) => v + " min" }, render),
      slider(ctr, "Costo hora ejecutivo", { min: 6000, max: 30000, step: 1000, value: 12000, fmt: fmtCLP }, render),
      slider(ctr, "% automatizable", { min: 0, max: 100, step: 5, value: 70, fmt: (v) => v + " %" }, render),
      slider(ctr, "Error en automatizados", { min: 0, max: 20, step: 0.5, value: 4, fmt: (v) => fmtNum(v, 1) + " %" }, render),
      slider(ctr, "Costo por error", { min: 0, max: 100000, step: 1000, value: 15000, fmt: fmtCLP }, render),
      slider(ctr, "Costo API por 1.000 casos", { min: 0, max: 10000, step: 100, value: 1000, fmt: fmtCLP }, render),
      slider(ctr, "Mantención mensual", { min: 0, max: 2000000, step: 50000, value: 600000, fmt: fmtCLP }, render),
      slider(ctr, "Inversión inicial (única)", { min: 0, max: 30000000, step: 500000, value: 8000000, fmt: fmtM }, render),
    ];

    const setNet = stat(root, "Beneficio neto mensual", "—", "is-gold");
    const setPay = stat(root, "Payback", "—");
    const setRoi = stat(root, "ROI a 12 meses", "—");
    const setEq = stat(root, "Error máx. tolerable", "—");
    const netStrong = root.querySelector(".econ-stats .econ-stat strong");

    // Cascada (waterfall) en SVG
    const W = 640, H = 270, L = 70, R = 20, T = 18, B = 46;
    const plot = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "ia-svg c5-roi-svg", role: "img",
      "aria-label": "Cascada: ahorro bruto menos costo de errores, API y mantención da el beneficio neto mensual" });
    root.append(plot);
    const zero = svg("line", { x1: L, x2: W - R, class: "ia-axis" });
    plot.append(zero);
    const NAMES = ["Ahorro bruto", "− Errores", "− API", "− Mantención", "= Neto"];
    const slot = (W - L - R) / NAMES.length;
    const bars = NAMES.map((n, i) => {
      const x = L + i * slot + slot * 0.18;
      const rect = svg("rect", { x, width: slot * 0.64, y: T, height: 0, rx: 4, class: "c5-wf-bar" });
      const lbl = svg("text", { x: x + slot * 0.32, y: H - B + 18, "text-anchor": "middle", class: "c5-wf-lbl" }, n);
      const val = svg("text", { x: x + slot * 0.32, y: T, "text-anchor": "middle", class: "c5-wf-val" }, "");
      plot.append(rect, lbl, val);
      return { rect, val, cls: i === 0 ? "is-pos" : i === 4 ? "is-net" : "is-neg" };
    });
    const conn = [0, 1, 2, 3].map(() => {
      const l = svg("line", { class: "c5-wf-conn" });
      plot.append(l);
      return l;
    });

    let animateNext = false;
    let last = null;
    function compute() {
      const [V, m, ch, a, e, ce, api, mant, inv] = sl.map((s) => +s.value);
      const auto = V * a / 100;
      const ahorro = auto * m / 60 * ch;
      const errores = auto * (e / 100) * ce;
      const costoApi = V / 1000 * api;
      const neto = ahorro - errores - costoApi - mant;
      const eq = auto * ce > 0 ? (ahorro - costoApi - mant) / (auto * ce) : Infinity;
      return { V, auto, ahorro, errores, costoApi, mant, neto, inv, eq, horas: auto * m / 60 };
    }

    function draw(r, animate) {
      const steps = [
        [0, r.ahorro],
        [r.ahorro, r.ahorro - r.errores],
        [r.ahorro - r.errores, r.ahorro - r.errores - r.costoApi],
        [r.ahorro - r.errores - r.costoApi, r.neto],
        [0, r.neto],
      ];
      const lo = Math.min(0, r.neto, ...steps.map((s) => Math.min(s[0], s[1])));
      const hi = Math.max(1, r.ahorro);
      const y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
      zero.setAttribute("y1", y(0));
      zero.setAttribute("y2", y(0));
      steps.forEach(([a, b], i) => {
        const top = y(Math.max(a, b));
        const hgt = Math.max(1, Math.abs(y(a) - y(b)));
        const bar = bars[i];
        bar.rect.setAttribute("class", "c5-wf-bar " + (i === 4 && r.neto < 0 ? "is-neg" : bar.cls));
        if (animate) {
          motion.attr(bar.rect, "y", top, { duration: motion.DUR.slow, ease: motion.EASE.back });
          motion.attr(bar.rect, "height", hgt, { duration: motion.DUR.slow, ease: motion.EASE.back });
        } else {
          bar.rect.setAttribute("y", top);
          bar.rect.setAttribute("height", hgt);
        }
        bar.val.setAttribute("y", Math.max(12, top - 6));
        const amount = i === 0 ? r.ahorro : i === 4 ? r.neto : -(Math.abs(a - b));
        bar.val.textContent = fmtM(amount);
        if (i < 4) {
          const x1 = +bar.rect.getAttribute("x") + slot * 0.64;
          conn[i].setAttribute("x1", x1);
          conn[i].setAttribute("x2", x1 + slot * 0.36);
          conn[i].setAttribute("y1", y(b));
          conn[i].setAttribute("y2", y(b));
        }
      });
    }

    function render() {
      if (animateNext) return; // el escenario fija varios deslizadores; dibuja una sola vez al final
      const r = compute();
      draw(r, false);
      stats(r, false);
    }

    function stats(r, animate) {
      if (animate && last) {
        motion.count(netStrong, last.neto, r.neto, fmtCLP);
        motion.pulse(netStrong);
      } else setNet(fmtCLP(r.neto));
      setPay(r.neto > 0 ? fmtNum(r.inv / r.neto, 1) + " meses" : "No se paga");
      const roi12 = (12 * r.neto - r.inv) / Math.max(1, r.inv) * 100;
      setRoi((roi12 < 0 ? "−" : "") + fmtNum(Math.abs(roi12), 0) + " %");
      setEq(!isFinite(r.eq) ? "Sin costo de error" : r.eq <= 0 ? "Ni con 0 % errores" : r.eq >= 1 ? "> 100 %" : fmtNum(r.eq * 100, 1) + " %");
      netStrong.closest(".econ-stat").classList.toggle("is-red", r.neto < 0);
      last = r;
    }

    function finish() {
      const r = compute();
      draw(r, true);
      stats(r, true);
    }

    const r0 = compute();
    draw(r0, false);
    stats(r0, false);
    note(root, "💡 Qué mirar: sube el <strong>costo por error</strong> hasta ~$40.000 (lo que puede costar un fraude mal derivado) y mira " +
      "cómo la barra de errores se come el ahorro. Luego baja el <strong>% automatizable</strong>: si dejas los casos caros a una persona, " +
      "el neto mejora aunque automatices menos.");
  });

  /* ======================================================================
     3) c5-bootstrap · bootstrap pareado de la diferencia de accuracy
     ====================================================================== */
  register("c5-bootstrap", (root) => {
    panel(root, "🎲 ¿Diferencia real o suerte? Bootstrap pareado",
      "Dos modelos se evalúan sobre los <strong>mismos</strong> casos de test. Elige cuántos casos tienes y la accuracy de cada uno; " +
      "el simulador remuestrea 1.000 veces y dibuja la distribución de la diferencia B − A.");

    const ctr = controls(root);
    const sN = slider(ctr, "Casos de test", { min: 50, max: 2000, step: 50, value: 100, fmt: (v) => fmtNum(v) }, render);
    const sA = slider(ctr, "Accuracy modelo A", { min: 70, max: 95, step: 1, value: 82, fmt: (v) => v + " %" }, render);
    const sB = slider(ctr, "Accuracy modelo B", { min: 70, max: 95, step: 1, value: 85, fmt: (v) => v + " %" }, render);
    const bt = h("div", { class: "econ-buttons" });
    root.append(bt);
    let seed = 7;
    let azar = false;   // false = test con las accuracies exactas; true = test sorteado (varía por azar)
    btn(bt, "🎲 Sortear otro conjunto de test", () => { azar = true; seed += 1; render(true); }, "econ-btn-gold");
    btn(bt, "↺ Caso exacto", () => { azar = false; render(true); }, "econ-btn-ghost");

    const setDiff = stat(root, "Diferencia observada", "—", "is-gold");
    const setIC = stat(root, "IC 95 % (B − A)", "—");
    const setWin = stat(root, "B gana en", "—");
    const setVer = stat(root, "Veredicto", "—");
    const verCard = root.querySelectorAll(".econ-stats .econ-stat")[3];

    const W = 640, H = 240, L = 30, R = 20, T = 16, B = 40, NB = 31, RANGE = 0.2;
    const plot = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "ia-svg", role: "img",
      "aria-label": "Histograma de la diferencia de accuracy entre B y A en 1.000 remuestreos bootstrap" });
    root.append(plot);
    const xs = (d) => L + (d + RANGE) / (2 * RANGE) * (W - L - R);
    const band = svg("rect", { y: T, height: H - T - B, x: xs(0), width: 0, class: "c5-bs-band" });
    plot.append(band);
    const binW = (W - L - R) / NB;
    const hist = Array.from({ length: NB }, (_, i) => {
      const r = svg("rect", { x: L + i * binW + 1, width: binW - 2, y: H - B, height: 0, rx: 2, class: "c5-bs-bar" });
      plot.append(r);
      return r;
    });
    plot.append(svg("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, class: "ia-axis" }));
    [-0.2, -0.1, 0, 0.1, 0.2].forEach((d) => {
      plot.append(svg("text", { x: xs(d), y: H - B + 16, "text-anchor": "middle" }, (d > 0 ? "+" : d < 0 ? "−" : "") + fmtNum(Math.abs(d) * 100, 0) + " pp"));
    });
    plot.append(svg("text", { x: W - R, y: H - 6, "text-anchor": "end", class: "c5-muted" }, "diferencia de accuracy B − A"));
    const zeroL = svg("line", { x1: xs(0), x2: xs(0), y1: T, y2: H - B, class: "c5-bs-zero" });
    const obsL = svg("line", { x1: xs(0), x2: xs(0), y1: T, y2: H - B, class: "c5-bs-obs" });
    const zeroT = svg("text", { x: xs(0) + 4, y: T + 10, class: "c5-bs-zero-t" }, "0 = empate");
    plot.append(zeroL, obsL, zeroT);

    function simulate() {
      const n = +sN.value, pA = +sA.value / 100, pB = +sB.value / 100;
      const delta = pB - pA;
      const d = Math.min(Math.abs(delta) + 0.06, 1);           // fracción de desacuerdos
      let b = (d - delta) / 2, c = (d + delta) / 2;              // solo A / solo B
      const both = Math.max(0, pA - b);
      const r = rng(seed * 1000 + n);
      // Conjunto de test: ambos bien / solo A / solo B / ambos mal
      const okA = new Uint8Array(n), okB = new Uint8Array(n);
      if (!azar) {
        // Caso exacto: el test tiene justo las accuracies elegidas
        const nA = Math.round(pA * n), nB = Math.round(pB * n);
        const nb = Math.max(0, Math.round((Math.round(d * n) - (nB - nA)) / 2));
        const nc = nb + (nB - nA);
        const nBoth = Math.max(0, nA - nb);
        for (let i = 0; i < n; i++) {
          if (i < nBoth) { okA[i] = 1; okB[i] = 1; }
          else if (i < nBoth + nb) { okA[i] = 1; }
          else if (i < nBoth + nb + nc) { okB[i] = 1; }
        }
      } else {
        // Test sorteado: cada caso cae en una de las cuatro celdas al azar
        for (let i = 0; i < n; i++) {
          const u = r();
          if (u < both) { okA[i] = 1; okB[i] = 1; }
          else if (u < both + b) { okA[i] = 1; }
          else if (u < both + b + c) { okB[i] = 1; }
        }
      }
      let sa = 0, sb = 0;
      for (let i = 0; i < n; i++) { sa += okA[i]; sb += okB[i]; }
      const obs = (sb - sa) / n;
      const NBOOT = 1000;
      const diffs = new Float64Array(NBOOT);
      for (let k = 0; k < NBOOT; k++) {
        let s = 0;
        for (let i = 0; i < n; i++) { const j = (r() * n) | 0; s += okB[j] - okA[j]; }
        diffs[k] = s / n;
      }
      diffs.sort();
      return { n, obs, diffs, lo: diffs[Math.floor(0.025 * NBOOT)], hi: diffs[Math.floor(0.975 * NBOOT) - 1],
        win: diffs.filter((x) => x > 0).length / NBOOT };
    }

    function render(animate) {
      const s = simulate();
      const counts = new Array(NB).fill(0);
      s.diffs.forEach((d) => {
        const i = Math.floor((d + RANGE) / (2 * RANGE) * NB);
        counts[Math.max(0, Math.min(NB - 1, i))]++;
      });
      const mx = Math.max(...counts);
      counts.forEach((c, i) => {
        const hgt = (c / mx) * (H - T - B - 10);
        hist[i].setAttribute("y", H - B - hgt);
        hist[i].setAttribute("height", hgt);
      });
      const clamp = (d) => Math.max(-RANGE, Math.min(RANGE, d));
      const bx = xs(clamp(s.lo)), bw = Math.max(1, xs(clamp(s.hi)) - bx), ox = xs(clamp(s.obs));
      if (animate === true) {
        motion.attr(band, "x", bx); motion.attr(band, "width", bw);
        motion.attr(obsL, "x1", ox); motion.attr(obsL, "x2", ox);
      } else {
        band.setAttribute("x", bx); band.setAttribute("width", bw);
        obsL.setAttribute("x1", ox); obsL.setAttribute("x2", ox);
      }
      const pp = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + fmtNum(Math.abs(v) * 100, 1) + " pp";
      setDiff(pp(s.obs));
      setIC("[" + pp(s.lo) + " ; " + pp(s.hi) + "]");
      setWin(fmtNum(s.win * 100, 0) + " % de remuestreos");
      const real = s.lo > 0 || s.hi < 0;
      setVer(real ? (s.lo > 0 ? "✅ B es mejor" : "✅ A es mejor") : "🤷 Podría ser suerte");
      verCard.classList.toggle("is-gold", real);
      if (animate === true) (real ? motion.pop : motion.shake)(verCard);
    }
    render();
    note(root, "💡 Qué mirar: con 100 casos, 82 % vs 85 % produce un intervalo que cruza el cero (la franja dorada contiene la línea roja). " +
      "Sube a 1.000 casos: la franja se angosta y la misma diferencia pasa a ser real. Presiona «Sortear otro conjunto de test» para ver " +
      "cuánto cambia el resultado solo por azar: con 100 casos, a veces B «gana» por 6 puntos y a veces pierde.");
  });

  /* ======================================================================
     4) c5-piramide · ordenar afirmaciones en la pirámide del pitch
     ====================================================================== */
  register("c5-piramide", (root) => {
    panel(root, "🔺 Arma la pirámide del pitch de FinTrust",
      "Cada tarjeta es una afirmación de una presentación. Usa <strong>▲ Subir</strong> y <strong>▼ Bajar</strong> para llevarla a su nivel: " +
      "<em>Mensaje principal</em> (1 sola idea), <em>Argumentos</em>, <em>Evidencia</em> o <em>Anexo</em> (no se presenta). Luego presiona «Revisar».");

    // nivel: 0 = por ubicar, 1 = anexo, 2 = evidencia, 3 = argumento, 4 = mensaje principal
    const LEVELS = [
      { n: 4, t: "🔺 Mensaje principal", cls: "is-top" },
      { n: 3, t: "🧱 Argumentos (3)", cls: "is-arg" },
      { n: 2, t: "📊 Evidencia", cls: "is-ev" },
      { n: 1, t: "📎 Anexo (backup, no se presenta)", cls: "is-annex" },
      { n: 0, t: "🗂️ Por ubicar", cls: "is-pool" },
    ];
    const CARDS = [
      { t: "Recomendamos derivar automáticamente los reclamos con un clasificador TF-IDF y revisión humana de Fraude: libera ~420 horas al mes.", lv: 4,
        why: "Es la recomendación con su cifra de impacto: va en la cima y en la lámina 1." },
      { t: "Funciona: 9 de cada 10 reclamos llegan solos al área correcta.", lv: 3,
        why: "Es una de las tres razones (calidad) que sostienen la recomendación: es un argumento." },
      { t: "Vale la pena: ahorra ~$1,9 millones al mes y se paga en 4 meses.", lv: 3,
        why: "Es la razón de valor: un argumento, que luego se respalda con los escenarios de ROI." },
      { t: "Es seguro: los fraudes y los casos de baja confianza siempre pasan por una persona.", lv: 3,
        why: "Es la razón de riesgo/implementación: completa los tres argumentos MECE." },
      { t: "Accuracy 0,90 en 600 reclamos de test (IC 95 %: 0,88–0,92).", lv: 2,
        why: "Es un dato que respalda el argumento «funciona»: evidencia." },
      { t: "Escenarios de ROI: neto positivo en el base y el optimista; el pesimista requiere sacar Fraude.", lv: 2,
        why: "Respalda el argumento de valor con números: evidencia." },
      { t: "Recall de Fraude 0,95: de cada 20 fraudes, 19 llegan directo a Seguridad.", lv: 2,
        why: "Respalda el argumento de seguridad con una métrica traducida: evidencia." },
      { t: "Curva de pérdida de la MLP por época.", lv: 1,
        why: "Es un detalle técnico que el comité no necesita para decidir: anexo, por si preguntan." },
      { t: "Hiperparámetros del TF-IDF (ngram_range, min_df, C).", lv: 1,
        why: "Detalle técnico: va al anexo." },
      { t: "Prompt few-shot completo usado en el Sprint 3.", lv: 1,
        why: "Útil si preguntan cómo se probó el LLM, pero no sostiene la recomendación: anexo." },
    ];

    const board = h("div", { class: "c5-pyr", role: "group", "aria-label": "Pirámide del pitch" });
    root.append(board);
    const zones = {};
    LEVELS.forEach((L) => {
      const zone = h("div", { class: "c5-pyr-zone" });
      const box = h("div", { class: "c5-pyr-level " + L.cls }, h("p", { class: "c5-pyr-lt" }, L.t), zone);
      board.append(box);
      zones[L.n] = zone;
    });

    // Orden inicial barajado (fijo para que todos vean lo mismo)
    const ORDER = [6, 1, 8, 0, 4, 9, 2, 5, 7, 3];
    const items = CARDS.map((c, idx) => {
      const up = h("button", { type: "button", class: "c5-card-btn", "aria-label": "Subir un nivel: " + c.t }, "▲");
      const down = h("button", { type: "button", class: "c5-card-btn", "aria-label": "Bajar un nivel: " + c.t }, "▼");
      const el = h("div", { class: "c5-card" }, h("span", { class: "c5-card-t" }, c.t), h("span", { class: "c5-card-ctl" }, up, down));
      const it = { c, idx, el, up, down, lv: 0 };
      up.addEventListener("click", () => move(it, +1));
      down.addEventListener("click", () => move(it, -1));
      return it;
    });
    ORDER.forEach((i) => zones[0].append(items[i].el));
    refreshButtons();

    const bt = h("div", { class: "econ-buttons" });
    root.append(bt);
    btn(bt, "✔ Revisar", check, "econ-btn-gold");
    btn(bt, "💡 Ver solución", solve, "econ-btn-ghost");
    btn(bt, "↺ Reiniciar", reset, "econ-btn-ghost");
    const setScore = stat(root, "Bien ubicadas", "— de 10", "is-gold");
    const msg = note(root, "Empieza por la tarjeta que responde «¿qué recomiendas?»: esa es la cima.");

    function allEls() { return items.map((i) => i.el); }
    function refreshButtons() {
      items.forEach((it) => { it.up.disabled = it.lv >= 4; it.down.disabled = it.lv <= 0; });
    }
    function clearMarks() { items.forEach((it) => it.el.classList.remove("is-right", "is-wrong")); }

    function move(it, d) {
      const to = Math.max(0, Math.min(4, it.lv + d));
      if (to === it.lv) return;
      clearMarks();
      flip(allEls(), () => { it.lv = to; zones[to].append(it.el); });
      refreshButtons();
    }

    function check() {
      clearMarks();
      let ok = 0;
      const wrong = [];
      items.forEach((it) => {
        const good = it.lv === it.c.lv;
        if (good) ok++; else wrong.push(it);
      });
      setScore(ok + " de 10");
      const placed = items.filter((it) => it.lv > 0);
      // feedback: pop a las correctas (las primeras 3, para no mover todo a la vez) y sacudida a las incorrectas ubicadas
      items.filter((it) => it.lv === it.c.lv).forEach((it, i) => { it.el.classList.add("is-right"); if (i < 3) motion.pop(it.el); });
      wrong.filter((it) => it.lv > 0).forEach((it) => { it.el.classList.add("is-wrong"); motion.shake(it.el); });
      const tops = items.filter((it) => it.lv === 4).length;
      if (ok === 10) {
        msg.innerHTML = "🎉 ¡Pirámide completa! Una idea arriba, tres argumentos MECE (funciona · vale la pena · es seguro), " +
          "evidencia que los respalda y los detalles técnicos en el anexo. Esa es la estructura de tu pitch.";
        motion.pop(board);
      } else if (tops > 1) {
        msg.textContent = "⚠️ La cima admite una sola idea: si tienes dos «mensajes principales», el gerente no sabe cuál decidir.";
      } else if (placed.length < 10) {
        msg.textContent = `Llevas ${ok} bien. Aún quedan ${10 - placed.length} tarjetas por ubicar.`;
      } else {
        const w = wrong[0];
        msg.textContent = `Llevas ${ok} de 10. Pista para «${w.c.t.slice(0, 48)}…»: ${w.c.why}`;
      }
    }

    function solve() {
      clearMarks();
      flip(allEls(), () => {
        items.forEach((it) => { it.lv = it.c.lv; });
        [4, 3, 2, 1].forEach((lv) => items.filter((it) => it.lv === lv).forEach((it) => zones[lv].append(it.el)));
      });
      refreshButtons();
      setScore("10 de 10");
      msg.textContent = "Así queda la pirámide: compárala con la tuya y lee por qué cada tarjeta va en su nivel (vuelve a «Revisar» tras mover algo).";
    }

    function reset() {
      clearMarks();
      flip(allEls(), () => { items.forEach((it) => { it.lv = 0; }); ORDER.forEach((i) => zones[0].append(items[i].el)); });
      refreshButtons();
      setScore("— de 10");
      msg.textContent = "Empieza por la tarjeta que responde «¿qué recomiendas?»: esa es la cima.";
    }
  });
})();
