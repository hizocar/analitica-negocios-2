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

## 🧭 Sprint 2 · Embeddings (10 %)

Entregas recibidas: **2 de 2 equipos inscritos**. Una dentro del plazo (domingo 15 de noviembre, 23:59) y
una con un día de atraso (−15 puntos).

| Criterio | Peso | Nivel 100 |
|---|:-:|---|
| Embeddings y clasificación | 30 % | Comparación justa contra el Sprint 1 (mismo test y misma métrica). |
| Curva con pocos datos | 25 % | Experimento bien hecho y conclusión clara para el negocio. |
| Búsqueda semántica | 20 % | Consultas relevantes y análisis de aciertos y fallos. |
| Temas descubiertos | 25 % | k justificado; clusters interpretados con nombres útiles para el negocio. |

??? note "🔒 Alvami · FinTrust — ver nota y retroalimentación"

    <p class="usm-nota"><strong>Nota Sprint 2: 61</strong> · 🟡 Amarillo</p>

    Entregado el lunes 16 de noviembre a las 03:00: **un día de atraso (−15 puntos)**.

    | Criterio | Peso | Nota |
    |---|:-:|:-:|
    | **Embeddings y clasificación**<br><small>Comparación justa de cuatro modelos en el mismo test, con análisis de Fraude.</small> | 30 % | 95 |
    | **Curva con pocos datos**<br><small>Experimento bien hecho; la conclusión exagera en N = 50 y cita un ejemplo que no calza.</small> | 25 % | 88 |
    | **Búsqueda semántica**<br><small>Buenas consultas de negocio, pero dos comentarios contradicen los resultados.</small> | 20 % | 75 |
    | **Temas descubiertos**<br><small>Los nombres de los clusters no corresponden a su contenido.</small> | 25 % | 40 |
    | **Nota de la rúbrica**<br><small>0,30 × 95 + 0,25 × 88 + 0,20 × 75 + 0,25 × 40 = 75,5</small> | | 75,5 |
    | **Atraso**<br><small>1 día × −15 puntos</small> | | −15 |
    | **Nota final**<br><small>75,5 − 15 = 60,5</small> | | **61** |

    **✅ Lo que está bien**

    - **Corrigieron la curva del Sprint 1.** Ahora promedian tres submuestras y evalúan con **42
      paráfrasis**. La conclusión sale de sus datos: TF-IDF gana en el test habitual y los embeddings ganan
      en paráfrasis (0,766 vs. 0,628 con 200 ejemplos; 0,810 vs. 0,671 con 1.000).
    - **La comparación de clasificadores es justa y completa** (celda 9). Comparan cuatro modelos sobre los
      **mismos 1.192 textos de test**, con F1 macro, reportes y matrices. Comprueban con `assert` que la
      partición es idéntica a la del Sprint 1. Las variantes de red se eligen con validación interna.
    - **El análisis de Fraude (celda 11)** cuenta fraudes escapados y falsas alarmas por modelo. Mantiene el
      foco de su pregunta de negocio.
    - **El buscador está bien construido:** `buscar` y `buscar_tfidf` sobre el mismo corpus, cada consulta
      ligada a un área y a una necesidad, y P@5 de ambos métodos. La consulta 2 es un muy buen ejemplo:
      embeddings entiende que «descontaron dos veces el mismo pago» equivale a «me cobraron dos veces la
      misma compra». TF-IDF, en cambio, se engancha con «dos veces» y trae llamadas cortadas.
    - **Embeddings guardados para reutilizar**, con huella SHA-256 para no recalcularlos.

    **🔧 Qué corregir para la entrega final**

    1. **Los nombres de los clusters no salen de los clusters.** El diccionario `NOMBRES_NEGOCIO_CLUSTER`
       (celda 22) trae 10 nombres escritos de antemano y se asignan por número. Su propia tabla muestra que
       no calzan:

        | Cluster | Nombre asignado | Lo que realmente contiene |
        |---|---|---|
        | 1 | Cargos duplicados y comisiones de mantención | **83 % Atención al cliente** (sucursal, llamada, nadie, hora) |
        | 2 | Estafas por phishing, enlaces falsos y robo de tarjeta | **86 % App y canales digitales** (app, error, acceso, bloqueo) |
        | 0 | Fallas técnicas en App móvil y transferencias | Mezcla de Cobro indebido (34 %), Fraude (24 %), Crédito (20 %) e Información (18 %) |

        Pongan el nombre **después** de leer los términos distintivos y los ejemplos centrales que ustedes
        mismos calcularon.
    2. **k = 3 no sirve para el negocio, aunque tenga la mayor silueta.** El cluster 0 junta el **59 % de los
       reclamos** y ahí quedan **cerca de 840 de los 934 fraudes**, mezclados con cobros, créditos y
       trámites. Para un equipo cuya prioridad es el fraude, ese mapa esconde justamente lo importante.
       Además:
        - la silueta casi no cambia entre k = 3 y k = 10 (0,21 a 0,24);
        - k = 3 está en el borde del rango probado y k = 2 no se evaluó.

        Prueben un k mayor (por ejemplo, 6 a 8) y elijan con silueta **más** interpretabilidad. Expliquen la
        decisión por escrito; la celda 23 hoy es genérica y no comenta sus clusters.
    3. **Búsqueda: dos comentarios contradicen sus resultados** (celda 19).
        - **Consulta 1:** dice que TF-IDF «falla por el typo», pero TF-IDF obtuvo **P@5 = 100 %** y
          embeddings 80 %.
        - **Consulta 3:** la consulta no contiene «app» ni «móvil». TF-IDF acierta por «intento» («cada vez
          que intento hacer una transferencia»).

        Además, P@5 por categoría es solo una aproximación. En la consulta 5, TF-IDF trae un texto idéntico a
        los demás que está etiquetado como Información y trámites: es un error de etiqueta, no del buscador.
        Definan un criterio de relevancia por consulta y juzguen cada resultado leyéndolo.
    4. **Curva, precisión de la conclusión** (celda 16).
        - Con 50 ejemplos, los embeddings ganan en paráfrasis por 0,500 vs. 0,474, con desviación de 0,081.
          Eso es un empate, no «supera en todos los tamaños».
        - El ejemplo «seguro automotriz que nunca contraté» **lo aciertan ambos métodos** en su tabla de
          detalle. «Usaron mi plástico» sí está bien elegido: TF-IDF lo manda a Información y trámites.
    5. **Clasificación, detalle menor:** que los embeddings ahorren «mucha memoria» no está medido. Una
       matriz TF-IDF dispersa de 3.000 columnas no ocupa 3.000 números por texto. Si lo afirman, muéstrenlo.

    **💡 Para pensar**

    Su regresión logística y su MLP sobre TF-IDF dan exactamente el mismo reporte (0,951), igual que en el
    Sprint 1, y los embeddings llegan a 0,948. Cuando modelos tan distintos coinciden, el techo suele estar
    en los datos: etiquetas dudosas o reclamos que mezclan dos temas. Revisar esos errores puede rendir más
    que otro modelo.

    **📌 Requisitos de entrega**

    - Sigue faltando el **enlace de Colab** en la primera celda (pedido en el Sprint 1).
    - La celda 1 está vacía; bórrenla.
    - Bien: ya incluyeron la celda **«Uso de IA»**.

??? note "🔒 Emanix · MercaSur — ver nota y retroalimentación"

    <p class="usm-nota"><strong>Nota Sprint 2: 92</strong> · 🟢 Verde</p>

    Entregado el domingo 15 de noviembre a las 23:32 (a tiempo).

    | Criterio | Peso | Nota |
    |---|:-:|:-:|
    | **Embeddings y clasificación**<br><small>Mismo test y misma métrica; verificación exhaustiva de particiones.</small> | 30 % | 95 |
    | **Curva con pocos datos**<br><small>Experimento impecable y conclusión honesta, con sus límites.</small> | 25 % | 98 |
    | **Búsqueda semántica**<br><small>Criterios de relevancia definidos antes de evaluar; varias consultas copian el vocabulario del corpus.</small> | 20 % | 88 |
    | **Temas descubiertos**<br><small>k muy bien analizado; faltan nombres accionables y separar elogios de quejas.</small> | 25 % | 85 |
    | **Nota final**<br><small>0,30 × 95 + 0,25 × 98 + 0,20 × 88 + 0,25 × 85 = 91,85</small> | | **92** |

    **✅ Lo que está bien**

    - **Continuidad verificada con el Sprint 1.** Antes de empezar comprueban con `assert` que textos,
      etiquetas y particiones coinciden y no se cruzan. También verifican que ninguna reseña supera los 128
      tokens del modelo.
    - **Comparación justa en el mismo test**, y reconocen que las dos regresiones usan distinto `C`.
    - **La curva con pocos datos es de nivel profesional**:
        - tres semillas por tamaño;
        - TF-IDF ajustado solo con cada submuestra;
        - 42 paráfrasis, con la comprobación de que ninguna aparece en el entrenamiento;
        - una conclusión clara: TF-IDF gana en el test del caso y los embeddings ganan por unos 20 puntos en
          paráfrasis, sin que la brecha se cierre con 1.000 ejemplos.

        Además advierten que tres muestras no prueban significancia.
    - **La búsqueda se evaluó con método.** Definen un criterio de relevancia por consulta **antes** de mirar
      los resultados y juzgan cada uno. Reportan sin maquillar que TF-IDF gana (0,68 vs. 0,60). El
      experimento de quitar «qué maravilla» muestra muy bien la debilidad de TF-IDF.
    - **El análisis de k es el más completo posible.** Notan que la silueta sube sin un máximo interior,
      comparan 8 y 12 grupos y descubren que los embeddings agrupan también **por producto** (yoga, belleza,
      tecnología) y **por estilo** (un grupo con 97 % de textos en mayúsculas). Ese hallazgo vale mucho.
    - **Atendieron la retroalimentación del Sprint 1:** la primera celda tiene integrantes, caso y enlace,
      hay celda de Uso de IA y agregaron una estimación de costos con sus supuestos explícitos.

    **🔧 Qué mejorar para la entrega final**

    1. **Nombres de temas que un equipo pueda usar.** «Segundas compras y experiencias variadas»,
       «Opiniones diversas redactadas en mayúsculas» o «Experiencias con mats de yoga» describen el grupo,
       pero no le dicen a nadie qué hacer. Dos ideas:
        - **El grupo de mayúsculas es un artefacto:** pasen los textos a minúsculas antes de calcular los
          embeddings y vean si desaparece.
        - **Varios temas mezclan elogios y quejas.** «Atención por chat y correo» junta «me resolvieron todo»
          con «nadie responde, solo bots». Para Atención no es lo mismo. Separen por tono, o al menos
          cuantifiquen cuánto hay de cada uno.
    2. **k = 12 está en el borde del rango probado**, con la silueta todavía subiendo. Ustedes ya lo
       reconocen. Si no van a probar más allá, elijan el k por utilidad para el negocio y díganlo así.
    3. **Consultas que pongan a prueba la semántica.** Q1 («me cobraron dos veces») y Q5 («nadie responde el
       chat») repiten frases textuales del corpus, así que es esperable que TF-IDF empate. Prueben
       redacciones con palabras que no aparecen en las reseñas, por ejemplo «me hicieron un doble cargo».
    4. **Q2 exige dos condiciones (atraso y falta de aviso).** Busquen en el catálogo si existe alguna reseña
       que las cumpla, por ejemplo con `str.contains("avis")`. Si no existe, el P@5 = 0 se debe a la
       consulta y no a los buscadores.

    **📌 Requisitos de entrega**

    - El título de la primera celda todavía dice «Sprint 1»; actualícenlo.
    - **La celda 162 empieza a mitad de frase** («alcanzando P@5 de 0,40»); falta el comienzo.
    - Los contadores de ejecución están desordenados: la celda 160 corrió antes que la 156. Antes de
      entregar, usen *Reiniciar y ejecutar todo*.

    **🔭 Para el Sprint 3**

    Entre los ejemplos aleatorios de sus clusters aparecen **RUT, teléfonos y correos**. Es justo lo que el
    Sprint 3 pide enmascarar antes de enviar textos a la API.
