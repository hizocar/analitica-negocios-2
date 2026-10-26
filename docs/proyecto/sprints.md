# 📬 Sprints y buzón

El proyecto avanza en **tres sprints evaluados** (10 % cada uno) y una **entrega final** (40 %). Cada
sprint aplica la cápsula de la semana a tu caso y se entrega **por buzón hasta el domingo a las 23:59**.
En la tutoría del jueves siguiente recibes la nota, un semáforo y los comentarios.

| Entrega | Cápsula | Plazo (buzón) | Peso | Devolución |
|---|---|---|:-:|---|
| Inscripción de equipo y caso | — | Domingo 1 nov, 23:59 | — | Jueves 5 nov |
| **Sprint 1** · Datos y primeros modelos | [Clase 1](../clases/clase1.md) | Domingo 8 nov, 23:59 | 10 % | Jueves 12 nov |
| **Sprint 2** · Embeddings | [Clase 2](../clases/clase2.md) | Domingo 15 nov, 23:59 | 10 % | Jueves 19 nov |
| **Sprint 3** · LLM | [Clase 3](../clases/clase3.md) | Domingo 22 nov, 23:59 | 10 % | Jueves 26 nov |
| **Entrega final** · RAG, comparación y slides | [Clases 4 y 5](../clases/clase4.md) | Domingo 29 nov, 23:59 | 40 % | Jueves 3 dic |

## 📮 Cómo entregar por buzón

1. Descarga tu notebook desde Colab: *Archivo → Descargar → Descargar .ipynb*.
2. Nómbralo así: `S1_FinTrust_Apellido1_Apellido2_Apellido3.ipynb` (cambia `S1` por `S2`, `S3` o `FINAL`,
   y el caso por `MercaSur` o `Propio` si corresponde).
3. En la **primera celda** del notebook escribe los nombres del equipo, el caso y el **enlace de Colab**
   compartido con permiso de lectura.
4. Súbelo al **buzón del curso** antes del domingo a las 23:59. Basta con que **un integrante** entregue
   por el equipo.

!!! warning "Antes de subir"
    - Ejecuta *Entorno de ejecución → Reiniciar y ejecutar todo* y verifica que no haya errores.
    - Revisa que **no aparezca tu clave de API** en ninguna celda ni salida.
    - Deja las salidas (gráficos, tablas y métricas) visibles: se corrige lo que se ve.

## 🚦 Semáforo de la tutoría

Además de la nota, cada entrega recibe un semáforo para orientar el siguiente paso:

- 🟢 **Verde:** van bien, sigan así.
- 🟡 **Amarillo:** hay ajustes que deben corregir antes de la entrega final (revisen los comentarios).
- 🔴 **Rojo:** hay un problema que pone en riesgo la entrega final; lo conversamos en la tutoría.

Los sprints se pueden **corregir para la entrega final**. La nota del sprint no cambia, pero la entrega
final evalúa la versión corregida.

---

<div class="ia-sprint" markdown>
### Sprint 1 · Datos y primeros modelos <span class="ia-badge">10 %</span><span class="ia-badge is-gold">Domingo 8 de noviembre</span>

**Cápsula:** [Clase 1 · Redes neuronales en la práctica](../clases/clase1.md) ·
**Notebook base:** [clase1_redes_neuronales.ipynb](https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/clase1_redes_neuronales.ipynb)

**Qué entregar:**

- [ ] **Pregunta de negocio** en 2–3 líneas: qué decisión apoya el modelo y a quién beneficia.
- [ ] **Auditoría de datos:** duplicados, textos vacíos o basura, categorías mal escritas, valores imposibles
  y nulos. Una **tabla resumen** (problema → decisión → filas afectadas).
- [ ] **EDA de texto:** distribución de clases, largo de los textos y palabras más frecuentes por clase, con
  una conclusión por gráfico.
- [ ] **Baseline:** TF-IDF + regresión logística, con división entrenamiento/prueba **estratificada** y antes
  de ajustar el vectorizador.
- [ ] **Red neuronal (MLP) en Keras** sobre TF-IDF, con validación y early stopping, y sus curvas de entrenamiento.
- [ ] **Comparación en test:** F1 macro, `classification_report` y matriz de confusión de ambos modelos, y
  qué error es más costoso para el negocio.

| Criterio | Peso | Nivel 7,0 |
|---|:-:|---|
| Pregunta de negocio y auditoría de datos | 30 % | Pregunta concreta; todos los problemas de calidad detectados y resueltos con decisiones justificadas. |
| EDA de texto | 20 % | Gráficos pertinentes, cada uno con su conclusión. |
| Modelos y evaluación | 35 % | Sin fuga de datos; baseline y MLP bien evaluados; curvas interpretadas. |
| Interpretación para el negocio | 15 % | Lee la matriz de confusión en términos de costos de error. |
</div>

<div class="ia-sprint" markdown>
### Sprint 2 · Embeddings <span class="ia-badge">10 %</span><span class="ia-badge is-gold">Domingo 15 de noviembre</span>

**Cápsula:** [Clase 2 · Embeddings](../clases/clase2.md) ·
**Notebook base:** [clase2_embeddings.ipynb](https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/clase2_embeddings.ipynb)

**Qué entregar:**

- [ ] **Embeddings** de todos los textos con sentence-transformers (modelo multilingüe), guardados para reutilizar.
- [ ] **Clasificador sobre embeddings** comparado con los modelos del Sprint 1 en el **mismo test**.
- [ ] **Curva con pocos datos:** F1 macro entrenando con 50, 200 y 1.000 ejemplos, TF-IDF vs. embeddings,
  evaluando también sobre **textos redactados con otras palabras** (paráfrasis), y qué significa para una
  empresa que tiene pocos datos etiquetados o clientes que escriben distinto.
- [ ] **Buscador semántico:** función `buscar(consulta, k)` y **5 consultas de negocio** con sus resultados
  comentados (¿encontró lo que TF-IDF no?).
- [ ] **Mapa de temas:** clustering sobre embeddings, elección de k justificada y un **nombre de negocio**
  para cada cluster.

| Criterio | Peso | Nivel 7,0 |
|---|:-:|---|
| Embeddings y clasificación | 30 % | Comparación justa contra el Sprint 1 (mismo test y misma métrica). |
| Curva con pocos datos | 25 % | Experimento bien hecho y conclusión clara para el negocio. |
| Búsqueda semántica | 20 % | Consultas relevantes y análisis de aciertos y fallos. |
| Temas descubiertos | 25 % | k justificado; clusters interpretados con nombres útiles para el negocio. |
</div>

<div class="ia-sprint" markdown>
### Sprint 3 · LLM <span class="ia-badge">10 %</span><span class="ia-badge is-gold">Domingo 22 de noviembre</span>

**Cápsula:** [Clase 3 · Transformers y LLMs](../clases/clase3.md) ·
**Notebook base:** [clase3_llms.ipynb](https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/clase3_llms.ipynb) ·
**Antes de empezar:** [guía de la API de Gemini](../guias/gemini.md)

**Qué entregar:**

- [ ] **Anonimización** de RUT, teléfonos, correos y nombres **antes** de enviar textos a la API, y cuántos
  textos tenían datos personales.
- [ ] **Clasificación zero-shot y few-shot** con un LLM sobre al menos **100 casos del test**, con salida
  estructurada (JSON con categorías permitidas).
- [ ] **Extracción estructurada:** al menos 4 campos útiles para el negocio (por ejemplo: categoría, urgencia,
  producto, monto, si requiere contacto, resumen breve).
- [ ] **Comparación:** F1 macro, costo estimado por 1.000 casos (tokens) y latencia del LLM frente al mejor
  modelo de los Sprints 1–2.
- [ ] **Análisis de errores:** 5 casos donde el LLM falla o discrepa de la etiqueta. ¿Se equivoca el modelo o
  la etiqueta?

| Criterio | Peso | Nivel 7,0 |
|---|:-:|---|
| Anonimización y buenas prácticas | 15 % | PII enmascarada antes de la API; sin claves expuestas. |
| Prompts y salidas estructuradas | 30 % | Prompts claros; zero-shot vs. few-shot comparados; JSON validado. |
| Evaluación y costo | 35 % | Métricas sobre el mismo test; costo y latencia medidos, no supuestos. |
| Análisis de errores | 20 % | Casos bien elegidos y una explicación con criterio. |
</div>

<div class="ia-sprint" markdown>
### Entrega final · RAG, comparación y slides <span class="ia-badge">40 %</span><span class="ia-badge is-gold">Domingo 29 de noviembre</span>

**Cápsulas:** [Clase 4 · RAG](../clases/clase4.md) y [Clase 5 · Del prototipo a la decisión](../clases/clase5.md) ·
**Plantilla:** [proyecto_final_plantilla.ipynb](https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/proyecto_final_plantilla.ipynb)

Requisitos completos y rúbrica en [Enunciado y rúbrica](enunciado.md).
</div>
