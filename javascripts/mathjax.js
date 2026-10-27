/* Configuración de MathJax para pymdownx.arithmatex (modo generic).
   Se re-tipografía en cada cambio de página por la navegación instantánea de Material. */
window.MathJax = {
  // Las láminas usan \color{...}: la extensión se carga explícitamente porque la carga
  // automática no siempre ocurre y la fórmula quedaba como texto ("\color blue E").
  loader: { load: ["[tex]/color"] },
  tex: {
    // Lista completa y explícita: la forma {"[+]": [...]} no se aplicaba y "color" quedaba fuera.
    packages: ["base", "ams", "newcommand", "noundefined", "require", "autoload", "configmacros", "color"],
    // Comandos de LaTeX que usan las láminas y MathJax no trae (Clase 4, lámina 8: \hdots)
    macros: { hdots: "\\ldots" },
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex",
  },
};

document$.subscribe(() => {
  if (!window.MathJax || !MathJax.startup || !MathJax.typesetPromise) return;
  MathJax.startup.output.clearCache();
  MathJax.typesetClear();
  MathJax.texReset();
  MathJax.typesetPromise();
});
