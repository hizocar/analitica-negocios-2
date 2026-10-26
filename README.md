# Analítica para los Negocios II · USM

Sitio del curso intensivo (modo tutoría) **Analítica para los Negocios II**: de redes neuronales a LLMs
aplicados a negocios. Octubre a diciembre de 2026.

🌐 https://hizocar.github.io/analitica-negocios-2/

## Estructura

- `docs/` — contenido del sitio (MkDocs Material).
  - `clases/` — cápsulas interactivas (simuladores en `javascripts/widgets-claseN.js`, Python en el
    navegador con Pyodide vía `javascripts/py-run.js`, animaciones con Motion vía `javascripts/ia-core.js`).
  - `notebooks/` — notebooks de Colab de cada clase y plantilla del proyecto final.
  - `datasets/` — datos ficticios de los casos FinTrust y MercaSur.
  - `proyecto/` — enunciado, rúbricas y sprints.
- `tools/generar_datos.py` — genera los datasets (`python tools/generar_datos.py`).

## Desarrollo local

```bash
pip install -r requirements.txt
mkdocs serve
```

Al hacer push a `main`, GitHub Actions publica el sitio en GitHub Pages.
