/* widgets-clase1.js — Simuladores de la Clase 1 (Redes neuronales en la práctica)
   c1-neurona   · una neurona: suma ponderada + activación (sigmoide, ReLU, tanh)
   c1-frontera  · una red pequeña (MLP) que se entrena en vivo y dibuja su frontera
   c1-gradiente · descenso de gradiente y tasa de aprendizaje, paso a paso
   c1-curvas    · curvas de entrenamiento vs. validación: sobreajuste, dropout, early stopping
   c1-costos    · matriz de confusión con ojos de negocio: umbral y costo de cada error */
(function () {
  "use strict";
  const { h, svg, motion, panel, controls, slider, btn, buttons, stat, note, register } = window.IA;

  /* ---------- utilidades ---------- */
  const sigm = (z) => 1 / (1 + Math.exp(-z));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt2 = (v) => v.toFixed(2).replace(".", ",");
  const fmt1 = (v) => v.toFixed(1).replace(".", ",");
  const signed = (v) => (v < 0 ? "−" + fmt2(-v) : fmt2(v));
  /** Generador pseudoaleatorio con semilla (mulberry32) para que los datos sean siempre los mismos. */
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
  function gauss(r) {
    const u = Math.max(r(), 1e-9), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  /** Interpolación numérica con Motion (o salto directo si no hay Motion / movimiento reducido). */
  function tween(from, to, onUpdate, opts = {}) {
    const M = window.Motion;
    if (!M || motion.reduced()) { onUpdate(to); return Promise.resolve(); }
    return M.animate(from, to, Object.assign({ duration: motion.DUR.slow, ease: motion.EASE.out, onUpdate }, opts)).finished;
  }
  /** Botón de alternancia (on/off) accesible. */
  function toggle(parent, label, onChange) {
    const b = h("button", { type: "button", class: "econ-btn econ-btn-ghost", "aria-pressed": "false" }, label);
    b.addEventListener("click", () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      motion.anim(b, { scale: [0.95, 1] }, { duration: motion.DUR.quick, ease: motion.EASE.back });
      onChange(on);
    });
    parent.append(b);
    return b;
  }
  const line = (x1, y1, x2, y2, cls) => svg("line", { x1, y1, x2, y2, class: cls });
  const txt = (x, y, s, attrs = {}) => svg("text", Object.assign({ x, y }, attrs), s);

  /* ======================================================================
     1) c1-neurona
     ====================================================================== */
  register("c1-neurona", (root) => {
    panel(root, "🧠 Una neurona que decide si un reclamo es urgente",
      "Mueve las <strong>entradas</strong> (cómo es el reclamo) y los <strong>pesos</strong> (cuánto importa cada cosa). " +
      "Cambia la <strong>activación</strong> y mira cómo la suma ponderada <em>z</em> se transforma en la salida.");

    const ctrIn = controls(root);
    const x1 = slider(ctrIn, "x₁ · Palabras de alarma", { min: 0, max: 5, step: 1, value: 2, fmt: (v) => v.toFixed(0) }, () => render());
    const x2 = slider(ctrIn, "x₂ · Monto reclamado (millones $)", { min: 0, max: 2, step: 0.05, value: 0.4, fmt: fmt2 }, () => render());
    const ctrW = controls(root);
    const w1 = slider(ctrW, "Peso w₁", { min: -3, max: 3, step: 0.1, value: 1.2, fmt: signed }, () => render());
    const w2 = slider(ctrW, "Peso w₂", { min: -3, max: 3, step: 0.1, value: 2, fmt: signed }, () => render());
    const bb = slider(ctrW, "Sesgo b", { min: -6, max: 3, step: 0.1, value: -3, fmt: signed }, () => render());

    const ACT = {
      sig: { f: sigm, lo: -0.1, hi: 1.1, name: "sigmoide", ticks: [0, 0.5, 1] },
      relu: { f: (z) => Math.max(0, z), lo: -0.5, hi: 6, name: "ReLU", ticks: [0, 2, 4, 6] },
      tanh: { f: Math.tanh, lo: -1.1, hi: 1.1, name: "tanh", ticks: [-1, 0, 1] },
    };
    let act = "sig";
    buttons(root, [
      { label: "Sigmoide", value: "sig" },
      { label: "ReLU", value: "relu" },
      { label: "tanh", value: "tanh" },
    ], (v) => { act = v; render(true); }, "sig");

    const formula = h("p", { class: "c1-formula", "aria-live": "polite" });
    root.append(formula);

    const plot = svg("svg", { viewBox: "0 0 640 270", class: "ia-svg", role: "img",
      "aria-label": "Diagrama de una neurona con dos entradas y gráfico de su función de activación" });
    root.append(plot);

    // --- diagrama de la neurona (izquierda)
    const N = { x: 205, y: 140 }, I1 = { x: 48, y: 78 }, I2 = { x: 48, y: 202 }, B = { x: 205, y: 34 }, O = { x: 300, y: 140 };
    const e1 = line(I1.x + 22, I1.y, N.x - 34, N.y, "c1-edge");
    const e2 = line(I2.x + 22, I2.y, N.x - 34, N.y, "c1-edge");
    const eb = line(B.x, B.y + 14, N.x, N.y - 34, "c1-edge");
    const eo = line(N.x + 34, N.y, O.x - 24, O.y, "c1-edge c1-edge-out");
    const lw1 = txt(118, 96, "", { class: "c1-wlbl", "text-anchor": "middle" });
    const lw2 = txt(118, 196, "", { class: "c1-wlbl", "text-anchor": "middle" });
    const lb = txt(B.x + 16, B.y + 4, "", { class: "c1-wlbl" });
    const in1 = txt(I1.x, I1.y + 4, "", { "text-anchor": "middle", class: "c1-node-t" });
    const in2 = txt(I2.x, I2.y + 4, "", { "text-anchor": "middle", class: "c1-node-t" });
    const outCircle = svg("circle", { cx: O.x, cy: O.y, r: 24, class: "c1-out" });
    const outT = txt(O.x, O.y + 4, "", { "text-anchor": "middle", class: "c1-node-t" });
    plot.append(
      e1, e2, eb, eo,
      svg("circle", { cx: I1.x, cy: I1.y, r: 22, class: "c1-node" }), in1,
      svg("circle", { cx: I2.x, cy: I2.y, r: 22, class: "c1-node" }), in2,
      txt(I1.x, I1.y - 30, "x₁ alarma", { "text-anchor": "middle", class: "c1-small" }),
      txt(I2.x, I2.y + 38, "x₂ monto", { "text-anchor": "middle", class: "c1-small" }),
      svg("circle", { cx: B.x, cy: B.y, r: 13, class: "c1-node" }),
      txt(B.x, B.y + 4, "1", { "text-anchor": "middle", class: "c1-node-t" }), lb,
      svg("circle", { cx: N.x, cy: N.y, r: 34, class: "c1-neuron" }),
      txt(N.x, N.y - 4, "Σ  →  f", { "text-anchor": "middle", class: "c1-node-t" }),
      txt(N.x, N.y + 13, "", { "text-anchor": "middle", class: "c1-small c1-actname" }),
      lw1, lw2, outCircle, outT,
      txt(O.x, O.y + 40, "salida", { "text-anchor": "middle", class: "c1-small" })
    );
    const actName = plot.querySelector(".c1-actname");

    // --- gráfico de la activación (derecha)
    const P = { x0: 360, x1: 625, y0: 28, y1: 240 }, ZR = 6;
    const gx = (z) => P.x0 + ((clamp(z, -ZR, ZR) + ZR) / (2 * ZR)) * (P.x1 - P.x0);
    let lo = ACT.sig.lo, hi = ACT.sig.hi;
    const gy = (v) => P.y1 - ((v - lo) / (hi - lo)) * (P.y1 - P.y0);
    const gAxes = svg("g", {});
    const curve = svg("path", { class: "c1-curve", fill: "none" });
    const guideV = line(0, 0, 0, 0, "c1-guide");
    const guideH = line(0, 0, 0, 0, "c1-guide");
    const dot = svg("circle", { r: 7, class: "c1-dot" });
    const zLbl = txt(0, P.y1 + 16, "", { "text-anchor": "middle", class: "c1-small" });
    plot.append(gAxes, curve, guideV, guideH, dot, zLbl,
      txt((P.x0 + P.x1) / 2, P.y1 + 30, "z = suma ponderada", { "text-anchor": "middle", class: "c1-small" }));

    function drawAxes() {
      gAxes.replaceChildren();
      const A = ACT[act];
      gAxes.append(line(P.x0, gy(0), P.x1, gy(0), "ia-axis"), line(gx(0), P.y0, gx(0), P.y1, "ia-axis"));
      A.ticks.forEach((t) => {
        gAxes.append(line(P.x0, gy(t), P.x1, gy(t), "ia-grid"),
          txt(P.x0 - 6, gy(t) + 4, String(t).replace(".", ","), { "text-anchor": "end", class: "c1-small" }));
      });
      [-6, -3, 3, 6].forEach((z) => gAxes.append(txt(gx(z), gy(0) + 14, String(z), { "text-anchor": "middle", class: "c1-small" })));
      gAxes.append(txt(P.x0, P.y0 - 10, "f(z) · " + A.name, { class: "c1-small c1-bold" }));
      let d = "";
      for (let i = 0; i <= 120; i++) {
        const z = -ZR + (2 * ZR * i) / 120;
        d += (i ? "L" : "M") + gx(z).toFixed(1) + "," + gy(A.f(z)).toFixed(1);
      }
      curve.setAttribute("d", d);
    }

    let lastRead = "";
    let readSet = null;
    const setZ = stat(root, "z = w₁x₁ + w₂x₂ + b", "—");
    const setA = stat(root, "Salida f(z)", "—", "is-gold");
    readSet = stat(root, "Lectura", "—");
    const readCard = root.querySelectorAll(".econ-stat")[2];

    function render(actChanged) {
      const A = ACT[act];
      lo = A.lo; hi = A.hi;
      const X1 = +x1.value, X2 = +x2.value, W1 = +w1.value, W2 = +w2.value, Bv = +bb.value;
      const z = W1 * X1 + W2 * X2 + Bv;
      const a = A.f(z);

      // aristas: grosor = |peso|, color = signo
      [[e1, W1], [e2, W2], [eb, Bv / 2]].forEach(([e, w]) => {
        e.setAttribute("stroke-width", (1 + Math.abs(w) * 2.2).toFixed(1));
        e.classList.toggle("is-neg", w < 0);
      });
      lw1.textContent = "w₁ = " + signed(W1);
      lw2.textContent = "w₂ = " + signed(W2);
      lb.textContent = "b = " + signed(Bv);
      in1.textContent = X1.toFixed(0);
      in2.textContent = fmt2(X2);
      actName.textContent = A.name;
      outT.textContent = act === "relu" ? fmt1(a) : fmt2(a);
      const strength = act === "sig" ? a : act === "tanh" ? (a + 1) / 2 : Math.min(a / 6, 1);
      outCircle.style.fillOpacity = (0.12 + 0.75 * strength).toFixed(2);

      formula.textContent = `z = ${signed(W1)}·${X1} + ${signed(W2)}·${fmt2(X2)} + (${signed(Bv)}) = ${signed(z)}   →   ${A.name}(z) = ${act === "relu" ? fmt1(a) : fmt2(a)}`;

      if (actChanged) {
        drawAxes();
        motion.anim(curve, { opacity: [0, 1] }, { duration: motion.DUR.std, ease: motion.EASE.out });
      }
      const cx = gx(z), cy = gy(clamp(a, lo, hi)); // ReLU puede salirse del gráfico: lo topamos
      guideV.setAttribute("x1", cx); guideV.setAttribute("x2", cx);
      guideV.setAttribute("y1", gy(0)); guideV.setAttribute("y2", cy);
      guideH.setAttribute("x1", gx(0)); guideH.setAttribute("x2", cx);
      guideH.setAttribute("y1", cy); guideH.setAttribute("y2", cy);
      zLbl.setAttribute("x", cx);
      zLbl.textContent = Math.abs(z) > ZR ? (z > 0 ? "z → " + fmt1(z) : fmt1(z) + " ← z") : "";
      if (actChanged) {
        motion.attr(dot, "cy", cy, { duration: motion.DUR.slow, ease: motion.EASE.back });
        dot.setAttribute("cx", cx);
      } else {
        dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
      }

      setZ(signed(z));
      setA(act === "relu" ? fmt1(a) : fmt2(a));
      let read;
      if (act === "sig") read = a >= 0.5 ? `🚨 Urgente (p = ${fmt2(a)})` : `🟢 Normal (p = ${fmt2(a)})`;
      else if (act === "tanh") read = a >= 0 ? "🚨 Lado “urgente” (≥ 0)" : "🟢 Lado “normal” (< 0)";
      else read = a > 0 ? "🔆 Se activa" : "⚫ Apagada (0)";
      readSet(read);
      if (lastRead && read.slice(0, 3) !== lastRead.slice(0, 3)) motion.pop(readCard);
      lastRead = read;
    }
    drawAxes();
    render();
    note(root, "💡 <strong>Qué mirar:</strong> con la <strong>sigmoide</strong> la salida es una probabilidad entre 0 y 1 " +
      "(¡es exactamente una regresión logística!). Con <strong>ReLU</strong> todo lo negativo se apaga en 0 y lo positivo pasa tal cual: " +
      "no sirve como probabilidad, pero es la activación favorita de las capas ocultas. Prueba un peso w₂ negativo: " +
      "¿tiene sentido de negocio que un monto mayor <em>baje</em> la urgencia?");
  });

  /* ======================================================================
     2) c1-frontera — MLP 2 → H (tanh) → 1 (sigmoide), entrenada con Adam
     ====================================================================== */
  register("c1-frontera", (root) => {
    panel(root, "🕸️ Una red que aprende a separar clientes",
      "En el <strong>anillo</strong> cada punto es un cliente: <strong style='color:var(--usm-gold-text)'>dorado</strong> = se fue, " +
      "<strong style='color:var(--usm-blue)'>azul</strong> = se quedó. En el <strong>XOR</strong>, dorado = compra sospechosa. " +
      "Elige cuántas <strong>neuronas ocultas</strong> tiene la red, " +
      "presiona <strong>Entrenar</strong> y mira cómo la frontera (el fondo) y la pérdida cambian época a época.");

    const DATA = {
      anillo: { label: "Datos: anillo", gen: (r) => {
        const pts = [];
        for (let i = 0; i < 170; i++) {
          const out = i % 2 === 0;
          const rad = out ? 0.78 + 0.12 * gauss(r) : 0.3 * Math.sqrt(r()) + 0.04 * gauss(r);
          const ang = r() * 2 * Math.PI;
          pts.push({ x: rad * Math.cos(ang), y: rad * Math.sin(ang), c: out ? 1 : 0 });
        }
        return pts;
      } },
      xor: { label: "Datos: XOR", gen: (r) => {
        const pts = [];
        for (let i = 0; i < 170; i++) {
          let x = r() * 2 - 1, y = r() * 2 - 1;
          if (Math.abs(x) < 0.08) x += x < 0 ? -0.08 : 0.08;
          if (Math.abs(y) < 0.08) y += y < 0 ? -0.08 : 0.08;
          pts.push({ x: x * 0.95, y: y * 0.95, c: x * y < 0 ? 1 : 0 });
        }
        return pts;
      } },
    };
    let dataKey = "anillo", H = 4, pts = DATA.anillo.gen(rng(7));

    const ctr = h("div", { class: "c1-row" });
    root.append(ctr);
    buttons(ctr, [{ label: "Anillo", value: "anillo" }, { label: "XOR", value: "xor" }], (v) => {
      dataKey = v; pts = DATA[v].gen(rng(v === "anillo" ? 7 : 11)); reset(true);
    }, "anillo");
    buttons(ctr, [0, 2, 4, 8].map((n) => ({ label: n + " ocultas", value: n })), (v) => { H = v; reset(true); }, 4);
    const acts = h("div", { class: "econ-buttons" });
    ctr.append(acts);
    const trainBtn = btn(acts, "▶ Entrenar 300 épocas", () => train(), "econ-btn-gold");
    btn(acts, "↺ Reiniciar pesos", () => reset(true), "econ-btn-ghost");

    const plot = svg("svg", { viewBox: "0 0 640 324", class: "ia-svg", role: "img",
      "aria-label": "Mapa con la frontera de decisión de la red y gráfico de la pérdida por época" });
    root.append(plot);

    // --- mapa (izquierda): dominio [-1.25, 1.25]²
    const M0 = { x: 26, y: 10, s: 288 }, G = 32, D = 1.25;
    const mx = (x) => M0.x + ((x + D) / (2 * D)) * M0.s;
    const my = (y) => M0.y + ((D - y) / (2 * D)) * M0.s;
    const gMap = svg("g", {});
    const cells = [];
    const cw = M0.s / G;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      const r = svg("rect", { x: (M0.x + j * cw).toFixed(2), y: (M0.y + i * cw).toFixed(2), width: (cw + 0.4).toFixed(2), height: (cw + 0.4).toFixed(2), class: "c1-cell" });
      r._x = -D + (j + 0.5) * (2 * D / G);
      r._y = D - (i + 0.5) * (2 * D / G);
      cells.push(r); gMap.append(r);
    }
    const gPts = svg("g", {});
    // Rótulos de los ejes (cambian según los datos)
    const AXES = {
      anillo: ["frecuencia de compra →", "gasto por compra →"],
      xor: ["compra: Chile ← → extranjero", "cliente: en Chile ← → de viaje"],
    };
    const xLbl = txt(M0.x + M0.s / 2, M0.y + M0.s + 16, "", { "text-anchor": "middle", class: "c1-small" });
    const yc = M0.y + M0.s / 2, yx = M0.x - 10; // a la izquierda, lejos del gráfico de pérdida
    const yLbl = txt(yx, yc, "", { "text-anchor": "middle", class: "c1-small", transform: `rotate(-90 ${yx} ${yc})` });
    plot.append(gMap, svg("rect", { x: M0.x, y: M0.y, width: M0.s, height: M0.s, class: "c1-frame" }), gPts, xLbl, yLbl);

    // --- curva de pérdida (derecha)
    const L = { x0: 360, x1: 625, y0: 26, y1: 270 };
    const gL = svg("g", {});
    const lossPath = svg("path", { class: "c1-loss", fill: "none" });
    const lossDot = svg("circle", { r: 4.5, class: "c1-dot" });
    plot.append(gL, lossPath, lossDot);

    const setEp = stat(root, "Época", "0");
    const setLoss = stat(root, "Pérdida (entropía cruzada)", "—", "is-gold");
    const setAcc = stat(root, "Exactitud", "—");
    const accCard = root.querySelectorAll(".econ-stat")[2];
    const msg = note(root, "");

    // --- red neuronal
    let P, Mo, V, t, hist, epoch, runToken = 0;
    function nParams() { return H === 0 ? 3 : 4 * H + 1; } // W1 (2H) + b1 (H) + w2 (H) + b2
    function init() {
      const r = rng(H * 31 + (dataKey === "xor" ? 5 : 1));
      P = new Float64Array(nParams());
      for (let k = 0; k < P.length; k++) P[k] = gauss(r) * (H === 0 ? 0.1 : 0.9);
      Mo = new Float64Array(P.length); V = new Float64Array(P.length); t = 0;
      hist = []; epoch = 0;
    }
    const hid = new Float64Array(8);
    function forward(x, y) {
      if (H === 0) return sigm(P[0] * x + P[1] * y + P[2]);
      let z = P[4 * H];
      for (let k = 0; k < H; k++) {
        hid[k] = Math.tanh(P[2 * k] * x + P[2 * k + 1] * y + P[2 * H + k]);
        z += P[3 * H + k] * hid[k];
      }
      return sigm(z);
    }
    function lossAcc() {
      let l = 0, ok = 0;
      for (const p of pts) {
        const q = clamp(forward(p.x, p.y), 1e-7, 1 - 1e-7);
        l -= p.c ? Math.log(q) : Math.log(1 - q);
        if ((q >= 0.5 ? 1 : 0) === p.c) ok++;
      }
      return [l / pts.length, ok / pts.length];
    }
    function step() {
      const g = new Float64Array(P.length);
      for (const p of pts) {
        const q = forward(p.x, p.y);
        const d = q - p.c; // derivada de la entropía cruzada respecto de z
        if (H === 0) { g[0] += d * p.x; g[1] += d * p.y; g[2] += d; continue; }
        g[4 * H] += d;
        for (let k = 0; k < H; k++) {
          g[3 * H + k] += d * hid[k];
          const dh = d * P[3 * H + k] * (1 - hid[k] * hid[k]);
          g[2 * k] += dh * p.x; g[2 * k + 1] += dh * p.y; g[2 * H + k] += dh;
        }
      }
      // Adam
      t++;
      const lr = 0.05, b1 = 0.9, b2 = 0.999, n = pts.length;
      for (let k = 0; k < P.length; k++) {
        const gk = g[k] / n;
        Mo[k] = b1 * Mo[k] + (1 - b1) * gk;
        V[k] = b2 * V[k] + (1 - b2) * gk * gk;
        P[k] -= (lr * (Mo[k] / (1 - Math.pow(b1, t)))) / (Math.sqrt(V[k] / (1 - Math.pow(b2, t))) + 1e-8);
      }
      epoch++;
      hist.push(lossAcc()[0]);
    }

    function drawPoints() {
      gPts.replaceChildren(...pts.map((p) => svg("circle", { cx: mx(p.x).toFixed(1), cy: my(p.y).toFixed(1), r: 3.6, class: p.c ? "c1-pt is-pos" : "c1-pt" })));
    }
    function drawMap() {
      for (const c of cells) {
        const q = forward(c._x, c._y);
        c.classList.toggle("is-pos", q >= 0.5);
        c.setAttribute("fill-opacity", (0.08 + Math.abs(q - 0.5) * 0.9).toFixed(2));
      }
    }
    function drawLoss() {
      gL.replaceChildren();
      const maxE = Math.max(300, hist.length), maxL = 0.8;
      const lx = (e) => L.x0 + (e / maxE) * (L.x1 - L.x0);
      const ly = (v) => L.y1 - (Math.min(v, maxL) / maxL) * (L.y1 - L.y0);
      gL.append(line(L.x0, L.y1, L.x1, L.y1, "ia-axis"), line(L.x0, L.y0, L.x0, L.y1, "ia-axis"));
      [0.2, 0.4, 0.6, 0.8].forEach((v) => gL.append(line(L.x0, ly(v), L.x1, ly(v), "ia-grid"),
        txt(L.x0 - 5, ly(v) + 4, fmt1(v), { "text-anchor": "end", class: "c1-small" })));
      gL.append(txt(L.x0, L.y0 - 10, "Pérdida en entrenamiento", { class: "c1-small c1-bold" }),
        txt(L.x1, L.y1 + 16, "épocas → " + maxE, { "text-anchor": "end", class: "c1-small" }),
        txt(L.x0, L.y1 + 16, "0", { class: "c1-small" }));
      if (!hist.length) { lossPath.setAttribute("d", ""); lossDot.setAttribute("opacity", 0); return; }
      let d = "";
      hist.forEach((v, i) => { d += (i ? "L" : "M") + lx(i + 1).toFixed(1) + "," + ly(v).toFixed(1); });
      lossPath.setAttribute("d", d);
      lossDot.setAttribute("opacity", 1);
      lossDot.setAttribute("cx", lx(hist.length)); lossDot.setAttribute("cy", ly(hist[hist.length - 1]));
    }
    function updateStats() {
      const [l, a] = lossAcc();
      setEp(String(epoch));
      setLoss(epoch ? fmt2(l) : "—");
      setAcc(Math.round(a * 100) + " %");
      return a;
    }
    function updateMsg(a) {
      let m;
      if (!epoch) m = "💡 La red parte con pesos al azar: el fondo es casi neutro. Presiona <strong>Entrenar</strong>.";
      else if (H === 0) m = "📏 <strong>0 neuronas ocultas = regresión logística</strong>: la frontera es siempre una línea recta. " +
        "Por más épocas que entrenes, no puede encerrar el anillo ni separar el XOR.";
      else if (a < 0.9) m = `🔁 Con ${H} neuronas ocultas la red combina ${H} “rectas”. ¿Le alcanza? Entrena más épocas o prueba con más neuronas.`;
      else m = `✅ Con ${H} neuronas ocultas la red dobló la frontera y separa el ${Math.round(a * 100)} % de los clientes. ` +
        "Cada neurona oculta aporta una recta; la capa de salida las combina en una forma curva.";
      msg.innerHTML = m; // texto propio, sin datos externos
    }

    function reset(animate) {
      runToken++;
      trainBtn.disabled = false;
      init();
      xLbl.textContent = AXES[dataKey][0]; yLbl.textContent = AXES[dataKey][1];
      drawPoints(); drawMap(); drawLoss();
      updateMsg(updateStats());
      if (animate) motion.anim(gMap, { opacity: [0.35, 1] }, { duration: motion.DUR.std, ease: motion.EASE.out });
    }

    function train() {
      const token = ++runToken;
      const target = epoch + 300;
      trainBtn.disabled = true;
      const finish = () => {
        trainBtn.disabled = false;
        drawMap(); drawLoss();
        const a = updateStats();
        updateMsg(a);
        motion.pop(accCard);
      };
      if (motion.reduced()) { while (epoch < target) step(); finish(); return; }
      const frame = () => {
        if (token !== runToken) return;
        for (let k = 0; k < 6 && epoch < target; k++) step();
        drawMap(); drawLoss(); updateStats();
        if (epoch < target) requestAnimationFrame(frame); else finish();
      };
      requestAnimationFrame(frame);
    }

    reset(false);
  });

  /* ======================================================================
     3) c1-gradiente — una bola que baja por la curva de pérdida
     ====================================================================== */
  register("c1-gradiente", (root) => {
    panel(root, "⛰️ Descenso de gradiente: el tamaño del paso importa",
      "La curva es la <strong>pérdida</strong> según el valor de un peso <em>w</em>. La bola parte arriba y en cada paso " +
      "se mueve <em>en contra</em> de la pendiente: <code>w ← w − tasa × pendiente</code>. Cambia la <strong>tasa de aprendizaje</strong> y da pasos.");

    const W0 = -1, WSTAR = 3;
    const loss = (w) => 0.5 * (w - WSTAR) * (w - WSTAR) + 0.4;
    const grad = (w) => w - WSTAR;

    const ctr = controls(root);
    const lr = slider(ctr, "Tasa de aprendizaje (learning rate)", { min: 0.05, max: 2.2, step: 0.05, value: 0.3, fmt: fmt2 }, () => diag());
    const acts = h("div", { class: "econ-buttons" });
    root.append(acts);
    const b1 = btn(acts, "👣 Un paso", () => run(1), "econ-btn-gold");
    const b10 = btn(acts, "⏩ 10 pasos", () => run(10));
    btn(acts, "↺ Reiniciar", () => reset(), "econ-btn-ghost");

    const plot = svg("svg", { viewBox: "0 0 640 290", class: "ia-svg", role: "img",
      "aria-label": "Curva de pérdida con una bola que representa el valor actual del peso" });
    root.append(plot);
    const A = { x0: 50, x1: 620, y0: 20, y1: 250 }, WMIN = -3, WMAX = 9, LMAX = 18.5;
    const px = (w) => A.x0 + ((w - WMIN) / (WMAX - WMIN)) * (A.x1 - A.x0);
    const py = (l) => A.y1 - (Math.min(l, LMAX) / LMAX) * (A.y1 - A.y0);
    let d = "";
    for (let i = 0; i <= 160; i++) {
      const w = WMIN + ((WMAX - WMIN) * i) / 160;
      d += (i ? "L" : "M") + px(w).toFixed(1) + "," + py(loss(w)).toFixed(1);
    }
    plot.append(
      line(A.x0, A.y1, A.x1, A.y1, "ia-axis"), line(A.x0, A.y0, A.x0, A.y1, "ia-axis"),
      txt(A.x1, A.y1 + 34, "peso w →", { "text-anchor": "end", class: "c1-small" }),
      txt(A.x0 + 6, A.y0 + 4, "pérdida", { class: "c1-small c1-bold" }),
      svg("path", { d, class: "c1-curve", fill: "none" }),
      line(px(WSTAR), py(loss(WSTAR)), px(WSTAR), A.y1, "c1-guide"),
      txt(px(WSTAR), A.y1 + 18, "mínimo", { "text-anchor": "middle", class: "c1-small" })
    );
    [-2, 0, 2, 4, 6, 8].forEach((w) => plot.append(txt(px(w), A.y1 + 18, String(w), { "text-anchor": "middle", class: "c1-small c1-faint" })));
    const trail = svg("polyline", { class: "c1-trail", fill: "none" });
    const gDots = svg("g", {});
    const tangent = line(0, 0, 0, 0, "c1-tangent");
    const ball = svg("circle", { r: 9, class: "c1-ball" });
    plot.append(trail, gDots, tangent, ball);

    const setStep = stat(root, "Paso", "0");
    const setW = stat(root, "w", "—");
    const setL = stat(root, "Pérdida", "—", "is-gold");
    const setD = stat(root, "Diagnóstico", "—");
    const msg = note(root, "");

    let w, k, path, busy = false;
    function placeTangent() {
      const g = grad(w), x = px(w), y = py(loss(w));
      const dw = 0.9; // media longitud en unidades de w
      tangent.setAttribute("x1", px(w - dw)); tangent.setAttribute("y1", py(loss(w) - g * dw));
      tangent.setAttribute("x2", px(w + dw)); tangent.setAttribute("y2", py(loss(w) + g * dw));
      tangent.setAttribute("opacity", Math.abs(w - WSTAR) < 0.05 ? 0 : 1);
      return [x, y];
    }
    function drawTrail() {
      trail.setAttribute("points", path.map((v) => px(clamp(v, WMIN, WMAX)).toFixed(1) + "," + py(loss(v)).toFixed(1)).join(" "));
      gDots.replaceChildren(...path.slice(0, -1).map((v) => svg("circle", { cx: px(clamp(v, WMIN, WMAX)), cy: py(loss(v)), r: 3, class: "c1-trail-dot" })));
    }
    function stats() {
      setStep(String(k));
      setW(fmt2(w));
      setL(loss(w) > 99 ? "> 99" : fmt2(loss(w)));
    }
    function diag() {
      const r = +lr.value;
      let s;
      if (r < 0.25) s = "🐢 Muy lento";
      else if (r <= 1.0) s = "✅ Baja directo";
      else if (r < 1.95) s = "↔️ Rebota y converge";
      else if (r <= 2.0) s = "⚠️ Rebota sin bajar";
      else s = "💥 Diverge";
      setD(k ? s : "da un paso…");
      return s;
    }
    function reset() {
      w = W0; k = 0; path = [w]; busy = false;
      b1.disabled = false; b10.disabled = false;
      const [x, y] = placeTangent();
      ball.setAttribute("cx", x); ball.setAttribute("cy", y);
      ball.classList.remove("is-bad");
      drawTrail(); stats(); diag();
      msg.innerHTML = "💡 La <strong>línea roja</strong> es la pendiente (el gradiente) en el punto actual. Mientras más empinada, más grande el paso.";
    }
    async function run(n) {
      if (busy) return;
      busy = true; b1.disabled = true; b10.disabled = true;
      for (let i = 0; i < n; i++) {
        const nw = w - +lr.value * grad(w);
        w = nw; k++; path.push(w);
        const out = w < WMIN || w > WMAX;
        const [x, y] = placeTangent();
        drawTrail(); stats(); diag();
        const dur = n > 1 ? motion.DUR.quick * 1.4 : motion.DUR.slow;
        await Promise.all([
          motion.attr(ball, "cx", clamp(x, A.x0, A.x1), { duration: dur, ease: motion.EASE.out }),
          motion.attr(ball, "cy", Math.max(y, A.y0), { duration: dur, ease: motion.EASE.out }),
        ]);
        if (out) {
          ball.classList.add("is-bad");
          motion.shake(ball);
          msg.innerHTML = "💥 <strong>¡Se salió de la curva!</strong> Con una tasa tan grande cada paso sobrepasa el mínimo y cae más arriba que antes: la pérdida <em>crece</em>. Baja la tasa y reinicia.";
          busy = false; return; // botones quedan deshabilitados hasta reiniciar
        }
      }
      const r = +lr.value;
      if (Math.abs(w - WSTAR) < 0.02) msg.innerHTML = `🎯 Llegaste al mínimo en ${k} pasos.`;
      else if (r < 0.25) msg.innerHTML = "🐢 Avanza en la dirección correcta, pero a paso de tortuga: necesitarías cientos de épocas.";
      else if (r > 1 && r < 1.999) msg.innerHTML = "↔️ La bola salta de un lado al otro del mínimo. Con tasa entre 1 y 2 igual termina convergiendo, pero gasta pasos rebotando.";
      else if (r >= 1.999 && r <= 2.001) msg.innerHTML = "⚠️ Con tasa exactamente 2 la bola rebota para siempre entre los mismos dos puntos: ni baja ni diverge.";
      else if (r <= 1) msg.innerHTML = "✅ Cada paso baja la pérdida y la bola se acerca al mínimo sin pasarse. Sigue dando pasos.";
      else if (r > 2) msg.innerHTML = "📈 Cada salto es más grande que el anterior: la pérdida está subiendo. Esto es <strong>divergencia</strong>.";
      busy = false; b1.disabled = false; b10.disabled = false;
    }
    reset();
  });

  /* ======================================================================
     4) c1-curvas — entrenamiento vs. validación
     ====================================================================== */
  register("c1-curvas", (root) => {
    panel(root, "📉 Curvas de aprendizaje: ¿cuándo dejar de entrenar?",
      "Las curvas muestran la pérdida en <strong>entrenamiento</strong> (datos que la red ve) y en <strong>validación</strong> " +
      "(datos que no ve). Activa las opciones y mira cómo cambia la brecha entre ambas y dónde conviene parar.");
    let big = false, drop = false, early = false;
    const row = h("div", { class: "econ-buttons" });
    root.append(row);
    toggle(row, "🏗️ Red más grande (más capas)", (v) => { big = v; render(true); });
    toggle(row, "🎲 Dropout 30 %", (v) => { drop = v; render(true); });
    toggle(row, "✋ Early stopping (paciencia 5)", (v) => { early = v; render(true); });

    const plot = svg("svg", { viewBox: "0 0 640 290", class: "ia-svg", role: "img",
      "aria-label": "Curvas de pérdida de entrenamiento y validación por época" });
    root.append(plot);
    const A = { x0: 52, x1: 600, y0: 22, y1: 250 }, E = 60, YMAX = 1.6;
    const ex = (e) => A.x0 + ((e - 1) / (E - 1)) * (A.x1 - A.x0);
    const ey = (v) => A.y1 - (Math.min(v, YMAX) / YMAX) * (A.y1 - A.y0);
    plot.append(line(A.x0, A.y1, A.x1, A.y1, "ia-axis"), line(A.x0, A.y0, A.x0, A.y1, "ia-axis"));
    [0.4, 0.8, 1.2, 1.6].forEach((v) => plot.append(line(A.x0, ey(v), A.x1, ey(v), "ia-grid"),
      txt(A.x0 - 6, ey(v) + 4, fmt1(v), { "text-anchor": "end", class: "c1-small" })));
    [1, 10, 20, 30, 40, 50, 60].forEach((e) => plot.append(txt(ex(e), A.y1 + 16, String(e), { "text-anchor": "middle", class: "c1-small" })));
    plot.append(txt(A.x1, A.y1 + 32, "épocas →", { "text-anchor": "end", class: "c1-small" }),
      txt(A.x0, A.y0 - 8, "pérdida", { class: "c1-small c1-bold" }));
    const legend = svg("g", {},
      line(430, 34, 452, 34, "c1-tr"), txt(458, 38, "entrenamiento", { class: "c1-small" }),
      line(430, 54, 452, 54, "c1-va"), txt(458, 58, "validación", { class: "c1-small" }));
    const ghostTr = svg("path", { class: "c1-tr is-ghost", fill: "none" });
    const ghostVa = svg("path", { class: "c1-va is-ghost", fill: "none" });
    const pTr = svg("path", { class: "c1-tr", fill: "none", pathLength: 1 });
    const pVa = svg("path", { class: "c1-va", fill: "none", pathLength: 1 });
    const mark = svg("g", {});
    plot.append(ghostTr, ghostVa, pTr, pVa, mark, legend);

    const setStop = stat(root, "Modelo elegido", "—");
    const setVal = stat(root, "Pérdida en validación", "—", "is-gold");
    const setGap = stat(root, "Brecha val − train", "—");
    const msg = note(root, "");

    function curves() {
      const r = rng(3 + (big ? 1 : 0) + (drop ? 2 : 0));
      let trF = big ? 0.08 : 0.34, tau = big ? 5 : 8;
      let vF = big ? 0.42 : 0.5, over = big ? 0.0045 : 0.0012, t0 = big ? 11 : 20;
      if (drop) { trF += 0.1; tau *= 1.3; over *= 0.22; t0 += 12; vF -= 0.05; }
      const tr = [], va = [];
      for (let e = 1; e <= E; e++) {
        const n1 = (drop ? 0.03 : 0.012) * gauss(r), n2 = 0.016 * gauss(r);
        tr.push(Math.max(0.02, trF + (1.5 - trF) * Math.exp(-e / tau) + n1));
        va.push(vF + (1.5 - vF) * Math.exp(-e / (tau * 1.1)) + over * Math.pow(Math.max(0, e - t0), 1.35) + n2);
      }
      return [tr, va];
    }
    const toD = (arr, upto) => arr.slice(0, upto).map((v, i) => (i ? "L" : "M") + ex(i + 1).toFixed(1) + "," + ey(v).toFixed(1)).join("");

    function render(animate) {
      const [tr, va] = curves();
      // early stopping: paramos cuando la validación no mejora en 5 épocas seguidas
      let best = 0, stop = E;
      if (early) {
        let wait = 0;
        for (let e = 1; e < E; e++) {
          if (va[e] < va[best]) { best = e; wait = 0; } else if (++wait >= 5) { stop = e + 1; break; }
        }
      } else best = E - 1;
      pTr.setAttribute("d", toD(tr, stop));
      pVa.setAttribute("d", toD(va, stop));
      ghostTr.setAttribute("d", early ? toD(tr, E) : "");
      ghostVa.setAttribute("d", early ? toD(va, E) : "");

      mark.replaceChildren();
      const bx = ex(best + 1);
      mark.append(line(bx, A.y0 + 4, bx, A.y1, "c1-stopline"),
        svg("circle", { cx: bx, cy: ey(va[best]), r: 6, class: "c1-stopdot" }),
        txt(bx + (best > 40 ? -8 : 8), A.y0 + 14, early ? `mejor modelo · época ${best + 1}` : "modelo final · época 60",
          { "text-anchor": best > 40 ? "end" : "start", class: "c1-small c1-bold" }));
      if (early && stop < E) mark.append(txt(ex(stop) + (stop > 40 ? -6 : 6), A.y1 - 8, `se detuvo en la época ${stop}`,
        { "text-anchor": stop > 40 ? "end" : "start", class: "c1-small" }));

      setStop(early ? `época ${best + 1} (de ${stop})` : "época 60");
      setVal(fmt2(va[best]));
      setGap(fmt2(va[best] - tr[best]));

      const minVa = Math.min(...va);
      let m;
      if (early) m = "✋ <strong>Early stopping</strong> vigila la validación: si no mejora en 5 épocas seguidas, detiene el entrenamiento y " +
        "recupera los pesos de la mejor época. Lo punteado es lo que habría pasado si seguías entrenando.";
      else if (va[E - 1] - minVa > 0.12) m = "⚠️ <strong>Sobreajuste:</strong> la pérdida de entrenamiento sigue bajando, pero la de validación tocó fondo y ahora " +
        "<em>sube</em>. La red está memorizando los reclamos de entrenamiento en vez de aprender patrones generales.";
      else m = "✅ Entrenamiento y validación bajan juntas y la brecha es moderada: la red generaliza razonablemente.";
      if (drop && !early) m += " El <strong>dropout</strong> apaga neuronas al azar en cada paso: entrenar cuesta más (la curva dorada baja menos), pero la pérdida de validación termina más baja que sin dropout: la red generaliza mejor.";
      msg.innerHTML = m;

      if (animate && !motion.reduced()) {
        motion.anim(pTr, { strokeDashoffset: [1, 0] }, { duration: motion.DUR.slow, ease: motion.EASE.out });
        motion.anim(pVa, { strokeDashoffset: [1, 0] }, { duration: motion.DUR.slow, ease: motion.EASE.out, delay: 0.05 })
          .then(() => motion.anim(mark, { opacity: [0, 1] }, { duration: motion.DUR.std, ease: motion.EASE.out }));
        mark.style.opacity = "0";
      }
    }
    pTr.style.strokeDasharray = "1"; pVa.style.strokeDasharray = "1";
    pTr.style.strokeDashoffset = "0"; pVa.style.strokeDashoffset = "0";
    render(false);
  });

  /* ======================================================================
     5) c1-costos — umbral de decisión y costo de los errores
     ====================================================================== */
  register("c1-costos", (root) => {
    panel(root, "💸 ¿Qué error cuesta más? El umbral para marcar fraude",
      "200 reclamos ya puntuados por un modelo (30 son fraudes reales). Todo reclamo con puntaje sobre el <strong>umbral</strong> " +
      "se deriva al equipo antifraude. Ajusta el umbral y los <strong>costos</strong> de cada error y mira el costo total.");
    const r = rng(2026);
    const items = [];
    for (let i = 0; i < 200; i++) {
      const f = i < 30;
      const s = clamp(f ? 0.66 + 0.17 * gauss(r) : 0.27 + 0.16 * gauss(r), 0.01, 0.99);
      items.push({ f, s, j: r() });
    }
    const NF = 30;

    const ctr = controls(root);
    const th = slider(ctr, "Umbral para marcar fraude", { min: 0.05, max: 0.95, step: 0.01, value: 0.5, fmt: fmt2 }, () => render());
    const cFN = slider(ctr, "Costo de un fraude NO detectado (miles $)", { min: 50, max: 1000, step: 10, value: 400, fmt: (v) => "$" + v + " mil" }, () => render());
    const cFP = slider(ctr, "Costo de una falsa alarma (miles $)", { min: 5, max: 200, step: 5, value: 20, fmt: (v) => "$" + v + " mil" }, () => render());
    const acts = h("div", { class: "econ-buttons" });
    root.append(acts);
    btn(acts, "🎯 Ir al umbral de menor costo", () => goBest(), "econ-btn-gold");

    const plot = svg("svg", { viewBox: "0 0 640 300", class: "ia-svg", role: "img",
      "aria-label": "Puntajes de fraude de 200 reclamos con el umbral y curva de costo total según el umbral" });
    root.append(plot);
    const S = { x0: 120, x1: 620 };
    const sx = (s) => S.x0 + s * (S.x1 - S.x0);
    plot.append(txt(10, 44, "Fraude real", { class: "c1-small c1-bold" }), txt(10, 104, "No fraude", { class: "c1-small c1-bold" }),
      line(S.x0, 132, S.x1, 132, "ia-axis"));
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => plot.append(txt(sx(v), 146, fmt2(v), { "text-anchor": "middle", class: "c1-small" })));
    plot.append(txt(S.x1, 160, "puntaje del modelo →", { "text-anchor": "end", class: "c1-small" }));
    const dots = items.map((it) => {
      const c = svg("circle", { cx: sx(it.s).toFixed(1), cy: ((it.f ? 26 : 80) + it.j * 38).toFixed(1), r: 3.4, class: it.f ? "c1-pt is-pos" : "c1-pt" });
      plot.append(c);
      return c;
    });
    const thLine = line(0, 16, 0, 132, "c1-thline");
    const thLbl = txt(0, 12, "umbral", { "text-anchor": "middle", class: "c1-small c1-bold" });
    plot.append(thLine, thLbl);

    // curva de costo
    const C = { y0: 182, y1: 285 };
    const gC = svg("g", {});
    const cPath = svg("path", { class: "c1-curve", fill: "none" });
    const cDot = svg("circle", { r: 5.5, class: "c1-dot" });
    const bestDot = svg("circle", { r: 5, class: "c1-bestdot" });
    plot.append(txt(10, C.y0 + 6, "Costo total", { class: "c1-small c1-bold" }), txt(10, C.y0 + 20, "según umbral", { class: "c1-small" }), gC, cPath, bestDot, cDot);

    const heat = h("div", { class: "ia-heat c1-cm", style: { gridTemplateColumns: "auto 1fr 1fr" }, role: "group", "aria-label": "Matriz de confusión" });
    root.append(heat);
    const cell = (cls, t) => h("div", { class: cls }, t);
    const hTP = cell("ia-heat-cell"), hFN = cell("ia-heat-cell"), hFP = cell("ia-heat-cell"), hTN = cell("ia-heat-cell");
    heat.append(cell("ia-heat-lbl", ""), cell("ia-heat-lbl", "Modelo dice: fraude"), cell("ia-heat-lbl", "Modelo dice: no fraude"),
      cell("ia-heat-lbl", "Real: fraude"), hTP, hFN, cell("ia-heat-lbl", "Real: no fraude"), hFP, hTN);

    const setRec = stat(root, "Fraudes detectados (recall)", "—");
    const setFP = stat(root, "Falsas alarmas", "—");
    const setCost = stat(root, "Costo total", "—", "is-gold");
    const clp = new Intl.NumberFormat("es-CL");

    function counts(t) {
      let tp = 0, fp = 0;
      for (const it of items) if (it.s >= t) { if (it.f) tp++; else fp++; }
      return { tp, fp, fn: NF - tp, tn: 200 - NF - fp };
    }
    const costAt = (t) => { const c = counts(t); return c.fn * +cFN.value + c.fp * +cFP.value; };
    function bestT() {
      let bt = 0.5, bc = Infinity;
      for (let t = 0.05; t <= 0.951; t += 0.01) { const c = costAt(t); if (c < bc - 1e-9) { bc = c; bt = t; } }
      return Math.round(bt * 100) / 100;
    }
    function paint(el, n, tot, bad) {
      el.textContent = n;
      const pct = Math.round((n / tot) * 70) + 8;
      el.style.background = `color-mix(in srgb, ${bad ? "var(--usm-red)" : "var(--usm-blue)"} ${pct}%, transparent)`;
      el.style.color = pct > 45 ? "#fff" : "";
    }
    function render() {
      const t = +th.value;
      const c = counts(t);
      thLine.setAttribute("x1", sx(t)); thLine.setAttribute("x2", sx(t)); thLbl.setAttribute("x", sx(t));
      dots.forEach((d, i) => d.classList.toggle("is-flag", items[i].s >= t));
      paint(hTP, c.tp, NF, false); paint(hFN, c.fn, NF, true);
      paint(hFP, c.fp, 200 - NF, true); paint(hTN, c.tn, 200 - NF, false);

      // curva de costo
      const ts = [];
      for (let k = 5; k <= 95; k++) ts.push(k / 100);
      const cs = ts.map(costAt);
      const cmax = Math.max(...cs, 1);
      const cy = (v) => C.y1 - (v / cmax) * (C.y1 - C.y0);
      gC.replaceChildren(line(S.x0, C.y1, S.x1, C.y1, "ia-axis"));
      cPath.setAttribute("d", ts.map((tt, i) => (i ? "L" : "M") + sx(tt).toFixed(1) + "," + cy(cs[i]).toFixed(1)).join(""));
      cDot.setAttribute("cx", sx(t)); cDot.setAttribute("cy", cy(costAt(t)));
      const bt = bestT();
      bestDot.setAttribute("cx", sx(bt)); bestDot.setAttribute("cy", cy(costAt(bt)));

      setRec(`${c.tp} de ${NF} (${Math.round((c.tp / NF) * 100)} %)`);
      setFP(String(c.fp));
      setCost("$" + clp.format(costAt(t) * 1000));
    }
    function goBest() {
      const from = +th.value, to = bestT();
      const out = th.parentElement.querySelector("output");
      tween(from, to, (v) => {
        th.value = v; out.textContent = fmt2(+th.value); render();
      }).then(() => { th.value = to; out.textContent = fmt2(to); render(); motion.pop(root.querySelectorAll(".econ-stat")[2]); });
    }
    render();
    note(root, "💡 <strong>Qué mirar:</strong> si un fraude no detectado cuesta mucho más que una revisión manual, el umbral óptimo " +
      "<em>baja</em>: conviene revisar más reclamos aunque haya más falsas alarmas. El punto dorado hueco marca el umbral de menor costo. " +
      "Ojo: al bajar el umbral la <em>exactitud</em> puede incluso empeorar (hay más falsas alarmas) mientras el costo total cae: " +
      "maximizar exactitud no es lo mismo que minimizar el costo del negocio.");
  });
})();
