# 🎯 Proyecto final: enunciado y rúbrica

!!! abstract "En una frase"
    En equipo, construyan un sistema que **lea lo que escriben los clientes de una empresa y ayude a
    decidir qué hacer**: clasificarlo, encontrar temas, extraer información y responder preguntas con los
    documentos de la empresa. Después **recomienden** qué enfoque usar en producción y por qué.

El proyecto es el **100 % de la nota** del curso y se construye durante cinco semanas: tres sprints
evaluados (30 %), la entrega final (40 %) y la presentación (30 %). Cada sprint aplica la cápsula de la
semana a tu caso, así que la entrega final es la integración de lo que ya hiciste.

## 👥 Equipos

- Grupos de **2 o 3 integrantes**.
- Equipo y caso se inscriben por buzón hasta el **domingo 1 de noviembre** (sin nota).
- Todos los integrantes deben entender todo el notebook: en la tutoría y en la presentación se puede
  preguntar a cualquiera por cualquier parte.

## 🗂️ Casos

Elijan **un** caso. Los datos son ficticios pero realistas, y vienen **sucios a propósito**: limpiarlos es
parte del trabajo. Todos los archivos están en [Datasets](../datasets/datasets.md).

<div class="usm-card-grid" markdown>

<div class="usm-card" markdown>
### 🏦 Caso A · FinTrust
**Banco.** 6.180 reclamos de clientes con texto libre, canal, producto, monto, categoría y urgencia, más un
**manual de 10 políticas** internas.

**Pregunta de negocio:** ¿cómo derivar cada reclamo al área correcta y priorizar los urgentes (como los
fraudes) sin leerlos uno a uno? ¿Puede un asistente responder las dudas frecuentes con las políticas?
</div>

<div class="usm-card" markdown>
### 🛒 Caso B · MercaSur
**Retail online.** 6.180 reseñas con texto libre, producto, categoría, canal, precio, rating y aspecto
principal, más **8 políticas** de despacho, devoluciones, garantía y pagos.

**Pregunta de negocio:** ¿qué aspectos de la experiencia generan más quejas y en qué productos? ¿Puede un
asistente responder las dudas de los clientes con las políticas?
</div>

<div class="usm-card" markdown>
### 💡 Caso C · Caso propio
Un problema con **texto en español** (reclamos, reseñas, tickets, encuestas abiertas…) de una fuente
pública, con:

- al menos **1.000 textos** y una etiqueta para clasificar;
- al menos **5 documentos** para el asistente RAG;
- datos legibles desde una URL pública.

Requiere propuesta de una página aprobada (inscripción del 1 de noviembre).
</div>

</div>

## 🧱 Qué se construye en cada etapa

| Etapa | Pregunta que responde | Técnica principal |
|---|---|---|
| Sprint 1 | ¿Qué datos tenemos y qué tan bien clasifica un modelo clásico? | Limpieza, TF-IDF, regresión logística, red neuronal (MLP) |
| Sprint 2 | ¿Ayuda entender el *significado* y no solo las palabras? | Embeddings, búsqueda semántica, clustering de temas |
| Sprint 3 | ¿Puede un LLM hacerlo sin entrenamiento? ¿A qué costo? | Prompting zero-shot y few-shot, extracción en JSON |
| Entrega final | ¿Puede responder preguntas con nuestros documentos? ¿Qué recomendamos? | RAG, evaluación, comparación final, ROI y riesgos |

El detalle de cada sprint y su rúbrica están en [Sprints y buzón](sprints.md).

## 📓 Entrega final (40 %) · domingo 29 de noviembre, 23:59

Un **notebook de Colab** (partan de la [plantilla del proyecto](https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/proyecto_final_plantilla.ipynb))
que integre los sprints, ya corregidos con la retroalimentación recibida, y agregue:

1. **Pregunta de negocio** y a quién beneficia la solución.
2. **Datos y limpieza:** resumen de problemas encontrados, decisiones y filas afectadas.
3. **Modelos de clasificación:** baselines (Sprint 1), embeddings (Sprint 2) y LLM (Sprint 3), evaluados sobre
   el **mismo conjunto de prueba**.
4. **Asistente RAG** sobre los documentos del caso:
    - chunking justificado, recuperación con embeddings (o TF-IDF) y generación con un LLM que **cite** el documento;
    - evaluación con el set `preguntas_eval_*.csv`: **hit@k** de la recuperación y corrección de las
      respuestas (manual o con LLM como juez, explicando el criterio);
    - comportamiento ante la **pregunta trampa** (debe decir que no sabe).
5. **Comparación final:** tabla con calidad (F1 macro), costo estimado por 1.000 casos, latencia, necesidad
   de datos etiquetados y riesgos de cada enfoque.
6. **Recomendación de negocio:** qué enfoque usarían en producción y por qué, con una estimación de valor
   (ROI o ahorro) y sus supuestos.
7. **Riesgos y limitaciones:** privacidad (anonimización), alucinaciones, sesgos, prompt injection y qué
   revisión humana proponen.
8. **Uso de IA:** celda final declarando qué herramientas de IA usaron y para qué.

Además, las **slides en PDF** de la presentación.

**Requisitos técnicos:** el notebook corre completo tras *Entorno de ejecución → Reiniciar y ejecutar todo*,
lee los datos desde una URL, no contiene claves de API y cada sección parte con una celda de texto que explica
qué se hace y qué se concluye.

## 🎤 Presentación final (30 %) · jueves 3 de diciembre, 18:30

- **10 minutos** de presentación y **5 minutos** de preguntas. Hablan todos los integrantes.
- Estructura **piramidal**: la recomendación primero y luego los argumentos que la sostienen (ver
  [Clase 5](../clases/clase5.md)).
- Audiencia: la gerencia de la empresa del caso. Hablen de reclamos bien derivados, horas ahorradas y
  riesgos, no de hiperparámetros.
- Si pueden, muestren el asistente funcionando en una **demo de 1 minuto** (Gradio).

## 📐 Rúbrica de la entrega final (40 %)

| Criterio | Peso | Nivel 7,0 |
|---|:-:|---|
| Reproducibilidad y orden | 10 % | Corre completo tras reiniciar; lee desde URL; secciones con texto que explica y concluye; sin claves expuestas. |
| Datos y modelos de clasificación | 25 % | Limpieza justificada; los tres enfoques evaluados sobre el mismo test, sin fuga de datos; métricas adecuadas; análisis de errores. |
| Asistente RAG y su evaluación | 30 % | Chunking justificado; recuperación medida con hit@k; respuestas con cita; evaluación de corrección con criterio explícito; maneja la pregunta trampa. |
| Comparación y recomendación | 20 % | Tabla comparativa completa (calidad, costo, latencia, datos, riesgos); recomendación clara que se desprende de la evidencia; estimación de valor con supuestos explícitos. |
| Riesgos y uso responsable | 15 % | Anonimización aplicada antes de usar APIs; riesgos concretos del caso (alucinación, sesgo, injection) con medidas de mitigación y revisión humana. |

## 📐 Rúbrica de la presentación (30 %)

| Criterio | Peso | Nivel 7,0 |
|---|:-:|---|
| Estructura piramidal | 30 % | La recomendación aparece en el primer minuto; tres argumentos claros; cada lámina tiene un título que es una conclusión. |
| Evidencia y visualización | 25 % | Gráficos limpios y legibles; métricas traducidas a lenguaje de negocio; comparación honesta entre enfoques. |
| Valor y riesgos | 20 % | Cuantifica el valor (ahorro, ROI) y explica los riesgos con su mitigación. |
| Manejo del tiempo y equipo | 10 % | Respeta los 10 minutos; todos los integrantes participan con transiciones fluidas. |
| Respuesta a preguntas | 15 % | Responde con precisión, reconoce las limitaciones y cualquier integrante puede explicar cualquier parte. |

Escala de **1,0 a 7,0**; nota de aprobación **4,0**. Política de atrasos, uso de IA y claves de API en el
[Programa](../programa.md#7-politicas).
