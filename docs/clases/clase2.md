# Clase 2 · Embeddings: el significado como vector

<div class="usm-session-meta">
<span>📅 Jueves 5 de noviembre de 2026</span>
<span>⏱️ Tutoría 18:30 – 19:30 · cápsula de ~2,5 h de autoestudio</span>
<span class="usm-tag-gold">Se aplica en el Sprint 2 · domingo 15 de noviembre</span>
</div>

!!! example "Cómo estudiar esta cápsula"
    La cápsula tiene **6 temas**. Cada uno parte con una **pregunta guía**, explica la idea con un ejemplo del
    caso FinTrust y termina con **✍️ preguntas de selección múltiple** (si te equivocas, la alternativa te explica
    por qué no era).

    - **Simuladores** (🗺️ 📐 🔎): juega con ellos *antes* de leer la fórmula. Usan embeddings **reales**,
      calculados con el mismo modelo que usarás en Colab.
    - **🧪 Practica en Python**: presiona **▶ Ejecutar en el navegador**. La primera vez tarda ~15 s en cargar
      Python; después es inmediato. Puedes editar el código y cada bloque trae un **🎯 Reto**.
    - **🧑‍💻 Notebook de Colab**: al final está el notebook que calcula los embeddings de los ~6.000 textos de tu
      caso. Es la base de tu **Sprint 2**.

    **Para la tutoría del jueves 12 de noviembre (avance del Sprint 2) trae:** tus embeddings ya calculados (archivo
    `.npy`), las 5 consultas de negocio que vas a probar en tu buscador y una duda concreta sobre tus resultados.

## 🎯 Objetivos

Al terminar esta cápsula podrás:

- Explicar por qué un modelo basado en **palabras** (TF-IDF) no reconoce dos frases que dicen lo mismo con palabras distintas.
- Describir qué es un **embedding**: un vector denso donde **cercanía = significado**, y cómo se entrena (intuición).
- Calcular e interpretar la **similitud coseno** y explicar por qué se prefiere a la distancia euclidiana.
- Construir un **buscador semántico** (consulta → vector → top-k) y compararlo con uno por palabras.
- Usar embeddings como variables de un **clasificador** y saber **cuándo** convienen frente a TF-IDF (pocos datos, redacciones nuevas).
- **Descubrir temas** sin etiquetas con K-means sobre embeddings y ponerle nombre a cada grupo.

## 🗺️ Ruta de la cápsula

Haz clic en un tema para ir directo a él.

<ol class="econ-ruta">
<li><span class="econ-ruta-h">20 min</span><a class="econ-ruta-a" href="#tema-1"><span class="econ-ruta-n">1</span><span class="econ-ruta-t">El límite de TF-IDF</span><span class="econ-ruta-l">🧪 Python · ✍️ 2 preguntas</span></a></li>
<li><span class="econ-ruta-h">30 min</span><a class="econ-ruta-a" href="#tema-2"><span class="econ-ruta-n">2</span><span class="econ-ruta-t">Qué es un embedding</span><span class="econ-ruta-l">🗺️ mapa · 🧪 Python · ✍️ 2 preguntas</span></a></li>
<li><span class="econ-ruta-h">20 min</span><a class="econ-ruta-a" href="#tema-3"><span class="econ-ruta-n">3</span><span class="econ-ruta-t">Similitud coseno</span><span class="econ-ruta-l">📐 simulador · 🧪 Python · ✍️ 2 preguntas</span></a></li>
<li><span class="econ-ruta-h">25 min</span><a class="econ-ruta-a" href="#tema-4"><span class="econ-ruta-n">4</span><span class="econ-ruta-t">Búsqueda semántica</span><span class="econ-ruta-l">🔎 buscador · 🧪 Python · ✍️ 2 preguntas</span></a></li>
<li><span class="econ-ruta-h">30 min</span><a class="econ-ruta-a" href="#tema-5"><span class="econ-ruta-n">5</span><span class="econ-ruta-t">Clasificar con pocos datos</span><span class="econ-ruta-l">🧪 2 × Python · ✍️ 2 preguntas</span></a></li>
<li><span class="econ-ruta-h">25 min</span><a class="econ-ruta-a" href="#tema-6"><span class="econ-ruta-n">6</span><span class="econ-ruta-t">Descubrir temas sin etiquetas</span><span class="econ-ruta-l">🧪 2 × Python · ✍️ 2 preguntas</span></a></li>
<li class="is-break"><span class="econ-ruta-h">✅</span><span class="econ-ruta-t">Notebook de Colab, conexión con el Sprint 2 y resumen</span></li>
</ol>

## Tema 1 · El límite de TF-IDF {#tema-1}

> **Pregunta guía:** ¿por qué un modelo que lee palabras no se da cuenta de que «me clonaron la tarjeta» y
> «aparecen compras que yo no hice» son **el mismo problema**?

En la Clase 1 construiste un baseline con **TF-IDF + regresión logística** y te fue muy bien (F1 macro ≈ 0,93 en
FinTrust). Recordemos cómo "ve" un texto TF-IDF: como una **bolsa de palabras**. Cada palabra del vocabulario es
una columna; el texto tiene un número alto en las palabras que usa (y que son poco comunes en el resto) y **cero en
todas las demás**.

Eso tiene una consecuencia fuerte: **dos textos solo se parecen si comparten palabras**. Mira estos tres reclamos
de clientes de FinTrust:

| Reclamo | Palabras que usa | ¿Qué significa? |
|---|---|---|
| A · «Me clonaron la tarjeta» | me, clonaron, la, tarjeta | Fraude |
| B · «Aparecen compras que yo no hice» | aparecen, compras, que, yo, no, hice | Fraude |
| D · «Quiero cambiar la fecha de pago de mi tarjeta» | quiero, cambiar, la, fecha, pago, … tarjeta | Trámite |

Para un humano, A y B son el mismo caso (fraude) y D es otra cosa (un trámite). Para TF-IDF es al revés:
A y B **no comparten ninguna palabra** → similitud 0. A y D comparten «la» y «tarjeta» → se "parecen". (En el
código de abajo agregamos un tercer fraude, C, escrito con otras palabras).

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · TF-IDF no ve sinónimos</p>

Calculamos la similitud entre cuatro reclamos usando TF-IDF (la misma idea de la Clase 1). La tabla es una matriz:
cada celda dice cuánto se parecen dos frases (1 = idénticas, 0 = nada en común).

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

frases = {
    "A": "Me clonaron la tarjeta",                          # fraude
    "B": "Aparecen compras que yo no hice",                 # fraude, otras palabras
    "C": "Hay cargos que no reconozco en mi cuenta",        # fraude, otras palabras
    "D": "Quiero cambiar la fecha de pago de mi tarjeta",   # trámite, comparte "tarjeta" con A
}
tfidf = TfidfVectorizer()
X = tfidf.fit_transform(frases.values())
print("Vocabulario:", list(tfidf.get_feature_names_out()))

sim = cosine_similarity(X)          # similitud entre cada par de frases
pd.DataFrame(sim, index=frases.keys(), columns=frases.keys()).round(2)
```

**🎯 Reto:** agrega la frase `"E": "Unos delincuentes usaron mi plástico"` (fraude, en chileno). ¿Con qué frase se
parece más según TF-IDF? ¿Y por qué B y C sí tienen algo de similitud? (pista: mira qué palabras comparten).
{: .py-run-reto }

</div>

Lo que acabas de ver no es un defecto de tu código: es el **techo de cualquier método basado en contar palabras**.
B y C se parecen solo por «que» y «no», palabras que no dicen nada del problema. Y A y D se parecen por «la» y
«tarjeta», aunque uno es un fraude y el otro un trámite.

!!! tip "💼 En el negocio"
    Tus clientes no escriben como tus datos de entrenamiento. Llegan reclamos nuevos por WhatsApp o redes sociales
    con otras palabras («me hackearon», «me vaciaron la cuenta», «usaron mi plástico»), modismos chilenos y faltas
    de ortografía. Un modelo que solo reconoce palabras vistas antes **se degrada en silencio** cuando cambia la forma
    de escribir. Para enrutar reclamos o detectar fraude temprano necesitamos una representación del **significado**,
    no de las palabras.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 1</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Con TF-IDF, ¿cuál es la similitud entre «me clonaron la tarjeta» y «aparecen compras que yo no hice»?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="TF-IDF no sabe nada de significados: solo cuenta palabras. Si no comparten ninguna, la similitud no puede ser alta.">Alta, porque ambas describen un fraude.</button>
<button class="econ-quiz-opt" data-correct>Cero, porque no comparten ninguna palabra.</button>
<button class="econ-quiz-opt" data-why="La similitud coseno con TF-IDF nunca es negativa: todos los valores de TF-IDF son ≥ 0.">Negativa, porque hablan de cosas distintas.</button>
</div>
<p class="econ-quiz-fb">✅ Exacto. En TF-IDF cada palabra es una columna distinta y «clonaron» no tiene ninguna relación con «compras». Sin palabras en común, el producto punto es 0.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Tu clasificador TF-IDF tiene F1 = 0,93 en test. Tres meses después llegan reclamos por un nuevo canal (WhatsApp) con un lenguaje más informal. ¿Qué es lo más probable?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="El F1 de test solo vale para datos parecidos a los de entrenamiento. Si cambia el vocabulario, el modelo ve palabras que nunca aprendió.">El F1 se mantiene en 0,93, porque el modelo ya está validado.</button>
<button class="econ-quiz-opt" data-why="Al revés: el lenguaje informal trae palabras que el modelo no vio, y TF-IDF las ignora (no tienen columna).">El F1 sube, porque los textos informales son más cortos.</button>
<button class="econ-quiz-opt" data-correct>El rendimiento baja, porque aparecen palabras y expresiones que el modelo nunca vio.</button>
</div>
<p class="econ-quiz-fb">✅ Así es: TF-IDF solo conoce el vocabulario del entrenamiento. Este "cambio de distribución" es una de las razones de negocio para usar representaciones de significado.</p>
</div>
</div>

## Tema 2 · Qué es un embedding {#tema-2}

> **Pregunta guía:** ¿cómo se convierte una frase en una lista de números que "sabe" lo que significa?

### De columnas por palabra a coordenadas de significado

Piensa en cómo describes a un cliente en una base de datos: no guardas su nombre en mil columnas de "sí/no", sino
unas pocas variables con números (edad, ingreso, antigüedad…). Dos clientes con números parecidos son clientes
parecidos.

Un **embedding** hace lo mismo con un texto: lo describe con una lista corta de números **densos** (casi ninguno
es cero), de modo que **textos con significado parecido quedan cerca**. Es como un GPS de significados: cada frase
tiene sus coordenadas.

| | One-hot / TF-IDF | Embedding |
|---|---|---|
| Largo del vector | Tamaño del vocabulario (miles) | Fijo y chico (384 en nuestro modelo) |
| ¿Cuántos ceros? | Casi todos | Casi ninguno |
| «crédito» vs. «préstamo» | Columnas distintas, sin relación | Vectores cercanos (coseno 0,76 en nuestro modelo) |
| ¿Quién define los números? | Una regla (contar palabras) | Una red neuronal entrenada con millones de textos |

Un ejemplo de juguete con solo 3 dimensiones (inventadas para que se entienda; en un modelo real no tienen nombre):

| Texto | "dinero" | "tecnología" | "molestia" |
|---|---|---|---|
| me clonaron la tarjeta | 0,9 | 0,3 | 0,8 |
| aparecen compras que no hice | 0,8 | 0,2 | 0,7 |
| la app se cae | 0,1 | 0,9 | 0,6 |

Las dos primeras filas tienen números parecidos → están cerca → **significan algo parecido**, aunque no compartan
palabras. Eso es exactamente lo que TF-IDF no podía hacer.

### La famosa analogía: rey − hombre + mujer ≈ reina

En 2013, el modelo **word2vec** de Google mostró algo sorprendente: con vectores de palabras se puede "hacer
aritmética de significados". Si al vector de *rey* le restas *hombre* y le sumas *mujer*, el vector más cercano al
resultado es *reina*. Lo mismo con capitales: *París − Francia + Italia ≈ Roma*. Las **direcciones** del espacio capturan
relaciones (género, capital de, plural…). No siempre funciona perfecto, pero muestra que la geometría del espacio
tiene sentido.

### ¿Cómo aprende la red esos números? (intuición)

La idea central viene de la lingüística: **"dime con quién andas y te diré quién eres"**. Palabras que aparecen en
contextos parecidos significan cosas parecidas: «crédito» y «préstamo» aparecen junto a «cuotas», «tasa»,
«pagar»… así que terminan con vectores cercanos. La otra cara: el modelo solo conoce bien lo que vio a menudo. Un
chilenismo como «plástico» (por tarjeta) le resulta casi desconocido: su coseno con «tarjeta» es apenas 0,31.

1. **Embeddings de palabras (word2vec):** una red pequeña lee millones de oraciones y aprende a **predecir las
   palabras vecinas** de cada palabra. Para lograrlo, se ve obligada a darle vectores parecidos a palabras que se usan igual.
2. **Embeddings de frases (sentence-transformers):** se parte de un transformer (lo verás en la Clase 3) y se
   ajusta con **millones de pares de frases** que significan lo mismo (paráfrasis) y pares que no. El
   entrenamiento "acerca" las paráfrasis y "aleja" las que no tienen relación (aprendizaje contrastivo).

El modelo que usaremos, `paraphrase-multilingual-MiniLM-L12-v2`, partió de un modelo en inglés entrenado así y luego
se "destiló" a **más de 50 idiomas** (incluido el español): se le enseñó a poner una frase y su traducción en el
mismo punto del espacio. Recibe un texto y devuelve 384 números:

<div class="ia-flow">
<div class="ia-flow-step"><strong>1 · Texto</strong>«Me clonaron la tarjeta»</div>
<div class="ia-flow-step"><strong>2 · Tokens</strong>Me · clo · na · ron · la · tarjeta</div>
<div class="ia-flow-step"><strong>3 · Transformer</strong>12 capas que leen cada token en su contexto</div>
<div class="ia-flow-step"><strong>4 · Promedio</strong>un vector por texto (<em>mean pooling</em>)</div>
<div class="ia-flow-step is-on"><strong>5 · Embedding</strong>[−0,001; 0,049; −0,072; …] · 384 números</div>
</div>

Formalmente, el modelo es una función \( f: \text{texto} \rightarrow \mathbb{R}^{384} \). No hay magia: es una red
neuronal como las de la Clase 1, solo que **ya viene entrenada** (por otros, con muchísimos datos) y tú la usas
para transformar tus textos. Esto se llama **transfer learning**: reutilizas conocimiento aprendido en otra tarea.

<div class="ia-widget" data-widget="c2-mapa"></div>

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Mira un embedding por dentro</p>

Como en el navegador no podemos correr el modelo, calculamos antes los embeddings de **400 reclamos limpios de
FinTrust** (columnas `e0` … `e383`) con el mismo modelo que usarás en Colab, redondeados a 4 decimales.

```python
import pandas as pd
import numpy as np

df = pd.read_csv(DATA + "clase2_embeddings_muestra.csv")
E = df.filter(regex=r"^e\d+$").to_numpy()      # matriz de 400 filas x 384 columnas
print("Reclamos:", E.shape[0], "· números por reclamo:", E.shape[1])

i = 0
print("\nTexto:", df.texto[i])
print("Categoría:", df.categoria[i])
print("Primeros 8 números de su embedding:", E[i, :8].round(3))
print("¿Cuántos son exactamente cero?:", int((E[i] == 0).sum()), "de", E.shape[1])
print("Largo (norma) del vector:", np.linalg.norm(E[i]).round(3))
df[["id", "texto", "categoria"]].head()
```

**🎯 Reto:** cambia `i = 0` por otros números. ¿El largo del vector cambia? (Los guardamos **normalizados** a
largo 1; en el Tema 3 verás por qué eso es cómodo). ¿Puedes adivinar la categoría mirando los números? (Spoiler: no.)
{: .py-run-reto }

</div>

!!! warning "⚠️ Error común: buscarle significado a cada número"
    «La dimensión 17 debe ser "fraude"». No: las 384 dimensiones **no tienen nombre ni interpretación individual**;
    lo que tiene sentido es la **posición relativa** entre vectores (quién está cerca de quién). Otro error típico:
    comparar embeddings calculados con **modelos distintos**. Cada modelo arma su propio "mapa"; mezclar vectores de
    dos modelos es como comparar coordenadas de dos GPS con orígenes diferentes.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 2</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Cuál es la diferencia clave entre un vector TF-IDF y un embedding?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Es al revés: TF-IDF tiene una columna por palabra del vocabulario (miles) y el embedding tiene un largo fijo y chico (384).">El embedding es más largo porque guarda más palabras.</button>
<button class="econ-quiz-opt" data-correct>El embedding es denso y lo aprende una red, de modo que textos con significado parecido quedan cerca aunque usen palabras distintas.</button>
<button class="econ-quiz-opt" data-why="Ambos se pueden usar como variables en una regresión logística. La diferencia está en qué capturan, no en si sirven para clasificar.">El embedding solo sirve para buscar; TF-IDF sirve para clasificar.</button>
</div>
<p class="econ-quiz-fb">✅ Correcto. TF-IDF es disperso (casi todo ceros) y definido por una regla; el embedding es denso y aprendido. Por eso «crédito» y «préstamo» quedan cerca en el embedding.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">En el mapa 🗺️, un reclamo aparece lejos en el dibujo, pero el simulador dice que es el vecino n.º 2. ¿Cómo se explica?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Los vecinos se calcularon con el coseno en 384 dimensiones con el modelo real; no hay error en la tabla.">Es un error en los datos precalculados.</button>
<button class="econ-quiz-opt" data-why="La categoría no interviene en el cálculo de vecinos: el modelo nunca vio las etiquetas.">Los vecinos se eligen por categoría, no por distancia.</button>
<button class="econ-quiz-opt" data-correct>El mapa 2D es una "sombra" (PCA) de un espacio de 384 dimensiones: conserva solo parte de la información, y la cercanía real se mide en las 384.</button>
</div>
<p class="econ-quiz-fb">✅ Exacto. Proyectar 384 dimensiones en 2 es como fotografiar un objeto 3D: algunos puntos que están lejos parecen cerca y viceversa. El mapa sirve para explorar; las decisiones se toman con las 384 dimensiones.</p>
</div>
</div>

## Tema 3 · Similitud coseno {#tema-3}

> **Pregunta guía:** si cada texto es una flecha en el espacio, ¿cómo medimos **qué tan parecidos** son dos significados?

### Intuición: importa hacia dónde apunta la flecha

Imagina cada embedding como una flecha que sale del origen. Dos textos que significan lo mismo apuntan **en la
misma dirección**. La similitud coseno mide justamente eso: el **coseno del ángulo** entre las dos flechas.

- Ángulo 0° → coseno **1**: misma dirección (paráfrasis).
- Ángulo 90° → coseno **0**: sin relación.
- Ángulo 180° → coseno **−1**: direcciones opuestas (en embeddings de frases es raro; casi todo queda entre 0 y 1).

<div class="ia-widget" data-widget="c2-coseno"></div>

### La fórmula

$$
\cos(\theta) = \frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert}
= \frac{\sum_{i=1}^{384} a_i b_i}{\sqrt{\sum_i a_i^2}\,\sqrt{\sum_i b_i^2}}
$$

Arriba va el **producto punto** (multiplicar coordenada a coordenada y sumar); abajo, los **largos** de cada vector.
Al dividir por los largos, el resultado depende **solo del ángulo**.

Ejemplo a mano con dos vectores 2D: \( \mathbf{a} = (3, 1) \) y \( \mathbf{b} = (2, 2) \).
Producto punto: \( 3\cdot2 + 1\cdot2 = 8 \). Largos: \( \sqrt{10} \approx 3{,}16 \) y \( \sqrt{8} \approx 2{,}83 \).
Coseno: \( 8 / (3{,}16 \times 2{,}83) \approx 0{,}89 \) → apuntan casi igual.

### ¿Por qué no la distancia euclidiana?

La distancia euclidiana (la "regla" entre las dos puntas) también se fija en el **largo** de los vectores, y el
largo suele reflejar cosas que no son significado (por ejemplo, textos más largos o más repetitivos). Prueba en el
simulador el botón **"Igual dirección, distinto largo"**: coseno = 1, pero la distancia euclidiana es grande.

Un dato práctico: si **normalizas** los vectores a largo 1 (como hacemos con `normalize_embeddings=True`), el
coseno es simplemente el producto punto, y la distancia euclidiana ordena exactamente igual que el coseno
(\( \lVert\mathbf{a}-\mathbf{b}\rVert^2 = 2 - 2\cos\theta \)). Por eso en la práctica normalizamos y usamos `E @ E.T`.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · El coseno con numpy</p>

Calculamos el coseno "a mano" entre dos reclamos y luego el **coseno promedio entre categorías**: si los embeddings
capturan significado, los reclamos de una misma categoría deberían parecerse más entre sí (diagonal más oscura).

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

df = pd.read_csv(DATA + "clase2_embeddings_muestra.csv")
E = df.filter(regex=r"^e\d+$").to_numpy()

def coseno(a, b):
    return (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))

i, j = 3, 93          # dos reclamos de fraude escritos distinto
print("A:", df.texto[i])
print("B:", df.texto[j])
print(f"coseno(A, B) = {coseno(E[i], E[j]):.3f}")

# Todos contra todos: como los vectores tienen largo 1, el coseno es el producto punto
S = E @ E.T
np.fill_diagonal(S, np.nan)                     # no contamos a cada reclamo consigo mismo
cats = sorted(df.categoria.unique())
M = pd.DataFrame([[np.nanmean(S[np.ix_(df.categoria == a, df.categoria == b)]) for b in cats] for a in cats],
                 index=cats, columns=cats)

plt.figure(figsize=(6, 4.5))
plt.imshow(M, cmap="Blues")
plt.xticks(range(len(cats)), cats, rotation=40, ha="right"); plt.yticks(range(len(cats)), cats)
plt.colorbar(label="coseno promedio"); plt.title("¿Se parecen más los reclamos de la misma categoría?")
M.round(2)
```

**🎯 Reto:** cambia `j` por un reclamo de otra categoría (por ejemplo `j = 8`, de la app). ¿Cuánto baja el coseno?
En la matriz, ¿qué par de categorías distintas se parece más? ¿Tiene sentido para el negocio?
{: .py-run-reto }

</div>

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 3</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Dos embeddings tienen coseno 0,05. ¿Qué significa?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Opuestos sería un coseno cercano a −1. Un coseno cercano a 0 es "perpendicular": sin relación.">Que los textos dicen cosas opuestas.</button>
<button class="econ-quiz-opt" data-correct>Que los textos prácticamente no tienen relación de significado.</button>
<button class="econ-quiz-opt" data-why="El coseno no mide el largo del texto; justamente lo elimina al dividir por los largos de los vectores.">Que uno de los textos es mucho más largo que el otro.</button>
</div>
<p class="econ-quiz-fb">✅ Bien. Coseno ≈ 0 ↔ ángulo ≈ 90° ↔ sin relación. En embeddings de frases, pares sin relación suelen dar entre 0 y 0,3, y paráfrasis sobre 0,7.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Por qué se prefiere el coseno a la distancia euclidiana para comparar embeddings?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Con 384 dimensiones ambas se calculan en microsegundos; la razón no es la velocidad.">Porque es mucho más rápido de calcular.</button>
<button class="econ-quiz-opt" data-why="La distancia euclidiana también funciona en muchas dimensiones; el problema es que se deja influir por el largo del vector.">Porque la distancia euclidiana no se puede calcular en 384 dimensiones.</button>
<button class="econ-quiz-opt" data-correct>Porque mide solo la dirección (el significado) e ignora el largo del vector, que puede reflejar cosas como el largo del texto.</button>
</div>
<p class="econ-quiz-fb">✅ Correcto. Y si normalizas los vectores a largo 1, ambas ordenan igual: por eso en la práctica normalizamos y usamos el producto punto.</p>
</div>
</div>

## Tema 4 · Búsqueda semántica {#tema-4}

> **Pregunta guía:** ¿cómo encuentro "todos los reclamos de clientes víctimas de phishing" si **nadie** escribió la palabra *phishing*?

Un buscador semántico es la aplicación más directa de los embeddings, y funciona en dos momentos:

1. **Indexar (una sola vez):** calculas el embedding de todos tus reclamos y guardas la matriz (en Colab, con `np.save`).
2. **Buscar (cada consulta):** conviertes la consulta en vector **con el mismo modelo**, calculas el coseno contra
   todos los reclamos y te quedas con los **k más altos** (top-k).

<div class="ia-widget" data-widget="c2-buscador"></div>

Mira tres cosas en el buscador:

- **Cuando la consulta usa otras palabras** («phishing», «servicio telefónico», «pagar mi deuda antes de tiempo»),
  los embeddings encuentran los reclamos correctos y TF-IDF se agarra de palabras sueltas: vacías como «de», «con» o
  «el», o ambiguas como «deuda» (y trae reclamos que piden un «certificado de deuda»).
- **Cuando la palabra clave aparece tal cual** («estafa telefónica» → «creo que fue una **estafa**»), **TF-IDF gana**.
  Los embeddings no son infalibles: aquí confundieron "telefónica" con problemas del call center y de la app.
- Algunos resultados correctos traen una **etiqueta rara** (un reclamo de la app etiquetado "Crédito y tasas"): es
  el ~6 % de **ruido de etiquetas** del caso. Un buscador semántico es también una buena herramienta para
  encontrar esos errores.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Tu primer buscador top-k</p>

En el navegador no podemos convertir una consulta nueva en vector (eso requiere el modelo, y lo harás en Colab).
Pero sí podemos usar **un reclamo existente como consulta**: "muéstrame los 5 reclamos más parecidos a este".

```python
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

df = pd.read_csv(DATA + "clase2_embeddings_muestra.csv")
E = df.filter(regex=r"^e\d+$").to_numpy()
tfidf = TfidfVectorizer(sublinear_tf=True)
T = tfidf.fit_transform(df.texto)               # vectores TF-IDF (también de largo 1)

def buscar(i, k=5, metodo="embeddings"):
    """Devuelve los k reclamos más parecidos al reclamo i."""
    if metodo == "embeddings":
        sims = E @ E[i]                          # coseno con todos (vectores de largo 1)
    else:
        sims = (T @ T[i].T).toarray().ravel()    # coseno TF-IDF
    sims[i] = -1                                 # no devolver la misma consulta
    top = np.argsort(-sims)[:k]                  # índices de los k más parecidos
    return pd.DataFrame({"similitud": sims[top].round(3),
                         "categoria": df.categoria.values[top],
                         "texto": df.texto.values[top]})

consulta = 93     # un reclamo de phishing por SMS
print("CONSULTA:", df.texto[consulta], "→", df.categoria[consulta])
print("\nTop-5 por TF-IDF (categorías):", list(buscar(consulta, metodo="tfidf").categoria))
buscar(consulta)
```

**🎯 Reto:** prueba `consulta = 58` (renegociar por quedar sin trabajo) y luego `consulta = 0`, un reclamo escrito
**EN MAYÚSCULAS**. Muestra también la tabla completa de `buscar(consulta, metodo="tfidf")`. ¿Qué le pasa a los
embeddings con el texto en mayúsculas? (TF-IDF pasa todo a minúsculas antes de contar; el modelo de embeddings no.)
{: .py-run-reto }

</div>

Con un reclamo **del propio caso** como consulta, ambos métodos suelen coincidir: los clientes de FinTrust repiten
mucho las mismas frases, así que también comparten palabras. La diferencia grande aparece con consultas **escritas
con otras palabras**, como las del buscador 🔎 de arriba; eso lo harás con tus propias consultas en Colab.

!!! tip "💼 En el negocio"
    Usos reales de la búsqueda semántica en un banco o retail:

    - **Casos similares para el ejecutivo:** al abrir un reclamo, mostrar los 5 casos más parecidos ya resueltos (y cómo se resolvieron).
    - **Detección de campañas de fraude:** "busca todo lo parecido a este SMS falso" y dimensionar cuántos clientes afectó.
    - **Deduplicar tickets:** un mismo cliente que reclama por tres canales.
    - **Base del RAG (Clase 4):** el asistente que construirás en la entrega final busca primero los documentos más parecidos a la pregunta… con exactamente este mecanismo.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 4</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Indexaste 6.000 reclamos con el modelo A. Para la consulta del usuario, un compañero propone usar un modelo B "más moderno". ¿Qué pasa?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-correct>Los resultados no tienen sentido: consulta y documentos deben convertirse con el mismo modelo, porque cada modelo arma su propio espacio.</button>
<button class="econ-quiz-opt" data-why="No importa cuán bueno sea B: sus vectores viven en otro espacio (incluso pueden tener otro largo). Comparar vectores de A con vectores de B no mide significado.">Mejora la búsqueda, porque el modelo B entiende mejor la consulta.</button>
<button class="econ-quiz-opt" data-why="Aunque ambos tuvieran 384 dimensiones, la dimensión 1 de A no significa lo mismo que la dimensión 1 de B.">Funciona igual siempre que ambos modelos tengan 384 dimensiones.</button>
</div>
<p class="econ-quiz-fb">✅ Exacto. Si cambias de modelo, debes recalcular los embeddings de todo el corpus. Por eso conviene guardar qué modelo usaste junto al archivo <code>.npy</code>.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">En el buscador 🔎, para «estafa telefónica» TF-IDF encuentra 5 de 5 fraudes y los embeddings 0 de 5. ¿Qué conclusión es la más razonable?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Es un solo ejemplo en contra y varios a favor; además, la conclusión de negocio no es elegir uno "para siempre", sino entender cuándo falla cada uno.">Los embeddings no sirven; mejor quedarse con TF-IDF.</button>
<button class="econ-quiz-opt" data-why="El modelo no tiene un "error" que se pueda arreglar a mano: es su representación aprendida. Lo que sí puedes hacer es combinar métodos.">El modelo tiene un bug y hay que reportarlo.</button>
<button class="econ-quiz-opt" data-correct>Cada método falla en casos distintos: cuando la palabra clave aparece tal cual, TF-IDF es muy preciso. Por eso muchos sistemas combinan ambos (búsqueda híbrida).</button>
</div>
<p class="econ-quiz-fb">✅ Bien. Los buscadores profesionales suelen mezclar la similitud por palabras y por significado. Evalúa siempre con <strong>varias</strong> consultas, no con una.</p>
</div>
</div>

## Tema 5 · Clasificar con pocos datos {#tema-5}

> **Pregunta guía:** si solo tienes **50 reclamos etiquetados**, ¿te conviene TF-IDF o embeddings? ¿Y si tienes 4.000?

Hasta ahora usamos los embeddings para comparar textos. También sirven como **variables de entrada** de un
clasificador: en vez de darle a la regresión logística miles de columnas TF-IDF, le das las 384 columnas del
embedding. La diferencia de fondo:

- **TF-IDF + logística** aprende **todo desde tus datos**: si una palabra no apareció en tus ejemplos etiquetados, no existe.
- **Embeddings + logística** parte con el **conocimiento del modelo pre-entrenado** (que leyó millones de frases):
  «préstamo» ya está cerca de «crédito» aunque tus 50 ejemplos nunca digan «préstamo».

Por eso esperamos que los embeddings ayuden **cuando hay pocos datos etiquetados** y **cuando los clientes escriben
distinto** a como venían escribiendo. Pongámoslo a prueba con dos conjuntos de evaluación:

1. **Test del caso:** 150 reclamos de FinTrust que el modelo no vio (mismo estilo que el entrenamiento).
2. **Paráfrasis:** 36 reclamos que escribimos a mano **con otras palabras** (6 por categoría; p. ej. «me hackearon
   y sacaron plata sin mi permiso», «el dividendo de este mes vino más caro sin aviso»). Simulan clientes nuevos o
   un canal nuevo. Están en `clase2_parafrasis.csv`, con sus embeddings.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Embeddings vs. TF-IDF como variables</p>

Entrenamos dos regresiones logísticas con los mismos 250 reclamos y las evaluamos en los dos conjuntos. Métrica:
**F1 macro** (la misma del Sprint 1).

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import f1_score

df = pd.read_csv(DATA + "clase2_embeddings_muestra.csv")
pa = pd.read_csv(DATA + "clase2_parafrasis.csv")          # 36 reclamos escritos con otras palabras
E, Epa = df.filter(regex=r"^e\d+$").to_numpy(), pa.filter(regex=r"^e\d+$").to_numpy()
y, textos = df.categoria.to_numpy(), df.texto.to_numpy()
tr, te = train_test_split(np.arange(len(df)), test_size=150, stratify=y, random_state=0)

# A) Embeddings + regresión logística
m_emb = LogisticRegression(C=10, max_iter=1000).fit(E[tr], y[tr])
# B) TF-IDF + regresión logística (el baseline del Sprint 1). Ojo: TF-IDF se ajusta SOLO con train
tfidf = TfidfVectorizer(sublinear_tf=True)
m_tf = LogisticRegression(C=10, max_iter=1000).fit(tfidf.fit_transform(textos[tr]), y[tr])

f1 = lambda real, pred: round(f1_score(real, pred, average="macro"), 3)
tabla = pd.DataFrame({
    "Test del caso (150)": [f1(y[te], m_emb.predict(E[te])),
                            f1(y[te], m_tf.predict(tfidf.transform(textos[te])))],
    "Paráfrasis (36)":     [f1(pa.categoria, m_emb.predict(Epa)),
                            f1(pa.categoria, m_tf.predict(tfidf.transform(pa.texto)))],
}, index=["Embeddings + logística", "TF-IDF + logística"])
tabla
```

**🎯 Reto:** muestra las paráfrasis que TF-IDF clasifica mal:
`pa.assign(pred=m_tf.predict(tfidf.transform(pa.texto))).query("pred != categoria")[["texto", "categoria", "pred"]]`.
¿Qué palabras "nuevas" lo confundieron? Haz lo mismo con `m_emb` y `Epa`.
{: .py-run-reto }

</div>

Ahora la pregunta del Sprint 2: **¿cómo cambia esto con la cantidad de datos etiquetados?** Dibujemos una **curva de
aprendizaje**: entrenamos con 25, 50, 100 y 200 ejemplos (repitiendo con 3 sorteos distintos para no depender de la
suerte) y medimos el F1 en ambos conjuntos.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Curva de aprendizaje con pocos datos</p>

Todo corre en tu navegador en unos segundos. Fíjate en que el TF-IDF se ajusta **solo** con los n ejemplos de
entrenamiento: con 25 reclamos, su vocabulario es diminuto.

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import f1_score

df = pd.read_csv(DATA + "clase2_embeddings_muestra.csv")
pa = pd.read_csv(DATA + "clase2_parafrasis.csv")
E, Epa = df.filter(regex=r"^e\d+$").to_numpy(), pa.filter(regex=r"^e\d+$").to_numpy()
y, textos = df.categoria.to_numpy(), df.texto.to_numpy()
tr, te = train_test_split(np.arange(len(df)), test_size=150, stratify=y, random_state=0)
f1 = lambda real, pred: f1_score(real, pred, average="macro")

filas = []
for n in [25, 50, 100, 200]:
    for semilla in range(3):                                   # 3 sorteos por tamaño
        sub = np.random.default_rng(semilla).choice(tr, n, replace=False)
        m_emb = LogisticRegression(C=10, max_iter=500).fit(E[sub], y[sub])
        tfidf = TfidfVectorizer(sublinear_tf=True)
        m_tf = LogisticRegression(C=10, max_iter=500).fit(tfidf.fit_transform(textos[sub]), y[sub])
        filas.append({"n": n, "modelo": "Embeddings", "Test del caso": f1(y[te], m_emb.predict(E[te])),
                      "Paráfrasis": f1(pa.categoria, m_emb.predict(Epa))})
        filas.append({"n": n, "modelo": "TF-IDF", "Test del caso": f1(y[te], m_tf.predict(tfidf.transform(textos[te]))),
                      "Paráfrasis": f1(pa.categoria, m_tf.predict(tfidf.transform(pa.texto)))})

R = pd.DataFrame(filas).groupby(["n", "modelo"]).mean().unstack()
fig, ax = plt.subplots(1, 2, figsize=(9, 3.4), sharey=True)
for k, conjunto in enumerate(["Test del caso", "Paráfrasis"]):
    for modelo, estilo in [("Embeddings", "o-"), ("TF-IDF", "s--")]:
        ax[k].plot(R.index, R[(conjunto, modelo)], estilo, label=modelo)
    ax[k].set_title(conjunto); ax[k].set_xlabel("ejemplos etiquetados"); ax[k].set_xscale("log")
    ax[k].set_xticks(R.index, R.index); ax[k].grid(alpha=0.3)
ax[0].set_ylabel("F1 macro"); ax[0].legend()
R.round(2)
```

**🎯 Reto:** agrega `12` a la lista de tamaños (unos 2 ejemplos por categoría). ¿Quién gana con tan poquitos datos?
¿Desde cuántos ejemplos TF-IDF iguala o supera a los embeddings en el test del caso? ¿Y en las paráfrasis la
brecha se cierra en algún momento?
{: .py-run-reto }

</div>

### Lo que muestran los datos (y lo que no)

Repetimos el experimento con **todos** los textos limpios de cada caso (5 sorteos, test de 30 %), con el mismo
modelo. F1 macro, **embeddings / TF-IDF** (en el notebook tus números pueden variar ±0,03 según la limpieza y los sorteos):

| Ejemplos etiquetados | FinTrust · test del caso | FinTrust · paráfrasis | MercaSur · test del caso | MercaSur · paráfrasis |
|---|---|---|---|---|
| 25 | **0,61** / 0,60 | **0,50** / 0,29 | 0,41 / **0,46** | **0,35** / 0,24 |
| 50 | **0,79** / 0,76 | **0,62** / 0,42 | 0,54 / **0,62** | **0,55** / 0,35 |
| 200 | 0,88 / **0,92** | **0,75** / 0,61 | 0,73 / **0,79** | **0,72** / 0,52 |
| 1.000 | 0,92 / 0,93 | **0,73** / 0,57 | 0,83 / **0,86** | **0,79** / 0,59 |
| Todos (≈ 3.900) | 0,93 / 0,93 | **0,73** / 0,58 | 0,86 / 0,86 | **0,80** / 0,65 |

La lectura honesta:

- **Con textos del mismo estilo** que el entrenamiento, TF-IDF es un rival durísimo: con 25–50 ejemplos empatan
  en FinTrust (en MercaSur TF-IDF gana por 5–8 puntos), entre 100 y 1.000 ejemplos TF-IDF gana por un poco y con
  todos los datos **empatan**. Nuestros datos son muy repetitivos (los clientes usan frases parecidas), y eso
  favorece a TF-IDF.
- **Con redacciones nuevas** (paráfrasis), los embeddings ganan **en todos los tamaños**, casi siempre por 15 a 20
  puntos (entre 11 y 21). Esa es su verdadera ventaja: **generalizan el significado**, no memorizan palabras.
- Con **muy pocos** datos etiquetados (25–50), en el test del caso los embeddings empatan o quedan algo atrás, pero
  son mucho más robustos ante textos nuevos. Si etiquetar cuesta caro (un analista leyendo reclamos), eso es plata.

!!! warning "⚠️ Error común: «los embeddings siempre ganan»"
    No. Son una herramienta, no magia. Si tienes miles de ejemplos etiquetados del mismo estilo que los textos que
    vas a clasificar, TF-IDF + logística es barato, rápido, explicable y muy difícil de superar. Los embeddings
    brillan con **pocas etiquetas**, **vocabulario cambiante** y en tareas **sin entrenamiento** (búsqueda,
    agrupación). Otro error frecuente: ajustar el `TfidfVectorizer` con **todos** los textos (incluido el test)
    antes de separar; eso filtra información del test y infla el resultado.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 5</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Por qué un clasificador sobre embeddings puede funcionar bien con solo 50 ejemplos etiquetados?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="La regresión logística sobre 384 variables con 50 ejemplos es, si acaso, más propensa a sobreajustar; el truco no está en el clasificador.">Porque la regresión logística funciona mejor con pocas filas.</button>
<button class="econ-quiz-opt" data-correct>Porque el modelo de embeddings ya aprendió el significado del lenguaje con millones de textos; tus 50 ejemplos solo le enseñan dónde están las fronteras entre categorías.</button>
<button class="econ-quiz-opt" data-why="El modelo de embeddings nunca vio tus etiquetas: es un modelo genérico de paráfrasis, no un clasificador de reclamos bancarios.">Porque el modelo de embeddings ya fue entrenado con reclamos de FinTrust etiquetados.</button>
</div>
<p class="econ-quiz-fb">✅ Eso es transfer learning: el trabajo pesado (entender el lenguaje) ya está hecho, y tú solo entrenas la última capa con tus pocos datos.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">MercaSur tiene 4.000 reseñas etiquetadas y en el test del caso TF-IDF y embeddings empatan (F1 0,86). El gerente pregunta cuál usar. ¿Qué dato adicional es el más útil para decidir?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="La cantidad de dimensiones no es un criterio de negocio; lo que importa es cómo se comporta cada modelo con los textos que vendrán.">Cuál de los dos modelos tiene más dimensiones.</button>
<button class="econ-quiz-opt" data-why="La fecha de publicación no dice nada sobre el rendimiento en tus datos.">Cuál de los dos métodos es más reciente.</button>
<button class="econ-quiz-opt" data-correct>Cómo rinde cada uno con textos escritos distinto (nuevos canales, otras palabras), además del costo y la facilidad de explicarlo.</button>
</div>
<p class="econ-quiz-fb">✅ Correcto. Con empate en el test, la robustez ante textos nuevos (paráfrasis: 0,80 vs. 0,65) y el costo/latencia deciden. Esa es la tabla comparativa que construirás en el Sprint 3 y la entrega final.</p>
</div>
</div>

## Tema 6 · Descubrir temas sin etiquetas {#tema-6}

> **Pregunta guía:** si mañana llegan 10.000 reclamos **sin etiquetar**, ¿cómo sabes de qué se están quejando los clientes?

Hasta ahora usamos etiquetas (categoría). Pero muchas veces no las hay, o las categorías que existen ya no
describen lo que está pasando (por ejemplo, aparece una **nueva campaña de phishing** que nadie ha etiquetado). Como
en el espacio de embeddings los textos parecidos quedan cerca, podemos buscar **grupos** (clusters) de puntos cercanos.

### K-means en 4 pasos

1. Elige cuántos grupos quieres: **k**.
2. Pon k "centros" al azar en el espacio.
3. Asigna cada reclamo al centro más cercano (K-means usa distancia euclidiana; como nuestros vectores tienen
   largo 1, eso equivale casi a agrupar por coseno, como viste en el Tema 3).
4. Mueve cada centro al **promedio** de sus reclamos y repite los pasos 3 y 4 hasta que nada cambie.

**¿Cómo elegir k?** Una ayuda es el **coeficiente de silueta** (*silhouette*): para cada punto compara qué tan
cerca está de su propio grupo vs. del grupo vecino. Va de −1 a 1; más alto = grupos más compactos y separados. En
texto real la silueta suele ser **baja y plana** (0,1–0,3), así que úsala como guía y decide k también por
**interpretabilidad**: ¿puedes ponerle nombre a cada grupo? ¿le sirve al negocio?

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · ¿Cuántos temas hay? (silueta)</p>

Ojo: aquí **no usamos la columna `categoria`** para agrupar. Solo los embeddings.

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

df = pd.read_csv(DATA + "clase2_embeddings_muestra.csv")
E = df.filter(regex=r"^e\d+$").to_numpy()

ks, sil = range(2, 9), []
for k in ks:
    km = KMeans(n_clusters=k, n_init=3, random_state=0).fit(E)
    sil.append(silhouette_score(E, km.labels_, metric="cosine"))
    print(f"k = {k}: silueta = {sil[-1]:.3f}")

plt.figure(figsize=(5, 3))
plt.plot(list(ks), sil, "o-"); plt.xlabel("k (número de grupos)"); plt.ylabel("silueta (coseno)")
plt.title("La silueta en texto suele ser baja y plana"); plt.grid(alpha=0.3)
```

**🎯 Reto:** cambia `n_init=3` por `n_init=10`. ¿Cambia la conclusión? Luego piensa: si la silueta casi no
cambia entre k = 4 y k = 8, ¿qué criterio de negocio usarías para elegir?
{: .py-run-reto }

</div>

### Ponerle nombre a cada grupo

Un cluster es solo un número (0, 1, 2…). Para que sirva al negocio hay que **nombrarlo**. Una receta simple: mira
las **palabras más frecuentes** de cada grupo (sacando palabras vacías como «de», «la», «hola») y lee 3–4 ejemplos.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · K-means + nombres de cada tema</p>

Agrupamos en `K = 6` y comparamos los grupos con las categorías **solo al final**, para ver si los temas que
"descubrió" el algoritmo se parecen a los que definió el banco.

```python
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import CountVectorizer

df = pd.read_csv(DATA + "clase2_embeddings_muestra.csv")
E = df.filter(regex=r"^e\d+$").to_numpy()
K = 6                                           # número de grupos
cluster = KMeans(n_clusters=K, n_init=5, random_state=0).fit_predict(E)

# Palabras vacías y frases de cortesía que no dicen nada del tema
VACIAS = """a al algo como cómo con de del el en es esta este fue ha hace hay he hola la las le lo los me mi mis
muy más no nos o para pero por que qué se si sin su sus un una y ya yo buenas buenos días tardes estimados señores
fintrust saludos atento quedo espero pronta respuesta necesito ayuda urgente escribo segunda vez dejar reclamo
formal muchas gracias antemano ojalá ayuden esto vergüenza voy ir sernac solucionan cambio banco""".split()
cv = CountVectorizer(stop_words=VACIAS, token_pattern=r"(?u)\b[a-záéíóúñ]{3,}\b")
X = cv.fit_transform(df.texto.str.lower())
vocab = np.array(cv.get_feature_names_out())

for c in range(K):
    en_c = cluster == c
    top = vocab[np.asarray(X[en_c].sum(axis=0)).ravel().argsort()[::-1][:5]]
    print(f"Grupo {c} ({en_c.sum()} reclamos): {', '.join(top)}")
    print("   ej.:", df.texto[en_c].iloc[0][:90])

# Solo ahora miramos las etiquetas: ¿qué categorías cayeron en cada grupo?
pd.crosstab(cluster, df.categoria, rownames=["grupo"])
```

**🎯 Reto:** ponle un nombre de negocio a cada grupo (p. ej. "Problemas con la app al transferir"). ¿Hay algún
grupo que mezcle dos categorías del banco? Prueba con `K = 8`: ¿aparecen subtemas útiles? (Por ejemplo, ¿se separa
la atención en "nadie me contacta" y "me derivan de un área a otra"?)
{: .py-run-reto }

</div>

¿Notaste un grupo pequeño y raro, con palabras que no tienen que ver entre sí? Mira sus ejemplos: casi todos están
escritos **EN MAYÚSCULAS**. El modelo no solo captura el tema; también captura el **estilo** del texto.

!!! warning "⚠️ Error común: creer que el embedding solo mira el tema"
    El vector resume **todo** el texto: tema, pero también mayúsculas, saludos («Señores FinTrust:»), firmas y
    frases de cortesía. Por eso un grupo puede juntar "los que gritan" en vez de "los que tienen el mismo problema".
    Antes de interpretar clusters (o de confiar en un buscador), revisa ejemplos y considera **normalizar** el texto
    (por ejemplo, pasar a minúsculas los reclamos escritos completamente en mayúsculas). En el notebook lo pruebas.

!!! tip "💼 En el negocio · temas emergentes"
    El uso más valioso del clustering no es repetir las categorías que ya tienes, sino **detectar lo nuevo**.
    Agrupa los reclamos de cada mes y compara: si aparece un grupo que antes no existía (por ejemplo, "SMS falsos
    que suplantan al banco") o uno crece mucho, es una alerta temprana para riesgo, operaciones o marketing. En
    nuestros datos, el grupo que mezcla **fraude** y **cobro indebido** es una pista de negocio real: para el cliente
    ambos son "plata que salió sin que yo quisiera", y quizás ambos merecen el mismo primer paso de atención.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 6</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Ejecutaste K-means con k = 6 sobre los embeddings. ¿Qué es el "grupo 3"?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="K-means no usa las etiquetas; el número de grupo es arbitrario y no corresponde a ninguna categoría del banco.">La categoría n.º 3 del banco (Crédito y tasas).</button>
<button class="econ-quiz-opt" data-correct>Un conjunto de reclamos cercanos entre sí en el espacio de significados, sin nombre: hay que interpretarlo leyendo sus palabras y ejemplos.</button>
<button class="econ-quiz-opt" data-why="K-means no ordena los grupos por urgencia ni por tamaño; la numeración depende de la inicialización.">El tercer grupo más urgente.</button>
</div>
<p class="econ-quiz-fb">✅ Correcto. El algoritmo entrega grupos; ponerles nombre (y decidir si sirven) es trabajo del analista. Ese "nombre de cada cluster" es parte del Sprint 2.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">La silueta da 0,25 para k = 4 y 0,23 para k = 6. Las categorías del banco son 6. ¿Qué haces?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Una diferencia de 0,02 en silueta es ruido en texto; elegir solo por ese número ignora si los grupos se pueden interpretar y usar.">Elijo k = 4 sí o sí, porque tiene la silueta más alta.</button>
<button class="econ-quiz-opt" data-why="No hay garantía de que los grupos coincidan con las categorías; además, el objetivo del clustering es descubrir, no copiar las etiquetas.">Elijo k = 6 porque así los grupos serán idénticos a las categorías.</button>
<button class="econ-quiz-opt" data-correct>Como la diferencia es mínima, comparo ambas opciones leyendo los grupos y elijo la que tenga temas más claros y útiles para el negocio.</button>
</div>
<p class="econ-quiz-fb">✅ Bien. La silueta es una guía; con valores tan parecidos, decide la interpretabilidad. Justifícalo en tu informe con ejemplos de cada grupo.</p>
</div>
</div>

## 🧑‍💻 Notebook de Colab

En el navegador usamos embeddings precalculados de 400 reclamos. En Colab vas a **calcularlos tú** para los ~6.000
textos de tu caso con `sentence-transformers`, y armar las piezas del Sprint 2.

<div class="ia-colab" markdown>
<p>🧑‍💻 <strong>Notebook de la clase:</strong> instala <code>sentence-transformers</code>, limpia el caso (FinTrust o
MercaSur), calcula los embeddings de todo el dataset (menos de 1 min con GPU; unos minutos sin GPU), arma un buscador
semántico reutilizable, compara embeddings vs. TF-IDF (F1 macro, curva con 50/200/1.000 ejemplos y prueba de
paráfrasis), dibuja el mapa 2D y descubre temas con K-means. Guarda los embeddings con <code>np.save</code> para
reutilizarlos en la Clase 4 (RAG). Tiempo total: ~45 min.</p>
<a class="ia-colab-btn" href="https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/clase2_embeddings.ipynb" target="_blank" rel="noopener">▶ Abrir en Colab</a>
</div>

!!! info "Antes de ejecutar"
    En Colab ve a **Entorno de ejecución → Cambiar tipo de entorno de ejecución → GPU (T4)**. No es obligatorio,
    pero los embeddings se calculan ~5 veces más rápido. Este notebook **no usa** la API de Gemini.

## 🔗 Conexión con tu proyecto (Sprint 2)

El **Sprint 2** (10 %) se entrega como notebook `.ipynb` por [buzón](../proyecto/buzon.md) hasta el **domingo 15 de
noviembre a las 23:59** (el buzón acepta hasta dos días de atraso, con −1,0 punto por día). Usa el notebook como punto
de partida y adapta todo a **tu pregunta de negocio** del Sprint 1. Checklist de lo que debe incluir:

- [ ] **Embeddings** de todos los textos limpios de tu caso con `sentence-transformers` (indica el modelo y el tiempo de cálculo) y guardados con `np.save`.
- [ ] **Clasificador sobre embeddings** (regresión logística) comparado con tus baselines del Sprint 1 (TF-IDF + logística y MLP) en el **mismo test**, con F1 macro y matriz de confusión.
- [ ] **Curva con pocos datos**: F1 macro de embeddings vs. TF-IDF entrenando con **50, 200 y 1.000** ejemplos (idealmente promediando varios sorteos), evaluada en tu test **y** en textos redactados con otras palabras (**paráfrasis**), con lo que eso significa para una empresa con pocas etiquetas o clientes que escriben distinto.
- [ ] **Buscador semántico**: una función `buscar(consulta, k)` y **5 consultas de negocio** propias; muestra el top-5 de cada una, comenta cuántos resultados son relevantes y compara con TF-IDF en al menos una (¿encontró lo que TF-IDF no?).
- [ ] **Mapa de temas**: K-means sobre embeddings, justificación de k (silueta + interpretación), **nombre de cada cluster** con sus palabras frecuentes y 2–3 ejemplos.
- [ ] Un párrafo de **conclusión de negocio**: ¿cuándo recomendarías embeddings y cuándo TF-IDF para tu caso? Usa tus números.

## 🧠 Resumen

| Concepto | Idea en una línea |
|---|---|
| Límite de TF-IDF | Solo compara palabras: sinónimos y paráfrasis dan similitud 0. |
| Embedding | Vector denso (384 números) donde la cercanía representa significado. |
| Cómo se entrena | "Dime con quién andas": contextos parecidos → vectores parecidos; paráfrasis se acercan (contrastivo). |
| Transfer learning | Reutilizas un modelo entrenado con millones de textos; tú solo ajustas lo último. |
| Similitud coseno | Coseno del ángulo: 1 = mismo sentido, 0 = sin relación; ignora el largo del vector. |
| Normalizar | Con vectores de largo 1, coseno = producto punto y euclidiana ordena igual. |
| Búsqueda semántica | Indexar una vez, convertir la consulta con el **mismo** modelo, top-k por coseno. |
| Embeddings para clasificar | Competitivos con pocos datos y mucho más robustos ante redacciones nuevas; con miles de datos del mismo estilo, empatan con TF-IDF. |
| K-means + silueta | Agrupa sin etiquetas; elige k con silueta **y** con interpretabilidad. |
| Nombrar clusters | Palabras más frecuentes + ejemplos; el valor está en detectar temas nuevos. |

## 📚 Para profundizar

- Google · *Machine Learning Crash Course: Embeddings* — explicación visual de embeddings y espacios vectoriales:
  <https://developers.google.com/machine-learning/crash-course/embeddings>
- Jay Alammar · *The Illustrated Word2vec* — cómo se entrenan los vectores de palabras, con dibujos:
  <https://jalammar.github.io/illustrated-word2vec/>
- Documentación de **Sentence Transformers** (SBERT): búsqueda semántica, clustering y modelos disponibles:
  <https://www.sbert.net/>
- Ficha del modelo que usamos (idiomas, entrenamiento, uso):
  <https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2>
