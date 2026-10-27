/* widgets-clase3.js — Simuladores de la Clase 3 · Transformers y LLMs
   c3-tokens       → tokenizador aproximado de subpalabras + costo por token
   c3-temperatura  → distribución del siguiente token y efecto de la temperatura
   c3-atencion     → pesos de atención (ilustrativos) entre palabras de una oración
   c3-prompt       → anatomía de un prompt y respuesta simulada del modelo        */
(function () {
  "use strict";
  if (!window.IA) return;
  const { h, svg, motion, panel, controls, slider, btn, buttons, stat, note, register } = window.IA;

  const fmtNum = (v, dig = 3) => v.toLocaleString("es-CL", { maximumSignificantDigits: dig });
  const fmtUSD = (v) => {
    if (v === 0) return "US$ 0";
    if (v < 0.01) return "US$ " + v.toLocaleString("es-CL", { maximumSignificantDigits: 2 });
    return "US$ " + v.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const pct = (p, d) => (p * 100).toFixed(d).replace(".", ",") + " %";
  const canAnimate = () => !!window.Motion && !motion.reduced();

  /* ======================================================================
     Tokenizador aproximado (DIDÁCTICO, no es el de ningún modelo real).
     Imita lo que hacen los tokenizadores de subpalabras (BPE/SentencePiece):
       · palabras muy frecuentes → 1 ficha (el vocabulario tiene más inglés);
       · palabras largas o raras → se parten en trozos conocidos;
       · el espacio va pegado al inicio de la ficha;
       · números en grupos de hasta 3 dígitos; signos y emojis aparte;
       · MAYÚSCULAS y letras con tilde se parten más.
     ====================================================================== */
  const W_EN = ("the a an i you he she it we they my your our his her their me us them to of in on at for from by with " +
    "and or but not no yes is are was were be been am do did does have has had will would can could should may " +
    "this that these those there here what which who when where why how all any some same other again also just " +
    "only very more most much many twice once one two three four five day days month months week year time " +
    "card credit debit bank account app phone money payment pay paid charge charged charges purchase purchases " +
    "transfer transaction help hope please thanks thank hello hi dear good bad error fee fees service customer " +
    "call center branch online website web code password login access open close closed blocked block stolen " +
    "someone made make know want need still never since after before because so if then than up out about into " +
    "new old last next first can't don't didn't won't i'm it's wrong problem issue support refund back get got " +
    "lost use used using update updated works work working loan rate interest amount balance cash").split(" ");
  const W_ES = ("de la que el en y a los se del las un por con no una su para es al lo como más o pero sus le ha me si " +
    "sin sobre este ya entre cuando todo esta ser son dos fue era muy hasta desde está mi porque qué yo hay vez " +
    "puede todos así nos ni tiene uno donde bien mismo ese ahora cada otro te otra eso tan día tres sí mes hola " +
    "gracias banco cuenta pago app web chat clave nadie nunca plata error ayuda favor caso hace hoy ayer veces " +
    "misma compra compras cargo cargos tengo hacer cae tiene quiero pude puedo dice dijeron llega sale tienda " +
    "monto pesos dinero saldo cupo deuda cliente clientes problema servicio respuesta semana meses días mal " +
    "nada nuevo nueva solo también hasta otra otros mucho poco mejor peor tarde buenas buenos tardes noches " +
    "estimados señores atento saludos favor").split(" ");
  const VOCAB = new Set([...W_EN, ...W_ES]);
  const PIECES = new Set(("ción cion ciones mente aron ieron ando iendo ado ados ada adas ido ida idos idas ar er ir " +
    "es os as an en on ón ía ias ía ero era ante ente encia ancia able ible dad tad miento izar ura ores ador " +
    "trans transfer cobr compr tarj eta jeta bloque clon cuot credit crédit comis isión mant ención tención " +
    "intent desconoc recon certific solicit necesit aplic inform atención ejecut sucurs proced requis llam " +
    "tra pre pro con des dis com cam cer cla cle clo cli cue cua que qui gue gui ble bre bra bri pla ple pli " +
    "tar ter tir tor tur par per por pur mar mer mir mor sal sel sol sub res rec rep reg ref ins inf int " +
    "est esp ext emp ent ant and end ind ond und ost ist ast ust ing ed ly th tion ment ness ful less " +
    "ca ce ci co cu da de di do du fa fe fi fo ga ge gi go ja je jo ju la le li lo lu ma me mi mo mu na ne ni " +
    "no nu pa pe pi po pu ra re ri ro ru sa se si so su ta te ti to tu va ve vi vo ba be bi bo bu ll rr ch qu " +
    "al el il ol ul ac ec ic oc uc ab ob im am um op ap ur ir").split(" "));
  const MAXP = 8;
  const NON_ASCII = /[^\x00-\x7f]/;

  function splitWord(word) {
    const lw = word.toLowerCase();
    if (VOCAB.has(lw) && word !== word.toUpperCase()) return [word];
    if (VOCAB.has(lw) && word.length <= 2) return [word];
    // MAYÚSCULAS: los tokenizadores las ven poco → trozos de 2 letras
    if (word.length > 2 && word === word.toUpperCase() && word !== lw) {
      const out = [];
      if (word.length <= 3) return [word];
      for (let i = 0; i < word.length; i += 2) out.push(word.slice(i, i + 2));
      return out;
    }
    const out = [];
    let i = 0;
    while (i < word.length) {
      let taken = 0;
      for (let L = Math.min(MAXP, word.length - i); L >= 2; L--) {
        if (PIECES.has(lw.slice(i, i + L))) { taken = L; break; }
      }
      if (!taken) {
        // Sin trozo conocido: avanza 3 letras (o 1 si hay tildes/ñ, que «cuestan» más)
        taken = 1;
        while (taken < 3 && i + taken < word.length && !NON_ASCII.test(word[i]) && !NON_ASCII.test(word[i + taken])) taken++;
      }
      out.push(word.slice(i, i + taken));
      i += taken;
    }
    return out;
  }

  /** Devuelve una lista de fichas (strings). Un espacio inicial indica comienzo de palabra. */
  function tokenizar(texto) {
    const toks = [];
    const re = /(\s*)([\p{L}\p{M}]+|\p{N}+|\p{Extended_Pictographic}|[^\s\p{L}\p{M}\p{N}])/gu;
    let m;
    while ((m = re.exec(texto))) {
      const sp = m[1] ? " " : "";
      const w = m[2];
      let parts;
      if (/^\p{N}+$/u.test(w)) {
        parts = [];
        for (let i = 0; i < w.length; i += 3) parts.push(w.slice(i, i + 3));
      } else if (/^[\p{L}\p{M}]+$/u.test(w)) {
        parts = splitWord(w);
      } else {
        parts = [w];
      }
      parts.forEach((p, k) => toks.push((k === 0 ? sp : "") + p));
    }
    return toks;
  }
  // Disponible para pruebas en consola
  window.IA.c3Tokenizar = tokenizar;

  /* ======================================================================
     1 · c3-tokens
     ====================================================================== */
  const TK_PRESETS = [
    { label: "Cobro doble", value: "Me cobraron dos veces la misma compra en Ripley por $26.700. Ojalá me ayuden." },
    { label: "Fraude", value: "Me clonaron la tarjeta, hay cargos que no reconozco en una bencinera. Ya bloqueé la tarjeta." },
    { label: "App", value: "La app se cae cada vez que intento hacer una transferencia. Tengo un iPhone actualizado." },
    { label: "🇬🇧 Cobro doble en inglés", value: "I was charged twice for the same purchase at Ripley for $26,700. I hope you can help me." },
    { label: "MAYÚSCULAS", value: "ME COBRARON DOS VECES LA MISMA COMPRA EN RIPLEY. ESTO ES UNA VERGÜENZA." },
  ];

  register("c3-tokens", (root) => {
    panel(root, "🔤 Así lee un modelo tu reclamo",
      "Elige un reclamo o escribe el tuyo. Cada ficha de color es un <strong>token</strong>: lo que el modelo realmente " +
      "ve y lo que el proveedor te cobra. Compara el mismo reclamo en español y en inglés.");

    const area = h("textarea", { class: "c3-textarea", rows: 3, "aria-label": "Texto del reclamo a tokenizar", spellcheck: "false" });
    area.value = TK_PRESETS[0].value;
    buttons(root, TK_PRESETS, (v) => { area.value = v; render(true); }, TK_PRESETS[0].value);
    root.append(area);

    const chips = h("div", { class: "ia-chips c3-chips", "aria-live": "polite" });
    root.append(chips);

    const ctr = controls(root);
    const price = h("input", { type: "number", min: "0", step: "0.05", value: "0.30", "aria-label": "Precio en US$ por millón de tokens de entrada" });
    ctr.append(h("div", { class: "econ-control" }, h("label", {}, "Precio entrada (US$ por millón de tokens)"), price));
    const instr = slider(ctr, "Instrucciones fijas del prompt", {
      min: 0, max: 1500, step: 50, value: 300, fmt: (v) => v + " tokens",
    }, () => render(false));
    price.addEventListener("input", () => render(false));

    const setChars = stat(root, "Caracteres", "—");
    const setToks = stat(root, "Tokens del reclamo", "—", "is-gold");
    const setRatio = stat(root, "Caracteres por token", "—");
    const setC1 = stat(root, "Costo de 1 reclamo", "—");
    const setC100 = stat(root, "Costo de 100.000 reclamos", "—", "is-red");

    let timer = null;
    area.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => render(false), 180);
    });

    function render(animate) {
      const txt = area.value;
      const toks = tokenizar(txt);
      chips.replaceChildren(...toks.map((t) => h("span", { class: "ia-chip" }, t)));
      if (animate && canAnimate()) motion.stagger(chips.children, { kf: { opacity: [0, 1], y: [8, 0], scale: [0.9, 1] } });
      const n = toks.length;
      const p = Math.max(0, parseFloat(price.value) || 0);
      const perReclamo = n + (+instr.value);
      setChars(String(txt.length));
      setToks(String(n));
      setRatio(n ? fmtNum(txt.length / n, 2) : "—");
      setC1(fmtUSD((perReclamo * p) / 1e6));
      const c100 = (perReclamo * p * 100000) / 1e6;
      setC100(fmtUSD(c100) + " ≈ $" + Math.round(c100 * 950).toLocaleString("es-CL") + " CLP");
    }
    render(true);
    note(root, "💡 <strong>Qué mirar:</strong> el espacio viaja pegado al inicio de la ficha, las palabras frecuentes son una " +
      "sola ficha y las largas o raras se parten (<em>cobra·ron</em>). El mismo reclamo en inglés usa menos tokens, y en " +
      "MAYÚSCULAS se dispara. Sube las «instrucciones fijas»: en la práctica, el prompt pesa más que el reclamo. " +
      "<br><em>Tokenizador aproximado con fines didácticos; cada modelo tiene el suyo (en el notebook cuentas tokens reales). " +
      "Conversión a pesos con un dólar supuesto de $950.</em>");
  });

  /* ======================================================================
     2 · c3-temperatura
     ====================================================================== */
  const CANDS = [
    ["comisión", 3.0], ["cuota", 2.4], ["mantención", 1.9], ["compra", 1.6], ["vez", 1.2],
    ["multa", 0.4], ["fortuna", -0.4], ["barbaridad", -0.7], ["pizza", -2.2], ["jirafa", -3.4],
  ];

  function softmaxT(logits, T) {
    if (T < 0.02) {
      const mx = Math.max(...logits);
      const idx = logits.indexOf(mx);
      return logits.map((_, i) => (i === idx ? 1 : 0));
    }
    const mx = Math.max(...logits);
    const ex = logits.map((z) => Math.exp((z - mx) / T));
    const s = ex.reduce((a, b) => a + b, 0);
    return ex.map((e) => e / s);
  }
  function sample(probs) {
    let r = Math.random();
    for (let i = 0; i < probs.length; i++) { r -= probs[i]; if (r <= 0) return i; }
    return probs.length - 1;
  }

  register("c3-temperatura", (root) => {
    panel(root, "🌡️ Temperatura: ¿qué palabra sigue?",
      "El modelo asigna una probabilidad a cada posible siguiente palabra tras <em>«me cobraron una…»</em>. " +
      "Mueve la <strong>temperatura</strong> y luego <strong>muestrea</strong>: el modelo «tira un dado cargado» con estas probabilidades.");

    const ctr = controls(root);
    const sl = slider(ctr, "Temperatura T", { min: 0, max: 2, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) }, () => render());
    const presets = h("div", { class: "econ-buttons" });
    ctr.append(presets);
    [["T = 0 (determinista)", 0], ["T = 0,7", 0.7], ["T = 1,5 (creativa)", 1.5]].forEach(([lab, v]) => {
      btn(presets, lab, () => { sl.value = v; sl.dispatchEvent(new Event("input")); }, "econ-btn-ghost econ-btn-sm");
    });

    const sentence = h("p", { class: "c3-sentence" }, "me cobraron una ");
    const slot = h("span", { class: "c3-slot", "aria-live": "polite" }, "…");
    sentence.append(slot);
    root.append(sentence);

    const bars = h("div", { class: "ia-bars c3-bars", role: "img", "aria-label": "Probabilidad de cada siguiente palabra" });
    const rows = CANDS.map(([w]) => {
      const fill = h("div", { class: "ia-bar-fill" });
      const val = h("span", {}, "");
      const row = h("div", { class: "ia-bar-row" }, h("span", {}, w), h("div", { class: "ia-bar-track" }, fill), val);
      bars.append(row);
      return { row, fill, val };
    });
    root.append(bars);

    const bs = h("div", { class: "econ-buttons" });
    root.append(bs);
    btn(bs, "🎲 Muestrear 1 palabra", () => draw(1), "econ-btn-gold");
    btn(bs, "🎲 Muestrear 20 veces", () => draw(20));
    const hist = h("div", { class: "ia-chips c3-hist", "aria-label": "Palabras muestreadas" });
    root.append(hist);

    const setTop = stat(root, "Prob. de «comisión» (la favorita)", "—", "is-gold");
    const setRare = stat(root, "Prob. fuera del top 3", "—", "is-red");
    const setDist = stat(root, "Palabras distintas en la última ronda", "—");

    let probs = [];
    function render() {
      probs = softmaxT(CANDS.map((c) => c[1]), +sl.value);
      const mx = Math.max(...probs);
      rows.forEach((r, i) => {
        r.fill.style.width = (probs[i] * 100).toFixed(1) + "%";
        r.val.textContent = pct(probs[i], probs[i] < 0.01 && probs[i] > 0 ? 2 : 1);
        r.row.classList.toggle("is-top", probs[i] === mx);
      });
      setTop(pct(probs[0], 1));
      const sorted = [...probs].sort((a, b) => b - a);
      setRare(pct(Math.max(0, 1 - sorted[0] - sorted[1] - sorted[2]), 1));
    }

    function draw(n) {
      const picks = Array.from({ length: n }, () => sample(probs));
      const last = CANDS[picks[picks.length - 1]][0];
      slot.textContent = last;
      slot.classList.toggle("is-rare", picks[picks.length - 1] >= 5);
      motion.pop(slot);
      if (n === 1) {
        const c = h("span", { class: "ia-chip" + (picks[0] >= 5 ? " is-hot" : "") }, CANDS[picks[0]][0]);
        hist.prepend(c);
        while (hist.children.length > 14) hist.lastChild.remove();
        if (canAnimate()) motion.enter(c);
      } else {
        hist.replaceChildren(...picks.map((i) => h("span", { class: "ia-chip" + (i >= 5 ? " is-hot" : "") }, CANDS[i][0])));
        if (canAnimate()) motion.stagger(hist.children, { kf: { opacity: [0, 1], scale: [0.85, 1] } });
      }
      setDist(String(new Set(picks).size) + (n > 1 ? " de 20" : " de 1"));
    }

    render();
    note(root, "💡 <strong>Qué mirar:</strong> con <strong>T = 0</strong> el modelo elige siempre la más probable " +
      "(«comisión»): es <em>determinista</em>, lo que quieres para clasificar o extraer datos. Con T alta la distribución se " +
      "aplana y aparecen «fortuna», «pizza» o «jirafa» (marcadas en dorado): más variedad, pero también más riesgo de " +
      "decir algo raro. <em>Probabilidades ilustrativas.</em>");
  });

  /* ======================================================================
     3 · c3-atencion  (pesos ILUSTRATIVOS, elegidos a mano)
     ====================================================================== */
  function matriz(words, spec) {
    const n = words.length;
    return words.map((_, i) => {
      const row = Array.from({ length: n }, (_, j) => (spec[i] && spec[i][j] != null ? spec[i][j] : 0.03));
      const s = row.reduce((a, b) => a + b, 0);
      return row.map((v) => v / s);
    });
  }
  const ORACIONES = [
    {
      label: "«la» = la tarjeta",
      words: ["Bloqueé", "la", "tarjeta", "porque", "la", "clonaron"],
      start: 4,
      spec: {
        0: { 0: 0.35, 2: 0.4, 5: 0.1 },
        1: { 0: 0.2, 1: 0.15, 2: 0.55 },
        2: { 0: 0.3, 1: 0.12, 2: 0.3, 5: 0.18 },
        3: { 0: 0.25, 3: 0.2, 5: 0.38 },
        4: { 2: 0.64, 4: 0.08, 5: 0.14 },
        5: { 0: 0.08, 2: 0.42, 4: 0.25, 5: 0.15 },
      },
    },
    {
      label: "banco 🏦",
      words: ["Fui", "al", "banco", "a", "pagar", "la", "cuota"],
      start: 2,
      spec: {
        0: { 0: 0.4, 2: 0.3 },
        1: { 1: 0.3, 2: 0.5 },
        2: { 0: 0.12, 2: 0.2, 4: 0.3, 6: 0.3 },
        3: { 3: 0.3, 4: 0.5 },
        4: { 2: 0.25, 4: 0.25, 6: 0.38 },
        5: { 5: 0.3, 6: 0.55 },
        6: { 2: 0.25, 4: 0.4, 6: 0.25 },
      },
    },
    {
      label: "banco 🪑",
      words: ["Me", "senté", "en", "el", "banco", "de", "la", "plaza"],
      start: 4,
      spec: {
        0: { 0: 0.4, 1: 0.45 },
        1: { 0: 0.2, 1: 0.3, 4: 0.35 },
        2: { 1: 0.3, 2: 0.25, 4: 0.3 },
        3: { 3: 0.3, 4: 0.55 },
        4: { 1: 0.36, 4: 0.18, 7: 0.34 },
        5: { 4: 0.35, 5: 0.2, 7: 0.35 },
        6: { 6: 0.3, 7: 0.55 },
        7: { 1: 0.15, 4: 0.4, 7: 0.3 },
      },
    },
  ];

  register("c3-atencion", (root) => {
    panel(root, "👀 Atención: cada palabra mira a las demás",
      "Pasa el mouse (o toca) una palabra: los arcos muestran a qué otras palabras le presta atención para entender su " +
      "significado en <em>esta</em> oración. Más grueso = más peso. Cambia de oración para ver dos «banco» distintos.");

    let cur = ORACIONES[0];
    let sel = cur.start;
    buttons(root, ORACIONES.map((o, i) => ({ label: o.label, value: i })), (i) => {
      cur = ORACIONES[i];
      sel = cur.start;
      build();
    }, 0);

    const W = 640, H = 230, PAD = 24, Y = 190;
    const plot = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "ia-svg c3-att", role: "img", "aria-label": "Arcos de atención entre palabras" });
    const gArcs = svg("g");
    const gWords = svg("g");
    plot.append(gArcs, gWords);
    root.append(h("div", { class: "c3-att-wrap" }, plot));

    const heat = h("div", { class: "ia-heat c3-heat" });
    root.append(h("p", { class: "c3-heat-t" }, "Mapa de calor completo (fila = palabra que mira · columna = palabra mirada · % de atención)"), heat);

    const setTo = stat(root, "Palabra seleccionada", "—", "is-gold");
    const setMax = stat(root, "Le presta más atención a", "—");

    let M = [];
    let wordEls = [];
    let rowEls = [];
    const xOf = (i, n) => PAD + ((i + 0.5) * (W - 2 * PAD)) / n;

    function build() {
      M = matriz(cur.words, cur.spec);
      const n = cur.words.length;
      gWords.replaceChildren();
      wordEls = cur.words.map((w, i) => {
        const x = xOf(i, n);
        const bw = Math.min((W - 2 * PAD) / n - 8, 12 + w.length * 8.2);
        const g = svg("g", {
          class: "c3-att-word", tabindex: "0", role: "button", "aria-label": "Ver la atención de " + w,
          onmouseenter: () => select(i), onfocus: () => select(i), onclick: () => select(i),
          onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); } },
        },
        svg("rect", { x: x - bw / 2, y: Y - 18, width: bw, height: 30, rx: 7 }),
        svg("text", { x, y: Y + 2, "text-anchor": "middle" }, w));
        gWords.append(g);
        return g;
      });
      // Mapa de calor
      heat.style.gridTemplateColumns = `auto repeat(${n}, minmax(2.3rem, 1fr))`;
      const kids = [h("span", { class: "ia-heat-lbl" }, "")];
      cur.words.forEach((w) => kids.push(h("span", { class: "ia-heat-lbl c3-col" }, w)));
      rowEls = [];
      M.forEach((row, i) => {
        const lbl = h("button", { type: "button", class: "ia-heat-lbl c3-rowbtn", onclick: () => select(i) }, cur.words[i]);
        kids.push(lbl);
        const cells = row.map((v) => {
          const pct = Math.round(v * 100);
          return h("span", {
            class: "ia-heat-cell" + (v > 0.4 ? " is-strong" : ""),
            style: { backgroundColor: `color-mix(in srgb, var(--usm-blue) ${Math.min(100, Math.round(v * 150))}%, transparent)` },
          }, String(pct));
        });
        kids.push(...cells);
        rowEls.push([lbl, ...cells]);
      });
      heat.replaceChildren(...kids);
      select(sel, true);
    }

    function select(i, force) {
      if (i === sel && !force && gArcs.childNodes.length) return;
      sel = i;
      const n = cur.words.length;
      const row = M[i];
      const mxOther = Math.max(...row.filter((_, j) => j !== i));
      const xi = xOf(i, n);
      const paths = [];
      const labels = [];
      gArcs.replaceChildren();
      row.forEach((w, j) => {
        if (j === i) return;
        const xj = xOf(j, n);
        const top = Y - 26 - (28 + Math.abs(xi - xj) * 0.32);
        const isMax = w === mxOther;
        const p = svg("path", {
          d: `M ${xi} ${Y - 20} Q ${(xi + xj) / 2} ${top} ${xj} ${Y - 20}`,
          class: "c3-arc" + (isMax ? " is-max" : ""),
          "stroke-width": (1 + w * 22).toFixed(1),
          "stroke-opacity": (0.25 + 0.75 * (w / mxOther)).toFixed(2),
          pathLength: "1",
        });
        gArcs.append(p);
        paths.push(p);
        if (w >= 0.1) {
          const t = svg("text", { x: (xi + xj) / 2, y: (Y - 20 + top) / 2 - 4, "text-anchor": "middle", class: "c3-arc-lbl" }, Math.round(w * 100) + " %");
          gArcs.append(t);
          labels.push(t);
        }
      });
      wordEls.forEach((g, k) => {
        g.classList.toggle("is-on", k === i);
        g.setAttribute("aria-pressed", String(k === i));
      });
      rowEls.forEach((cells, k) => cells.forEach((c) => c.classList.toggle("c3-row-on", k === i)));
      const jmax = row.findIndex((w, j) => j !== i && w === mxOther);
      setTo("«" + cur.words[i] + "»");
      setMax("«" + cur.words[jmax] + "» (" + Math.round(mxOther * 100) + " %)");
      if (canAnimate()) {
        // "Dibuja" cada arco: stroke-dashoffset de 1 a 0 (pathLength = 1), en cascada < 450 ms
        const step = Math.min(0.04, 0.2 / Math.max(1, paths.length));
        paths.forEach((p, k) => {
          p.setAttribute("stroke-dasharray", "1");
          p.setAttribute("stroke-dashoffset", "1");
          motion.attr(p, "stroke-dashoffset", 0, { delay: k * step, duration: motion.DUR.std });
        });
        labels.forEach((t) => {
          t.setAttribute("opacity", "0");
          motion.attr(t, "opacity", 1, { delay: 0.2, duration: motion.DUR.quick });
        });
      }
    }

    build();
    note(root, "💡 <strong>Qué mirar:</strong> la segunda «la» mira sobre todo a «tarjeta»: así el modelo entiende que lo " +
      "clonado es la tarjeta. Y «banco» mira a «pagar/cuota» en una oración y a «senté/plaza» en la otra: la misma palabra " +
      "termina con un vector distinto según su contexto. <br><em>Pesos ilustrativos elegidos a mano para mostrar la " +
      "intuición. En un modelo real los pesos se aprenden, y hay decenas de capas con varias «cabezas» de atención cada una.</em>");
  });

  /* ======================================================================
     4 · c3-prompt  (respuestas SIMULADAS)
     ====================================================================== */
  const P_PARTS = {
    rol: "Eres un analista de reclamos de FinTrust, un banco chileno. Clasificas con criterio y sin inventar.",
    cats: "Clasifica el reclamo en UNA de estas categorías: Fraude, Cobro indebido, App y canales digitales, " +
      "Crédito y tasas, Atención al cliente, Información y trámites.",
    tarea: "Clasifica el siguiente reclamo.",
    fmt: 'Responde SOLO con un JSON de la forma {"categoria": "<categoría>"}, sin texto adicional.',
    ej: 'Ejemplo 1: "Intenté pagar con la app, me dio error y aun así me descontaron el saldo." → {"categoria": "App y canales digitales"}\n' +
      'Ejemplo 2: "Me cobraron dos veces la misma compra en Lider." → {"categoria": "Cobro indebido"}',
    reclamo: 'Reclamo: """La app me dio error al transferir $45.000, pero igual se descontó el saldo. Encima me cobraron comisión."""',
  };

  register("c3-prompt", (root) => {
    panel(root, "🧩 Arma tu prompt",
      "Activa o desactiva las piezas del prompt y mira cómo cambia la respuesta del modelo para un reclamo ambiguo. " +
      "La etiqueta correcta en los datos es <strong>App y canales digitales</strong> (la causa es la falla de la app).");

    const on = { rol: false, cats: false, fmt: false, ej: false };
    const tg = h("div", { class: "econ-buttons", role: "group", "aria-label": "Piezas del prompt" });
    root.append(tg);
    [["rol", "👤 Rol"], ["cats", "📋 Categorías permitidas"], ["fmt", "🧾 Formato JSON"], ["ej", "🧪 Ejemplos (few-shot)"]].forEach(([k, lab]) => {
      const b = h("button", { type: "button", class: "econ-btn econ-btn-ghost", "aria-pressed": "false" }, lab);
      b.addEventListener("click", () => {
        on[k] = !on[k];
        b.setAttribute("aria-pressed", String(on[k]));
        motion.anim(b, { scale: [0.95, 1] }, { duration: motion.DUR.quick, ease: motion.EASE.back });
        render(true);
      });
      tg.append(b);
    });

    const pre = h("pre", { class: "c3-prompt-pre", "aria-label": "Prompt armado" });
    root.append(h("p", { class: "c3-lbl" }, "📝 Prompt que se envía"), pre);
    const resp = h("pre", { class: "c3-prompt-resp", "aria-live": "polite" });
    const verdict = h("p", { class: "c3-verdict", "aria-live": "polite" });
    root.append(h("p", { class: "c3-lbl" }, "🤖 Respuesta (simulada)"), resp, verdict);

    const setTok = stat(root, "Tokens del prompt (aprox.)", "—");
    const setCost = stat(root, "Costo por 100.000 reclamos", "—", "is-gold");
    const setOk = stat(root, "¿Se puede usar automáticamente?", "—", "is-red");

    function respuesta() {
      const fmt = on.fmt || on.ej; // los ejemplos ya muestran el formato
      if (!on.cats && !on.ej) {
        if (!fmt) return [(on.rol ? "Como analista de FinTrust, diría que " : "") +
          "este reclamo trata de un problema con una transferencia: la aplicación falló y además hubo un cobro. " +
          "Sugiero revisarlo con el área técnica y evaluar la devolución de la comisión.", "bad",
          "❌ Texto libre: un programa no puede leer la categoría. Y no eligió ninguna de las tuyas."];
        return ['{"categoria": "Error en transferencia"}', "warn",
          "⚠️ JSON válido, pero la categoría es inventada: el modelo no conoce tu lista."];
      }
      if (on.cats && !fmt) return [(on.rol ? "Como analista, " : "") +
        "la categoría más adecuada es Cobro indebido, ya que el cliente menciona una comisión y un descuento de saldo.", "warn",
        "⚠️ Usa una categoría válida, pero escondida en texto libre (hay que «pescarla») y discutible."];
      if (on.cats && !on.ej) return ['{"categoria": "Cobro indebido"}', "warn",
        "⚠️ JSON válido y categoría permitida, pero no coincide con la etiqueta: el caso es ambiguo y nada le dice cómo desempatar."];
      if (!on.cats && on.ej) return ['{"categoria": "App y canales digitales"}', "warn",
        "⚠️ Acierta gracias al ejemplo 1, pero solo conoce 2 de las 6 categorías (las de los ejemplos). Con otros reclamos inventará."];
      return ['{"categoria": "App y canales digitales"}', "ok",
        "✅ JSON válido, categoría permitida y correcta: el ejemplo 1 le enseñó a desempatar «falla de app + cobro»."];
    }

    let lastResp = "";
    function render(animate) {
      const parts = [];
      if (on.rol) parts.push(["rol", P_PARTS.rol]);
      parts.push(on.cats ? ["cats", P_PARTS.cats] : ["tarea", P_PARTS.tarea]);
      if (on.fmt) parts.push(["fmt", P_PARTS.fmt]);
      if (on.ej) parts.push(["ej", P_PARTS.ej]);
      parts.push(["reclamo", P_PARTS.reclamo]);
      pre.replaceChildren(...parts.flatMap(([k, t], i) => [h("span", { class: "c3-pp c3-pp-" + k }, t), i < parts.length - 1 ? "\n\n" : ""]));
      const fullText = parts.map((p) => p[1]).join("\n\n");
      const nTok = tokenizar(fullText).length;
      setTok(String(nTok));
      setCost(fmtUSD(((nTok + 12) * 0.3 * 100000) / 1e6));
      const [txt, kind, msg] = respuesta();
      resp.textContent = txt;
      verdict.textContent = msg;
      verdict.className = "c3-verdict is-" + kind;
      setOk(kind === "ok" ? "Sí" : kind === "warn" ? "Con riesgo" : "No");
      if (animate && txt !== lastResp) {
        if (kind === "bad") motion.shake(resp); else motion.pop(resp);
      }
      lastResp = txt;
    }
    render(false);
    note(root, "💡 <strong>Qué mirar:</strong> cada pieza resuelve un problema distinto: las <em>categorías</em> evitan que " +
      "invente etiquetas, el <em>formato</em> permite procesar la respuesta con código y los <em>ejemplos</em> enseñan a " +
      "desempatar casos ambiguos (pero cuestan tokens). El costo supone US$ 0,30 por millón de tokens de entrada y ~12 de salida. " +
      "<br><em>Respuestas simuladas para ilustrar comportamientos típicos; en el notebook pruebas con Gemini de verdad.</em>");
  });
})();
