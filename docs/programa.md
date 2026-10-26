# 📋 Programa de la asignatura

**Analítica para los Negocios II** · Universidad Técnica Federico Santa María · Formato intensivo en
modo tutoría · 29 de octubre al 3 de diciembre de 2026.

## 1. Descripción

El curso continúa *Analítica para los Negocios I* y se enfoca en los datos que más abundan en una
empresa y que menos se analizan: **el texto**. Los estudiantes aprenden a aplicar redes neuronales,
embeddings, transformers y modelos de lenguaje de gran tamaño (LLMs) a problemas de negocio reales
(clasificar y priorizar reclamos, entender reseñas, responder preguntas con las políticas de la
empresa) y, sobre todo, a **decidir qué técnica conviene** según su calidad, costo, riesgo y valor.

El curso se organiza en torno a **un único proyecto en equipo** que crece durante cinco semanas,
desde un primer modelo hasta un asistente con recuperación aumentada (RAG), y termina con una
presentación ejecutiva.

## 2. Prerrequisitos

*Analítica para los Negocios I* o un curso equivalente. Se asume manejo de Python con pandas y
scikit-learn, la división en entrenamiento y prueba, la validación cruzada, la regresión logística y las
métricas de clasificación (precision, recall, F1 y matriz de confusión).

## 3. Resultados de aprendizaje

Al finalizar el curso, el estudiante será capaz de:

1. **Explicar** cómo aprende una red neuronal (neuronas, capas, función de pérdida y descenso de gradiente) y
   **controlar** el sobreajuste con validación, early stopping y dropout.
2. **Representar texto** como datos (TF-IDF y embeddings) y usar esas representaciones para clasificar,
   buscar por significado y descubrir temas.
3. **Describir** a nivel conceptual cómo funcionan los transformers y los LLMs (tokens, atención,
   preentrenamiento, temperatura) y sus limitaciones (alucinaciones, sesgos, costo).
4. **Diseñar prompts** para clasificar y extraer información estructurada, y **evaluar** un LLM con
   métricas, costo y latencia, como cualquier otro modelo.
5. **Construir y evaluar** un asistente RAG que responde con documentos de la empresa y los cita.
6. **Recomendar** una solución a un problema de negocio comparando alternativas por calidad, costo,
   riesgo y valor, y **comunicarla** a una audiencia ejecutiva con estructura piramidal.
7. **Aplicar** criterios de uso responsable: anonimización de datos personales, revisión humana y
   riesgos de manipulación del modelo (prompt injection).

## 4. Contenidos

| Unidad | Contenidos | Cápsula |
|---|---|---|
| 1 · Redes neuronales en la práctica | Neurona y funciones de activación · Redes multicapa y fronteras no lineales · Función de pérdida, descenso de gradiente, épocas y batches · Sobreajuste, early stopping y dropout · Texto como datos: bolsa de palabras y TF-IDF · Red neuronal en Keras | [Clase 1](clases/clase1.md) |
| 2 · Embeddings | Límites de TF-IDF · Representaciones densas · Similitud coseno · Búsqueda semántica · Clasificación con pocos datos · Descubrimiento de temas con clustering | [Clase 2](clases/clase2.md) |
| 3 · Transformers y LLMs | Tokens y ventana de contexto · Modelos de lenguaje y temperatura · Atención · Preentrenamiento y ajuste por instrucciones · Prompting zero-shot y few-shot · Salidas estructuradas · Anonimización · Evaluación de un LLM como clasificador | [Clase 3](clases/clase3.md) |
| 4 · RAG | Alucinaciones y conocimiento propio de la empresa · Chunking · Recuperación con TF-IDF y embeddings · Prompts con contexto y citas · Evaluación (hit@k, fidelidad, corrección) · Demo con Gradio | [Clase 4](clases/clase4.md) |
| 5 · Del prototipo a la decisión | Comparación de enfoques · Valor de negocio y ROI · Comparar modelos con incertidumbre (bootstrap) · Riesgos y uso responsable (Ley 21.719) · Pitch piramidal | [Clase 5](clases/clase5.md) |

## 5. Metodología

El curso es **intensivo y en modo tutoría**, con tres piezas que se repiten cada semana:

- **Cápsula de autoestudio (~2,5 h).** Cada clase es una página de este sitio con explicaciones,
  simuladores interactivos, código Python ejecutable en el navegador, preguntas de autoevaluación y un
  notebook de Google Colab que aplica los contenidos a los datos del proyecto. Se estudia **antes de la
  tutoría del jueves siguiente** y mientras se avanza en el sprint.
- **Tutoría de los jueves, 18:30 a 19:30 (1 hora).** No es una clase expositiva. Se usa para:

    | Tiempo | Actividad |
    |---|---|
    | 10 min | Ideas clave de la cápsula de la semana y dudas generales |
    | 45 min | Revisión por equipo: cada equipo muestra su notebook y recibe un semáforo 🟢🟡🔴 con comentarios |
    | 5 min | Cierre: qué entregar el domingo y errores frecuentes |

    Cada equipo debe llegar con su notebook abierto y **una pregunta concreta**.

- **Sprints por buzón.** El proyecto avanza en tres sprints evaluados que se entregan **por buzón hasta
  el domingo a las 23:59**. La retroalimentación se entrega en la tutoría siguiente.

## 6. Evaluación

La nota final del curso es la nota del **proyecto**, compuesta por:

| Componente | Ponderación | Entrega |
|---|:-:|---|
| Sprint 1 · Datos y primeros modelos | 10 % | Domingo 8 de noviembre, 23:59 (buzón) |
| Sprint 2 · Embeddings | 10 % | Domingo 15 de noviembre, 23:59 (buzón) |
| Sprint 3 · LLM | 10 % | Domingo 22 de noviembre, 23:59 (buzón) |
| Entrega final · notebook, asistente RAG y slides | 40 % | Domingo 29 de noviembre, 23:59 (buzón) |
| Presentación final | 30 % | Jueves 3 de diciembre (en la tutoría) |

- Escala de notas de **1,0 a 7,0**; nota de aprobación **4,0**.
- Cada sprint se evalúa con una rúbrica corta publicada en [Sprints y buzón](proyecto/sprints.md). La
  entrega final y la presentación se evalúan con la rúbrica de [Enunciado y rúbrica](proyecto/enunciado.md).
- La nota de la presentación es individual: se ajusta según la participación y las respuestas de cada
  integrante.

## 7. Políticas

- **Equipos:** de 2 o 3 integrantes. Equipo y caso se inscriben hasta el **domingo 1 de noviembre**.
- **Atrasos:** se descuenta **1,0 punto por cada día de atraso** (hasta dos días). Pasado ese plazo, la
  entrega se califica con nota 1,0. Si tienes un problema justificado, avisa **antes** del plazo.
- **Reproducibilidad:** el notebook debe ejecutarse completo, de principio a fin, tras *Reiniciar y ejecutar
  todo*, y leer los datos desde una URL.
- **Uso de IA generativa:** puedes usar asistentes de IA (ChatGPT, Gemini, Claude, Copilot) para
  programar y redactar. Debes **declararlo** en una celda final "Uso de IA" (qué usaste y para qué), y
  cada integrante debe poder **explicar cualquier parte del código** en la tutoría o la presentación.
- **Claves de API:** nunca escribas tu clave en el notebook ni la subas al buzón. Usa los *Secretos* de
  Colab (ver [guía de Gemini](guias/gemini.md)).
- **Datos personales:** los datos de los casos son ficticios, pero contienen datos personales falsos a
  propósito. Trátalos como si fueran reales: anonimízalos antes de enviarlos a cualquier API.

## 8. Herramientas

Python en [Google Colab](guias/colab.md) · pandas · scikit-learn · Keras · sentence-transformers ·
Hugging Face Transformers · API de Gemini (capa gratuita, [guía](guias/gemini.md)) · Gradio. No se
requiere instalar nada en tu computador.

## 9. Bibliografía

**Básica**

- Alammar, J. y Grootendorst, M. (2024). *Hands-On Large Language Models*. O'Reilly.
- Chollet, F. (2021). *Deep Learning with Python* (2.ª ed.). Manning.
- Jurafsky, D. y Martin, J. H. *Speech and Language Processing* (3.ª ed., borrador en línea).
  [web.stanford.edu/~jurafsky/slp3](https://web.stanford.edu/~jurafsky/slp3/)

**Complementaria**

- Tunstall, L., von Werra, L. y Wolf, T. (2022). *Natural Language Processing with Transformers*. O'Reilly.
- James, G., Witten, D., Hastie, T., Tibshirani, R. y Taylor, J. (2023). *An Introduction to Statistical
  Learning with Applications in Python*. Springer. [statlearning.com](https://www.statlearning.com/) (texto del curso I)
- Minto, B. (2009). *The Pyramid Principle: Logic in Writing and Thinking*. Pearson.
- Curso de LLMs de Hugging Face: [huggingface.co/learn/llm-course](https://huggingface.co/learn/llm-course)
- 3Blue1Brown, serie *Neural Networks*: [3blue1brown.com/topics/neural-networks](https://www.3blue1brown.com/topics/neural-networks)
