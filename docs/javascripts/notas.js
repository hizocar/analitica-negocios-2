/*
 * Página de notas: la nota de cada sprint queda oculta hasta que alguien
 * aprieta su botón «Revelar». Solo evita ver las notas de un vistazo; la
 * página sigue conteniéndolas, así que no es un control de acceso.
 *
 *   <div class="nt-team">              una tarjeta por equipo
 *     <div class="nt-adv"> … <button class="nt-reveal">Revelar</button> … <div class="nt-revealed" hidden>…</div></div>
 *     <div class="nt-adv"> …             una fila por sprint, cada una con su botón
 *   </div>
 */
(function () {
  function enhance() {
    document.querySelectorAll("button.nt-reveal:not([data-ready])").forEach((btn) => {
      btn.dataset.ready = "1";
      const box = btn.closest(".nt-adv");
      const result = box ? box.querySelector(".nt-revealed") : null;
      if (!result) return;
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        btn.textContent = open ? "Revelar" : "Ocultar";
        result.hidden = open;
      });
    });
  }

  // Material para MkDocs con navigation.instant expone document$
  if (typeof document$ !== "undefined") document$.subscribe(enhance);
  else document.addEventListener("DOMContentLoaded", enhance);
})();
