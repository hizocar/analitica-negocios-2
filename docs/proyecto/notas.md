---
search:
  exclude: true
---

<div class="usm-hero" markdown>
<div>
<span class="usm-hero-tag">Proyecto del curso</span>
<h1>📊 Notas y retroalimentación</h1>
<p>Cada equipo aparece solo con su nombre, sin integrantes. Las notas están ocultas: busca tu equipo y
haz clic para ver tu nota, el detalle por criterio de la rúbrica y los comentarios.</p>
</div>
</div>

!!! info "Sobre esta revisión"
    Cada entrega se corrigió contra la rúbrica publicada en [Sprints y buzón](sprints.md), leyendo el
    notebook completo con sus resultados. Se evalúa lo que el notebook **muestra**: una celda que define
    algo pero no se ejecuta no tiene resultado que evaluar. Escala de 1 a 100.

    Si crees que tu nota no refleja tu entrega, escribe a **sebastian.azocarm@usm.cl** o plantéalo en la
    tutoría del jueves. Recuerda que los sprints se pueden **corregir para la entrega final**: la nota del
    sprint no cambia, pero la entrega final evalúa la versión corregida.

## 🧱 Sprint 1 · Datos y primeros modelos (10 %)

Entregas recibidas: **2 de 2 equipos inscritos**, ambas dentro del plazo (domingo 8 de noviembre, 23:59).

| Criterio | Peso | Nivel 100 |
|---|:-:|---|
| Pregunta de negocio y auditoría de datos | 30 % | Pregunta concreta; todos los problemas de calidad detectados y resueltos con decisiones justificadas. |
| EDA de texto | 20 % | Gráficos pertinentes, cada uno con su conclusión. |
| Modelos y evaluación | 35 % | Sin fuga de datos; baseline y MLP bien evaluados; curvas interpretadas. |
| Interpretación para el negocio | 15 % | Lee la matriz de confusión en términos de costos de error. |

??? note "🔒 Alvami · FinTrust — ver nota y retroalimentación"

    <p class="usm-nota"><strong>Nota Sprint 1: 63</strong> · 🟡 Amarillo</p>

    Entregado el domingo 8 de noviembre a las 22:13 (a tiempo).

    | Criterio | Peso | Nota |
    |---|:-:|:-:|
    | **Pregunta de negocio y auditoría**<br><small>Pregunta muy bien planteada. La auditoría que se ve es la de la plantilla y falta la tabla de decisiones.</small> | 30 % | 60 |
    | **EDA de texto**<br><small>Tres gráficos claros y con conclusión; dos conclusiones no calzan del todo con los datos.</small> | 20 % | 78 |
    | **Modelos y evaluación**<br><small>Correctos y sin fuga, pero faltan las variantes de la red y la lectura de las curvas.</small> | 35 % | 68 |
    | **Interpretación para el negocio**<br><small>No hay lectura de los errores en términos de costos.</small> | 15 % | 35 |
    | **Nota final**<br><small>0,30 × 60 + 0,20 × 78 + 0,35 × 68 + 0,15 × 35 = 62,65</small> | | **63** |

    **✅ Lo que está bien**

    - **La pregunta de negocio (celda 37) es de las mejores posibles:** dice qué decisión apoya el modelo
      (derivar cada reclamo al área correcta), a quién (mesa central y operaciones) y cuál es la prioridad
      (alertas de fraude). Úsenla como hilo conductor de todo el proyecto.
    - **Los tres gráficos de EDA (celdas 40–45)** están bien hechos (títulos, ejes, valores, mediana y
      percentil 95) y cada uno trae su conclusión.
    - **Los modelos están bien evaluados:** división estratificada, TF-IDF ajustado solo con entrenamiento
      (sin fuga), regresión logística y MLP con F1 macro 0,951 ambas, reportes y matrices de confusión.

    **🔧 Qué corregir para la entrega final**

    1. **Auditoría:** su función `auditar` ampliada (celda 38, con RUT y correos) está **definida pero nunca
       se ejecuta**, así que no hay resultado. Llámenla y muestren la tabla.
    2. **Falta la tabla problema → decisión → filas afectadas** que pide la rúbrica. Por ejemplo:
       «180 duplicados → eliminar → 180 filas». Incluyan también los hallazgos que hoy quedan sin decisión:
       **187 urgencias nulas** y **19 formas de escribir `canal`**.
    3. **EDA, precisión de las cifras:** las clases van de **12,6 %** (Información y trámites, 750) a **21 %**
       (Cobro indebido, 1.250), no de «~14 %». La conclusión de palabras frecuentes dice que casi no hay
       términos compartidos, pero «tarjeta» y «banco» aparecen en varias clases: la plantilla pedía
       justamente identificarlas, porque son las que confunden al modelo.
    4. **Red neuronal:** prueben al menos **dos variantes** (p. ej. 64 vs. 256 neuronas, o dropout 0,2 vs. 0,5),
       elijan con **validación** (no con test) y registren el F1 de validación en una tabla (ejercicio 4).
    5. **Curvas:** escriban qué muestran: si hay sobreajuste, desde qué época y dónde se detuvo el
       entrenamiento (ejercicio 5).
    6. **Lectura de negocio:** la celda 35 muestra que **9 de 187 fraudes se escapan** (recall 95,2 %) y a qué
       áreas van. Falta decir qué error cuesta más (un fraude no detectado vs. una falsa alarma), cuánto
       podría costar y qué harían: bajar el umbral para Fraude, revisión humana, etc.

    **📌 Requisitos de entrega**

    - La **primera celda está vacía**: debe tener los integrantes, el caso y el enlace de Colab
      (ver [Sprints y buzón](sprints.md)).
    - Agreguen la celda final **«Uso de IA»** (qué herramientas usaron y para qué).
    - La celda 3 vuelve a leer los datos y sobra.

    **🔭 Adelanto del Sprint 2 (no evaluado en esta nota)**

    Ya avanzaron con embeddings, y está muy bien. Ojo con estos puntos antes del domingo 15:

    - La conclusión dice que con 50 o 200 ejemplos «TF-IDF colapsa», pero **su propia tabla muestra lo
      contrario**: TF-IDF gana con 50 (0,749 vs. 0,617), con 200 (0,928 vs. 0,871) y con 1.000 ejemplos
      (0,950 vs. 0,932). La conclusión tiene que salir de sus datos. La ventaja de los embeddings aparece
      con **paráfrasis**: evalúen la curva también en paráfrasis, con más de 5 frases (ver Clase 2).
    - La función `buscar` está definida, pero no la ejecutan con las 5 consultas de negocio.
    - A los clusters les falta el nombre de negocio. El «few-shot» de la Clase 2 se refiere a pocos
      ejemplos etiquetados; no lo confundan con el few-shot de prompts de la Clase 3.

??? note "🔒 Emanix · MercaSur — ver nota y retroalimentación"

    <p class="usm-nota"><strong>Nota Sprint 1: 96</strong> · 🟢 Verde</p>

    Entregado el domingo 8 de noviembre a las 21:09 (a tiempo).

    | Criterio | Peso | Nota |
    |---|:-:|:-:|
    | **Pregunta de negocio y auditoría**<br><small>Auditoría excelente y con tabla de decisiones; a la pregunta le falta decir a quién beneficia.</small> | 30 % | 95 |
    | **EDA de texto**<br><small>Completo, con conclusiones precisas en cada gráfico.</small> | 20 % | 97 |
    | **Modelos y evaluación**<br><small>Metodología impecable: validación, control de fuga, dos redes, curvas interpretadas.</small> | 35 % | 100 |
    | **Interpretación para el negocio**<br><small>Identifican el error más costoso; falta cuantificarlo.</small> | 15 % | 88 |
    | **Nota final**<br><small>0,30 × 95 + 0,20 × 97 + 0,35 × 100 + 0,15 × 88 = 96,1</small> | | **96** |

    **✅ Lo que está bien**

    - **La auditoría es la más completa posible**:
        - nulos, 180 duplicados, 44 «ok», 19 variantes de etiqueta;
        - ratings faltantes (63) e inválidos (15), 20 precios en cero, fechas y canales;
        - además encontraron **38 textos con etiquetas contradictorias** (183 filas), que no estaba en la
          plantilla.
    - **La función `limpiar_mercasur`** registra cada decisión en una tabla problema → decisión → filas
      afectadas, como pide la rúbrica.
    - **El EDA** trae distribución, largo por clase y palabras por aspecto, con conclusiones precisas
      (p. ej. «descuento» aparece en Precio y en Pago y puede confundir al modelo).
    - **Los modelos tienen una metodología de nivel profesional**:
        - división 60/20/20 estratificada;
        - **comprobación explícita de que no hay textos repetidos entre conjuntos**;
        - TF-IDF ajustado solo con entrenamiento;
        - dos redes elegidas con F1 de **validación**;
        - early stopping con `restore_best_weights=True`;
        - curvas interpretadas: sobreajuste desde la época 7, pesos de la época 6;
        - reportes y matrices de ambos modelos en test (logística 0,871 vs. MLP 0,881).
    - **Son honestos con la diferencia:** reconocen que la ventaja de la red es pequeña y que es de una
      sola partición. Eso es exactamente lo que se espera.
    - **La revisión de errores de Pago** distingue errores del modelo, reseñas con varios aspectos y
      etiquetas dudosas.

    **🔧 Qué mejorar para la entrega final**

    1. **Pregunta de negocio:** sumen en 1–2 líneas **a quién beneficia** y qué se gana. Por ejemplo, el
       equipo de pagos recibe antes los cobros duplicados y baja el tiempo de devolución.
    2. **Lectura en costos:** ya identificaron el error más caro (un cobro doble que no llega a Pagos).
       Para llegar a 100, tradúzcanlo a números aunque sea con supuestos. Por ejemplo: de 86 reseñas de Pago,
       15 se van a otro equipo (7 a Despacho); si cada una demora X días más y cuesta Y en atención o
       en devoluciones, ¿cuánto cuesta al mes?
    3. **Una decisión para discutir:** eliminar los **397 textos repetidos con etiqueta consistente** evita
       que el mismo texto quede en entrenamiento y test (bien hecho). Pero en producción los clientes sí
       repiten frases, así que la distribución que ve el modelo cambia. Menciónenlo en las limitaciones.

    **📌 Requisitos de entrega**

    - La primera celda debe tener **los integrantes, el caso y el enlace de Colab** (ver
      [Sprints y buzón](sprints.md)); hoy solo tiene la pregunta.
    - Agreguen la celda final **«Uso de IA»** (qué herramientas usaron y para qué).
