/* widgets-clase2.js — Simuladores de la Clase 2 (Embeddings: el significado como vector)
   · c2-mapa      → mapa 2D de 48 reclamos reales (PCA de embeddings 384D); clic = vecinos más cercanos
   · c2-coseno    → dos vectores 2D: ángulo, coseno y distancia euclidiana en vivo
   · c2-buscador  → búsqueda semántica: top-5 por embeddings vs. top-5 por TF-IDF
   Los datos de c2-mapa y c2-buscador se precalcularon con sentence-transformers
   (paraphrase-multilingual-MiniLM-L12-v2) y viven en docs/datasets/clase2_*.json. */
(function () {
  "use strict";
  const { h, svg, motion, panel, controls, slider, btn, buttons, stat, note, register } = window.IA;

  /* ---------- Utilidades compartidas ---------- */
  // Carpeta de datasets a partir de la URL de este script (…/javascripts/widgets-clase2.js)
  const SRC = (document.currentScript && document.currentScript.src) || "";
  const dataURL = (f) => (SRC ? new URL("../datasets/" + f, SRC) : new URL("../../datasets/" + f, location.href)).href;
  const cache = {};
  const getJSON = (f) => (cache[f] = cache[f] || fetch(dataURL(f)).then((r) => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }).catch((e) => { delete cache[f]; throw e; }));

  const CAT_SHORT = ["Fraude", "Cobro indebido", "App y canales", "Crédito y tasas", "Atención", "Información"];
  const fmt2 = (v) => v.toFixed(2).replace(".", ",");
  const short = (t, n) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);

  function catChip(c, nombres) {
    return h("span", { class: "c2-cat c2-k" + c }, h("i", { "aria-hidden": "true" }), nombres ? nombres[c] : CAT_SHORT[c]);
  }

  function loading(root, txt) {
    const p = h("p", { class: "econ-note c2-loading" }, txt || "⏳ Cargando datos precalculados…");
    root.append(p);
    return p;
  }

  /* El lienzo de cada SVG se elige según su ancho REAL en pantalla (no el de la ventana): bajo cierto umbral,
     el lienzo de escritorio se vería con letra < 11 px, y se usa uno con escala 1 (1 unidad = 1 px).
     onWidth(w) se llama al inicio y cada vez que cambia el ancho (girar el teléfono, cambiar la ventana,
     abrir o cerrar las barras laterales). Devuelve la función que mide y avisa. */
  function segunAncho(el, onWidth) {
    let last = -1, raf = 0;
    const medir = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0 && w !== last) { last = w; onWidth(w); }
    };
    if (window.ResizeObserver) {
      new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(medir); }).observe(el);
    }
    return medir;
  }

  /* Interpola un conjunto de números (para transiciones entre ejemplos). */
  function tween(from, to, onUpdate, duration) {
    const M = window.Motion;
    if (!M || motion.reduced()) { onUpdate(to); return Promise.resolve(); }
    return M.animate(0, 1, {
      duration: duration || motion.DUR.slow, ease: motion.EASE.out,
      onUpdate: (t) => onUpdate(from.map((a, i) => a + (to[i] - a) * t)),
    }).finished;
  }

  /* =====================================================================
     1) c2-mapa · Mapa de significados
     ===================================================================== */
  register("c2-mapa", (root) => {
    panel(root, "🗺️ El mapa de los significados",
      "Cada punto es un reclamo real de FinTrust convertido en un vector de <strong>384 números</strong> y " +
      "proyectado a 2D. <strong>Haz clic en un punto</strong> (o usa Tab + Enter) para ver sus 5 vecinos más " +
      "cercanos según el coseno en las 384 dimensiones.");
    const wait = loading(root);

    getJSON("clase2_mapa.json").then((d) => {
      wait.remove();
      const P = d.puntos;
      // Dos lienzos. Escritorio: 640×400 (desde 720 px de ancho real, para que el rótulo de 10 px se vea ≥ 11 px).
      // Angosto: escala 1, tan ancho como el SVG en pantalla, rótulos de 12 px dentro de márgenes más altos.
      const ANCHO = { W: 640, H: 400, L: 26, R: 26, T: 26, B: 26, ax1: [614, 394], ax2: [10, 18] };
      const angosto = (w) => {
        const W = Math.max(240, w), H = Math.max(316, Math.round(W * 0.625));
        return { W, H, L: 12, R: 12, T: 36, B: 34, ax1: [W - 6, H - 7], ax2: [4, 16] };
      };
      let G = ANCHO, movil = false;
      const X = (x) => G.L + x * (G.W - G.L - G.R);
      const Y = (y) => G.H - G.B - y * (G.H - G.T - G.B);

      // Leyenda (sirve también como filtro visual por categoría)
      const legend = h("div", { class: "c2-legend", role: "group", "aria-label": "Categorías" });
      d.categorias.forEach((nombre, c) => {
        const b = h("button", { type: "button", class: "c2-legend-btn", "aria-pressed": "false" }, catChip(c, d.categorias));
        b.addEventListener("click", () => {
          const on = b.getAttribute("aria-pressed") !== "true";
          legend.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", String(on));
          focusCat(on ? c : null);
        });
        legend.append(b);
      });
      root.append(legend);

      const plot = svg("svg", { class: "ia-svg c2-map", role: "group",
        "aria-label": "Mapa 2D de 48 reclamos coloreados por categoría" });
      const gLines = svg("g", { class: "c2-lines" });
      const gPts = svg("g", {});
      const gLbl = svg("g", { class: "c2-lbls" });
      const ax1 = svg("text", { "text-anchor": "end", class: "c2-axis-t" }, "componente principal 1 →");
      const ax2 = svg("text", { class: "c2-axis-t" }, "↑ componente principal 2");
      plot.append(ax1, ax2, gLines, gPts, gLbl);

      const dots = P.map((p, i) => {
        const c = svg("circle", { r: 6, class: "c2-dot c2-k" + p.c, tabindex: "0",
          role: "button", "aria-label": `${d.categorias[p.c]}: ${p.t}` });
        c.append(svg("title", {}, p.t));
        c.addEventListener("click", () => select(i));
        c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); } });
        gPts.append(c);
        return c;
      });
      root.append(plot);

      // En el lienzo angosto los puntos miden ~12 px: un toque cerca de un punto (≤ 22 px) también lo elige.
      plot.addEventListener("click", (e) => {
        if (!movil || e.target.classList.contains("c2-dot")) return;
        const r = plot.getBoundingClientRect();
        const k = r.width / G.W;
        let best = -1, bd = 22;
        P.forEach((p, i) => {
          if (dots[i].classList.contains("is-dim") && cur == null) return;
          const dd = Math.hypot(r.left + X(p.x) * k - e.clientX, r.top + Y(p.y) * k - e.clientY);
          if (dd < bd) { bd = dd; best = i; }
        });
        if (best >= 0) select(best);
      });

      let cur = null; // índice del reclamo elegido (para redibujar al cambiar de lienzo)
      function layout(w) {
        w = Math.round(w);
        const m = w < 720;
        const g = m ? angosto(w) : ANCHO;
        if (g.W === G.W && g.H === G.H && m === movil && plot.hasAttribute("viewBox")) return;
        movil = m; G = g;
        plot.setAttribute("viewBox", `0 0 ${G.W} ${G.H}`);
        plot.classList.toggle("is-compact", m);
        ax1.setAttribute("x", G.ax1[0]); ax1.setAttribute("y", G.ax1[1]);
        ax2.setAttribute("x", G.ax2[0]); ax2.setAttribute("y", G.ax2[1]);
        dots.forEach((el, i) => { el.setAttribute("cx", X(P[i].x)); el.setAttribute("cy", Y(P[i].y)); });
        if (cur != null) drawSel(cur, false);
      }
      const medir = segunAncho(plot, layout);
      layout(plot.getBoundingClientRect().width || 640);
      medir();

      const ctr = controls(root);
      ctr.classList.add("c2-ctr-row");
      btn(ctr, "🎲 Otro reclamo al azar", () => select(Math.floor(Math.random() * P.length)), "econ-btn-gold econ-btn-sm");
      btn(ctr, "↺ Limpiar", () => clear(), "econ-btn-ghost econ-btn-sm");

      // Panel de detalle: el reclamo elegido y sus vecinos con barras de similitud
      const info = h("div", { class: "c2-map-info", "aria-live": "polite" });
      root.append(info);
      const setSame = stat(root, "Vecinos de la misma categoría", "—", "is-gold");
      const setTop = stat(root, "Coseno con el vecino n.º 1", "—");

      // Animaciones de atributos SVG que se pueden detener: si se elige otro punto antes de que terminen,
      // no deben seguir escribiendo el radio de la selección anterior.
      let running = [];
      function animAttr(el, name, to, opts) {
        const M = window.Motion;
        if (!M || motion.reduced()) { el.setAttribute(name, to); return; }
        const from = parseFloat(el.getAttribute(name)) || 0;
        running.push(M.animate(from, to, Object.assign({ duration: motion.DUR.std, ease: motion.EASE.out,
          onUpdate: (v) => el.setAttribute(name, v) }, opts)));
      }
      function stopAnims() { running.forEach((a) => a && a.stop && a.stop()); running = []; }

      function focusCat(c) {
        clear();
        dots.forEach((el, i) => el.classList.toggle("is-dim", c != null && P[i].c !== c));
      }

      function clear(keepInfo) {
        cur = null;
        stopAnims();
        gLines.replaceChildren();
        gLbl.replaceChildren();
        dots.forEach((el) => { el.classList.remove("is-dim", "is-sel", "is-nn"); el.setAttribute("r", 6); });
        if (!keepInfo) {
          info.replaceChildren(h("p", { class: "c2-muted" }, "👆 Elige un punto del mapa."));
          setSame("—"); setTop("—");
        }
      }

      // Los vecinos suelen quedar muy juntos y los números de rango se taparían entre sí (o con los puntos). Para cada vecino se prueba alrededor del punto la primera posición libre.
      function rankPos(i) {
        const p = P[i];
        const circ = [{ x: X(p.x), y: Y(p.y), r: 10 }].concat(p.nn.map((j) => ({ x: X(P[j].x), y: Y(P[j].y), r: 8 })));
        const placed = [];
        const LW = 9, LH = 11; // caja aproximada de un dígito de 13 px en negrita
        const CANDS = [[11, 0, "start"], [-11, 0, "end"], [0, -13, "middle"], [0, 15, "middle"],
          [9, -10, "start"], [-9, -10, "end"], [9, 12, "start"], [-9, 12, "end"]];
        return p.nn.map((j) => {
          const cx = X(P[j].x), cy = Y(P[j].y);
          let best = null, bestCost = Infinity;
          CANDS.forEach(([dx, dy, anc], n) => {
            const x0 = anc === "start" ? cx + dx : anc === "end" ? cx + dx - LW : cx + dx - LW / 2;
            const box = { x0, x1: x0 + LW, y0: cy + dy - LH / 2, y1: cy + dy + LH / 2 };
            let cost = n * 0.01;
            if (box.x0 < 2 || box.x1 > G.W - 2 || box.y0 < 2 || box.y1 > G.H - 2) cost += 100;
            placed.forEach((b) => {
              const ox = Math.min(b.x1, box.x1) - Math.max(b.x0, box.x0), oy = Math.min(b.y1, box.y1) - Math.max(b.y0, box.y0);
              if (ox > 0 && oy > 0) cost += 10 + ox * oy;
            });
            circ.forEach((c) => {
              const nx = Math.max(box.x0, Math.min(c.x, box.x1)), ny = Math.max(box.y0, Math.min(c.y, box.y1));
              const pen = c.r + 1 - Math.hypot(c.x - nx, c.y - ny);
              if (pen > 0) cost += 1 + pen;
            });
            if (cost < bestCost) { bestCost = cost; best = { box, attrs: { x: cx + dx, y: cy + dy + 4.5, "text-anchor": anc } }; }
          });
          placed.push(best.box);
          return best.attrs;
        });
      }

      // Parte SVG de la selección: rayos, números de rango y radios. anim = false redibuja sin animar
      // (al cambiar de lienzo celular ↔ escritorio).
      function drawSel(i, anim) {
        const p = P[i];
        stopAnims();
        gLines.replaceChildren();
        gLbl.replaceChildren();
        const pos = rankPos(i);
        // Rayos desde el punto elegido hacia cada vecino (en cascada)
        p.nn.forEach((j, k) => {
          const ln = svg("line", { x1: X(p.x), y1: Y(p.y), x2: X(p.x), y2: Y(p.y), class: "c2-ray" });
          gLines.append(ln);
          const lbl = svg("text", Object.assign({ class: "c2-rank" }, pos[k]), String(k + 1));
          gLbl.append(lbl);
          if (anim) {
            animAttr(ln, "x2", X(P[j].x), { delay: k * 0.06 });
            animAttr(ln, "y2", Y(P[j].y), { delay: k * 0.06 });
          } else { ln.setAttribute("x2", X(P[j].x)); ln.setAttribute("y2", Y(P[j].y)); }
        });
        if (anim) {
          animAttr(dots[i], "r", 10, { ease: motion.EASE.back });
          p.nn.forEach((j, k) => animAttr(dots[j], "r", 8, { delay: 0.05 + k * 0.05, ease: motion.EASE.back }));
        } else {
          dots[i].setAttribute("r", 10);
          p.nn.forEach((j) => dots[j].setAttribute("r", 8));
        }
      }

      function select(i) {
        legend.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
        clear(true);
        cur = i;
        const p = P[i];
        const nn = new Set(p.nn);
        dots.forEach((el, j) => {
          el.classList.toggle("is-dim", j !== i && !nn.has(j));
          el.classList.toggle("is-nn", nn.has(j));
          el.classList.toggle("is-sel", j === i);
        });
        drawSel(i, true);

        // Detalle con barras
        const same = p.nn.filter((j) => P[j].c === p.c).length;
        setSame(`${same} de 5`);
        setTop(fmt2(p.s[0]));
        const rows = p.nn.map((j, k) => {
          const fill = h("div", { class: "ia-bar-fill c2-fill-k" + P[j].c });
          return {
            fill, s: p.s[k], row: h("div", { class: "c2-nn-row" },
              h("span", { class: "c2-nn-rank" }, String(k + 1)),
              h("div", { class: "c2-nn-body" },
                h("p", { class: "c2-nn-t" }, P[j].t),
                h("div", { class: "c2-nn-meta" }, catChip(P[j].c, d.categorias),
                  h("div", { class: "ia-bar-track" }, fill),
                  h("span", { class: "c2-nn-s" }, "cos " + fmt2(p.s[k]))))),
          };
        });
        info.replaceChildren(
          h("div", { class: "c2-sel" }, h("span", { class: "c2-sel-k" }, "Reclamo elegido"),
            h("p", { class: "c2-sel-t" }, "«" + p.t + "»"), catChip(p.c, d.categorias)),
          h("p", { class: "c2-nn-h" }, "Sus 5 vecinos más cercanos (coseno en 384 dimensiones):"),
          ...rows.map((r) => r.row));
        motion.stagger(rows.map((r) => r.row), { step: 0.05 });
        rows.forEach((r, k) => motion.anim(r.fill, { width: ["0%", Math.max(0, r.s) * 100 + "%"] },
          { delay: 0.08 + k * 0.05, duration: motion.DUR.slow, ease: motion.EASE.out }));
      }

      note(root, `💡 Qué mirar: los reclamos de la app y los de atención forman sus propias “islas”, mientras ` +
        `fraude y cobro indebido se mezclan (ambos hablan de plata que salió sin querer). Ojo: el mapa 2D conserva ` +
        `solo el <strong>${Math.round(d.varianza_2d * 100)} %</strong> de la variación de los ${d.dims} números, ` +
        `por eso a veces un vecino real aparece lejos en el dibujo. La cercanía de verdad se mide en ${d.dims} dimensiones.`);

      // Estado inicial: un reclamo de fraude seleccionado para que el mapa “hable” desde el inicio
      const ini = P.findIndex((p) => /clonaron/i.test(p.t));
      select(ini >= 0 ? ini : 0);
    }).catch(() => {
      wait.textContent = "No se pudieron cargar los datos del mapa (clase2_mapa.json). Recarga la página.";
    });
  });

  /* =====================================================================
     2) c2-coseno · Ángulo, coseno y distancia
     ===================================================================== */
  register("c2-coseno", (root) => {
    panel(root, "📐 Coseno: cuánto apuntan en la misma dirección",
      "Mueve los deslizadores o <strong>arrastra las puntas</strong> de las flechas. El coseno solo mira el " +
      "<strong>ángulo</strong> entre los vectores; la distancia euclidiana también se fija en el <strong>largo</strong>.");

    const st = { aA: 20, lA: 3, aB: 50, lB: 2 };
    const ctr = controls(root);
    const sAA = slider(ctr, "Ángulo de A (°)", { min: 0, max: 360, step: 1, value: st.aA, fmt: (v) => v + "°" }, (v) => { st.aA = v; render(); });
    const sLA = slider(ctr, "Largo de A", { min: 0.5, max: 4, step: 0.1, value: st.lA, fmt: (v) => fmt1(v) }, (v) => { st.lA = v; render(); });
    const sAB = slider(ctr, "Ángulo de B (°)", { min: 0, max: 360, step: 1, value: st.aB, fmt: (v) => v + "°" }, (v) => { st.aB = v; render(); });
    const sLB = slider(ctr, "Largo de B", { min: 0.5, max: 4, step: 0.1, value: st.lB, fmt: (v) => fmt1(v) }, (v) => { st.lB = v; render(); });
    function fmt1(v) { return (+v).toFixed(1).replace(".", ","); }

    const PRESETS = [
      { label: "Paráfrasis", value: { aA: 30, lA: 3, aB: 38, lB: 2.6 } },
      { label: "Mismo tema", value: { aA: 20, lA: 3, aB: 60, lB: 3 } },
      { label: "Sin relación", value: { aA: 10, lA: 3, aB: 100, lB: 3 } },
      { label: "Opuestos", value: { aA: 30, lA: 3, aB: 210, lB: 3 } },
      { label: "Igual dirección, distinto largo", value: { aA: 35, lA: 1, aB: 35, lB: 4 } },
    ];
    buttons(root, PRESETS, (v) => {
      const from = [st.aA, st.lA, st.aB, st.lB];
      // ir por el camino angular más corto
      let aB = v.aB; while (aB - st.aB > 180) aB -= 360; while (st.aB - aB > 180) aB += 360;
      let aA = v.aA; while (aA - st.aA > 180) aA -= 360; while (st.aA - aA > 180) aA += 360;
      tween(from, [aA, v.lA, aB, v.lB], ([a, b, c, e]) => {
        st.aA = (a + 360) % 360; st.lA = b; st.aB = (c + 360) % 360; st.lB = e; render(true);
      }).then(() => { motion.pulse(verdict); });
    });

    // Dos lienzos. Escritorio: 640×340 (desde 600 px de ancho real). Angosto: alto 310 y tan ancho como el SVG en
    // pantalla (mínimo 310), escala ≈ 1. U = unidades del lienzo por unidad del vector; en ambos caben vectores de
    // largo 4 en cualquier dirección. hr = radio de la manilla de arrastre (más grande para el dedo).
    const ANCHO = { W: 640, H: 340, O: { x: 320, y: 175 }, U: 36, gx: 8, gy: 4, hr: 13 };
    const angosto = (w) => {
      const W = Math.max(310, w);
      return { W, H: 310, O: { x: W / 2, y: 155 }, U: 32, gx: Math.floor((W / 2 - 20) / 32), gy: 4, hr: 17 };
    };
    let W, H, O, U, movil = null;
    const plot = svg("svg", { class: "ia-svg c2-cos", role: "img",
      "aria-label": "Dos vectores desde el origen con el ángulo entre ellos" });
    const grid = svg("g", {});
    const defs = svg("defs", {},
      svg("marker", { id: "c2-arrA", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" },
        svg("path", { d: "M0,0 L10,5 L0,10 z", class: "c2-vA-fill" })),
      svg("marker", { id: "c2-arrB", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" },
        svg("path", { d: "M0,0 L10,5 L0,10 z", class: "c2-vB-fill" })));
    const arc = svg("path", { class: "c2-arc" });
    const arcT = svg("text", { class: "c2-arc-t", "text-anchor": "middle" });
    const gap = svg("line", { class: "c2-gap" });
    const vA = svg("line", { class: "c2-vA", "marker-end": "url(#c2-arrA)" });
    const vB = svg("line", { class: "c2-vB", "marker-end": "url(#c2-arrB)" });
    const hA = svg("circle", { class: "c2-handle", tabindex: "-1" });
    const hB = svg("circle", { class: "c2-handle", tabindex: "-1" });
    const tA = svg("text", { class: "c2-vlbl c2-vA-t" }, "A");
    const tB = svg("text", { class: "c2-vlbl c2-vB-t" }, "B");
    plot.append(defs, grid, arc, gap, vB, vA, arcT, tA, tB, hA, hB);
    root.append(plot);

    function layout(w) {
      w = Math.round(w);
      const m = w < 600;
      const G = m ? angosto(w) : ANCHO;
      if (G.W === W && m === movil) return false;
      movil = m;
      ({ W, H, O, U } = G);
      plot.setAttribute("viewBox", `0 0 ${W} ${H}`);
      plot.classList.toggle("is-compact", m);
      const gl = [];
      for (let k = -G.gx; k <= G.gx; k++) {
        gl.push(svg("line", { x1: O.x + k * U, y1: 10, x2: O.x + k * U, y2: H - 10, class: "ia-grid" }));
      }
      for (let k = -G.gy; k <= G.gy; k++) {
        gl.push(svg("line", { x1: 20, y1: O.y + k * U, x2: W - 20, y2: O.y + k * U, class: "ia-grid" }));
      }
      gl.push(svg("line", { x1: 20, y1: O.y, x2: W - 20, y2: O.y, class: "ia-axis" }),
        svg("line", { x1: O.x, y1: 10, x2: O.x, y2: H - 10, class: "ia-axis" }));
      grid.replaceChildren(...gl);
      [vA, vB].forEach((v) => { v.setAttribute("x1", O.x); v.setAttribute("y1", O.y); });
      [hA, hB].forEach((c) => c.setAttribute("r", G.hr));
      return true;
    }
    const medir = segunAncho(plot, (w) => { if (layout(w)) render(); });
    layout(plot.getBoundingClientRect().width || 640);  // (medir() se llama después del primer render)

    const formula = h("p", { class: "c2-formula", "aria-live": "polite" });
    root.append(formula);
    const setAng = stat(root, "Ángulo θ", "—");
    const setCos = stat(root, "Coseno = cos θ", "—", "is-gold");
    const setEu = stat(root, "Distancia euclidiana", "—", "is-red");
    const verdict = h("p", { class: "c2-verdict" });
    root.append(verdict);

    // Arrastrar las puntas
    function drag(handle, which) {
      // En pantallas táctiles, touch-action en elementos SVG no siempre basta: sin esto el navegador empieza a
      // desplazar la página y cancela el arrastre (pointercancel) tras el primer movimiento.
      handle.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
      handle.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        const move = (ev) => {
          const pt = plot.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
          const p = pt.matrixTransform(plot.getScreenCTM().inverse());
          const dx = (p.x - O.x) / U, dy = (O.y - p.y) / U;
          const ang = Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
          const len = Math.min(4, Math.max(0.5, Math.round(Math.hypot(dx, dy) * 10) / 10));
          if (which === "A") { st.aA = ang; st.lA = len; } else { st.aB = ang; st.lB = len; }
          render(true);
        };
        const up = () => {
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", up);
          handle.removeEventListener("pointercancel", up);
          motion.pulse(verdict);
        };
        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", up);
        handle.addEventListener("pointercancel", up);
      });
    }
    drag(hA, "A"); drag(hB, "B");

    function setOut(input, v, f) {
      input.value = v;
      const out = input.parentElement.querySelector("output");
      if (out) out.textContent = f(v);
    }

    function render(syncSliders) {
      const rad = (a) => (a * Math.PI) / 180;
      const a = [st.lA * Math.cos(rad(st.aA)), st.lA * Math.sin(rad(st.aA))];
      const b = [st.lB * Math.cos(rad(st.aB)), st.lB * Math.sin(rad(st.aB))];
      const dot = a[0] * b[0] + a[1] * b[1];
      const cos = dot / (st.lA * st.lB);
      const theta = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
      const eu = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const PA = { x: O.x + a[0] * U, y: O.y - a[1] * U };
      const PB = { x: O.x + b[0] * U, y: O.y - b[1] * U };
      vA.setAttribute("x2", PA.x); vA.setAttribute("y2", PA.y);
      vB.setAttribute("x2", PB.x); vB.setAttribute("y2", PB.y);
      hA.setAttribute("cx", PA.x); hA.setAttribute("cy", PA.y);
      hB.setAttribute("cx", PB.x); hB.setAttribute("cy", PB.y);
      tA.setAttribute("x", PA.x + 12); tA.setAttribute("y", PA.y - 10);
      tB.setAttribute("x", PB.x + 12); tB.setAttribute("y", PB.y - 10);
      gap.setAttribute("x1", PA.x); gap.setAttribute("y1", PA.y); gap.setAttribute("x2", PB.x); gap.setAttribute("y2", PB.y);
      // Arco del ángulo menor entre A y B
      let a0 = st.aA, a1 = st.aB, diff = ((a1 - a0) % 360 + 360) % 360;
      if (diff > 180) { [a0, a1] = [a1, a0]; diff = 360 - diff; }
      const R = 30;
      const p0 = { x: O.x + R * Math.cos(rad(a0)), y: O.y - R * Math.sin(rad(a0)) };
      const p1 = { x: O.x + R * Math.cos(rad(a0 + diff)), y: O.y - R * Math.sin(rad(a0 + diff)) };
      arc.setAttribute("d", diff < 0.5 ? "" : `M${O.x},${O.y} L${p0.x},${p0.y} A${R},${R} 0 0 0 ${p1.x},${p1.y} Z`);
      const mid = rad(a0 + diff / 2);
      arcT.setAttribute("x", O.x + 48 * Math.cos(mid)); arcT.setAttribute("y", O.y - 48 * Math.sin(mid) + 4);
      arcT.textContent = diff < 0.5 ? "" : Math.round(theta) + "°";

      setAng(Math.round(theta) + "°");
      setCos(fmt2(cos));
      setEu(fmt2(eu));
      formula.textContent = `cos θ = (A·B) / (‖A‖·‖B‖) = ${fmt2(dot)} / (${fmt1(st.lA)} × ${fmt1(st.lB)}) = ${fmt2(cos)}`;
      let txt;
      if (cos >= 0.9) txt = "🟢 Casi la misma dirección: en embeddings, esto sería una paráfrasis (“me cobraron dos veces la misma compra” ≈ “me descontaron dos veces el mismo pago”: coseno real 0,90).";
      else if (cos >= 0.5) txt = "🟡 Dirección parecida: textos del mismo tema, pero no lo mismo (“me cobraron dos veces” vs. “me cobran una comisión”: coseno real 0,60).";
      else if (cos >= 0.2) txt = "🟠 Relación débil: comparten algo, pero hablan de cosas distintas.";
      else if (cos > -0.2) txt = "⚪ Casi perpendiculares: sin relación (“la app se cae” vs. “quiero un certificado de deuda”: coseno real −0,05).";
      else txt = "🔴 Direcciones opuestas. En embeddings de frases es raro ver cosenos negativos: casi todo cae entre 0 y 1.";
      if (Math.abs(st.lA - st.lB) >= 1.5 && cos >= 0.95) {
        txt += " Fíjate: el coseno es ≈ 1 aunque la distancia euclidiana es grande. Por eso usamos coseno: importa hacia dónde apunta el vector, no su largo.";
      }
      verdict.textContent = txt;
      if (syncSliders) {
        setOut(sAA, Math.round(st.aA), (v) => v + "°"); setOut(sAB, Math.round(st.aB), (v) => v + "°");
        setOut(sLA, st.lA, fmt1); setOut(sLB, st.lB, fmt1);
      }
    }
    render();
    medir();
    note(root, "💡 Qué mirar: prueba “Igual dirección, distinto largo”. El coseno vale 1 (mismo significado) aunque " +
      "los vectores midan distinto; la distancia euclidiana, en cambio, dice que están lejos. En la práctica los embeddings " +
      "se <strong>normalizan</strong> (largo 1) y ahí coseno y distancia ordenan igual.");
  });

  /* =====================================================================
     3) c2-buscador · Búsqueda semántica vs. TF-IDF
     ===================================================================== */
  register("c2-buscador", (root) => {
    panel(root, "🔎 Buscador de reclamos: significado vs. palabras",
      "Elige una consulta de negocio. A la izquierda, el top-5 por <strong>embeddings</strong> (coseno entre " +
      "significados); a la derecha, el top-5 por <strong>TF-IDF</strong> (palabras compartidas). Resultados " +
      "precalculados sobre los reclamos limpios de FinTrust.");
    const wait = loading(root);

    getJSON("clase2_buscador.json").then((d) => {
      wait.remove();
      const flow = h("div", { class: "ia-flow c2-flow", "aria-hidden": "true" },
        ...["Consulta en texto", "Vector de 384 números", `Coseno con ${d.n_corpus.toLocaleString("es-CL")} reclamos`, "Top-5 más parecidos"]
          .map((t, k) => h("div", { class: "ia-flow-step" }, h("strong", {}, `${k + 1}.`), t)));
      const opts = d.consultas.map((c, i) => ({ label: c.q, value: i }));
      buttons(root, opts, (i) => show(i, true), 0);
      root.append(flow);
      const qline = h("p", { class: "c2-qline", "aria-live": "polite" });
      root.append(qline);
      const cols = h("div", { class: "c2-cols" });
      const colE = h("div", { class: "c2-col is-emb" });
      const colT = h("div", { class: "c2-col is-tf" });
      cols.append(colE, colT);
      root.append(cols);
      const setE = stat(root, "🧠 Embeddings · en la categoría esperada", "—", "is-gold");
      const setT = stat(root, "🔤 TF-IDF · en la categoría esperada", "—");

      function column(col, title, res, esperada, kind) {
        const max = kind === "emb" ? 1 : Math.max(0.6, res[0] ? res[0].s : 0.6);
        const rows = res.map((r, k) => {
          const fill = h("div", { class: "ia-bar-fill" });
          const ok = r.c === esperada;
          const row = h("div", { class: "c2-res" + (ok ? " is-ok" : " is-off") },
            h("span", { class: "c2-res-n" }, String(k + 1)),
            h("div", { class: "c2-res-b" },
              h("p", { class: "c2-res-t", title: r.t }, short(r.t, 150)),
              h("div", { class: "c2-nn-meta" }, catChip(r.c, d.categorias),
                h("div", { class: "ia-bar-track" }, fill),
                h("span", { class: "c2-nn-s" }, fmt2(r.s)))));
          return { row, fill, w: Math.max(0.02, r.s / max) };
        });
        col.replaceChildren(h("p", { class: "c2-col-h" }, title), ...rows.map((x) => x.row));
        return rows;
      }

      function show(i, animate) {
        const c = d.consultas[i];
        qline.replaceChildren("Consulta: ", h("strong", {}, "«" + c.q + "»"), " · categoría que esperaríamos: ", catChip(c.esperada, d.categorias));
        const rE = column(colE, "🧠 Por significado (embeddings)", c.emb, c.esperada, "emb");
        const rT = column(colT, "🔤 Por palabras (TF-IDF)", c.tfidf, c.esperada, "tf");
        const nE = c.emb.filter((r) => r.c === c.esperada).length;
        const nT = c.tfidf.filter((r) => r.c === c.esperada).length;
        setE(`${nE} de 5`); setT(`${nT} de 5`);
        const all = rE.concat(rT);
        if (animate) {
          // Pipeline: se ilumina cada paso (guía la atención), luego entran los resultados
          const steps = [...flow.children];
          steps.forEach((s) => s.classList.remove("is-on", "is-done"));
          steps.forEach((s, k) => setTimeout(() => {
            steps.forEach((x, j) => { x.classList.toggle("is-on", j === k); x.classList.toggle("is-done", j < k); });
          }, motion.reduced() ? 0 : k * 90));
          motion.stagger(all.map((x) => x.row), { step: 0.035, delay: 0.12 });
        } else {
          [...flow.children].forEach((s) => s.classList.add("is-done"));
        }
        all.forEach((x, k) => motion.anim(x.fill, { width: ["0%", x.w * 100 + "%"] },
          { delay: (animate ? 0.15 : 0) + (k % 5) * 0.04, duration: motion.DUR.slow, ease: motion.EASE.out }));
      }
      show(0, false);

      note(root, "💡 Qué mirar: en “clientes víctimas de phishing” nadie escribió <em>phishing</em>, pero los embeddings " +
        "encuentran tarjetas clonadas y transferencias a desconocidos; TF-IDF solo encuentra en común la palabra “de” " +
        "(y en “mala experiencia con el servicio telefónico”, apenas “con” y “el”). " +
        "Ahora prueba “estafa telefónica”: ahí <strong>gana TF-IDF</strong>, porque la palabra “estafa” aparece tal cual en los reclamos. " +
        "Compara el <strong>orden</strong>, no los números: las escalas de TF-IDF y embeddings son distintas. " +
        "Y si ves una etiqueta “rara” en un resultado correcto, es el ~6 % de ruido de etiquetas del caso.");
    }).catch(() => {
      wait.textContent = "No se pudieron cargar los resultados del buscador (clase2_buscador.json). Recarga la página.";
    });
  });
})();
