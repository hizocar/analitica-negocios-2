# Clase 1 · Redes neuronales en la práctica

<div class="usm-session-meta">
<span>📅 Jueves 29 de octubre de 2026 · Kickoff</span>
<span>⏱️ Tutoría 18:30 – 19:30 · cápsula de ~2,5 h de autoestudio</span>
<span class="usm-tag-gold">Se aplica en el Sprint 1 · domingo 8 de noviembre</span>
</div>

!!! example "Cómo estudiar esta cápsula"
    Esta página **enseña sola**: no hay cátedra. Avanza tema por tema, en orden. Cada tema parte con una
    **pregunta guía**, explica la idea con un ejemplo de negocio y luego te deja **jugar**:

    - **🧠 Simuladores:** mueve los deslizadores y presiona los botones. No hay forma de romperlos; la idea es que
      *predigas* qué va a pasar antes de tocar y luego compruebes.
    - **🧪 Python en el navegador:** cada bloque tiene un botón **▶ Ejecutar en el navegador**. La primera vez tarda
      unos 15 segundos en cargar Python; después es inmediato. Puedes editar el código y cada bloque trae un **🎯 Reto**.
    - **✍️ Practica:** preguntas de selección múltiple. Si te equivocas, la alternativa te explica por qué no es.
    - **🧑‍💻 Notebook de Colab:** al final está el notebook que aplica todo a los datos completos de tu caso, con
      una red neuronal en **Keras**. Es la base de tu **Sprint 1**.

    **Para la tutoría del jueves 29 (kickoff):** llega con tu equipo armado (2–3 personas) o con la intención de
    armarlo ahí, y con una idea de qué caso prefieren: **FinTrust** (reclamos de un banco) o **MercaSur** (reseñas
    de un retail). Si alcanzas a leer el Tema 5 antes, mejor: es lo primero que harás con los datos.

## 🎯 Objetivos

Al terminar esta cápsula podrás:

- Explicar qué hace **una neurona** (suma ponderada + activación) y por qué la regresión logística del curso I
  ya era una red neuronal de una sola neurona.
- Explicar por qué apilar **capas ocultas** permite fronteras de decisión no lineales.
- Describir cómo **aprende** una red: función de pérdida (entropía cruzada), descenso de gradiente, tasa de
  aprendizaje, épocas y batches.
- Reconocer el **sobreajuste** en las curvas de entrenamiento y validación y controlarlo con **early stopping** y
  **dropout**.
- Convertir **texto en números** con bolsa de palabras y **TF-IDF**, después de limpiar los datos.
- Comparar una regresión logística con una red neuronal usando **F1 macro** y leer la **matriz de confusión con
  ojos de negocio**.

## 🗺️ Ruta de la cápsula

Haz clic en un tema para ir directo a él.

<ol class="econ-ruta">
<li><span class="econ-ruta-h">20 min</span><a class="econ-ruta-a" href="#tema-1"><span class="econ-ruta-n">1</span><span class="econ-ruta-t">De la regresión logística a la neurona</span><span class="econ-ruta-l">🧠 simulador · 🧪 Python · ✍️ 2 preguntas</span></a></li>
<li><span class="econ-ruta-h">25 min</span><a class="econ-ruta-a" href="#tema-2"><span class="econ-ruta-n">2</span><span class="econ-ruta-t">Redes multicapa: fronteras no lineales</span><span class="econ-ruta-l">🧠 simulador · 🧪 Python · ✍️ 2 preguntas</span></a></li>
<li><span class="econ-ruta-h">25 min</span><a class="econ-ruta-a" href="#tema-3"><span class="econ-ruta-n">3</span><span class="econ-ruta-t">Cómo aprende una red</span><span class="econ-ruta-l">🧠 simulador · 🧪 Python · ✍️ 3 preguntas</span></a></li>
<li><span class="econ-ruta-h">20 min</span><a class="econ-ruta-a" href="#tema-4"><span class="econ-ruta-n">4</span><span class="econ-ruta-t">Sobreajuste y cómo evitarlo</span><span class="econ-ruta-l">🧠 simulador · 🧪 Python · ✍️ 2 preguntas</span></a></li>
<li class="is-break"><span class="econ-ruta-h">☕</span><span class="econ-ruta-t">Pausa: estírate antes de abrir los datos</span></li>
<li><span class="econ-ruta-h">40 min</span><a class="econ-ruta-a" href="#tema-5"><span class="econ-ruta-n">5</span><span class="econ-ruta-t">El texto también es un dato</span><span class="econ-ruta-l">🧪 4 bloques de Python · ✍️ 3 preguntas</span></a></li>
<li><span class="econ-ruta-h">15 min</span><a class="econ-ruta-a" href="#tema-6"><span class="econ-ruta-n">6</span><span class="econ-ruta-t">La matriz de confusión con ojos de negocio</span><span class="econ-ruta-l">🧠 simulador · 🧪 Python · ✍️ 2 preguntas</span></a></li>
<li class="is-break"><span class="econ-ruta-h">✅</span><span class="econ-ruta-t">Notebook de Colab, conexión con el Sprint 1 y resumen</span></li>
</ol>

---

## Tema 1 · De la regresión logística a la neurona {#tema-1}

> **Pregunta guía:** si ya sabes regresión logística, ¿cuánto te falta para entender una red neuronal?

**Menos de lo que crees.** Piensa en el equipo de servicio al cliente de **FinTrust**, que recibe cientos de
reclamos al día. Una ejecutiva con experiencia decide en segundos si un reclamo es **urgente**: mira si trae
palabras de alarma ("no reconozco", "fraude", "urgente") y cuánta plata está en juego. Sin darse cuenta, está
**ponderando** señales: a algunas les da mucha importancia, a otras poca, y si la suma pasa cierto nivel, lo marca
como urgente.

Eso es exactamente una **neurona artificial**. Hace dos cosas:

1. **Suma ponderada:** multiplica cada entrada por un **peso** (cuánto importa) y suma un **sesgo** (qué tan exigente
   es la neurona):
   $$ z = w_1 x_1 + w_2 x_2 + b $$
2. **Activación:** pasa \( z \) por una función \( f \) que decide qué tan fuerte "se enciende":
   $$ a = f(z) $$

Si la activación es la **sigmoide** \( \sigma(z) = \frac{1}{1+e^{-z}} \), la salida queda entre 0 y 1 y se lee
como probabilidad. ¿Te suena? **Es la regresión logística del curso I**, con otro nombre: los "coeficientes" ahora
se llaman *pesos* y el "intercepto" se llama *sesgo*.

| Activación | Fórmula | Rango | Dónde se usa |
|---|---|---|---|
| Sigmoide | \( \frac{1}{1+e^{-z}} \) | 0 a 1 | Salida de un clasificador binario (probabilidad) |
| tanh | \( \tanh(z) \) | −1 a 1 | Capas ocultas (centrada en cero) |
| ReLU | \( \max(0, z) \) | 0 a ∞ | Capas ocultas: la más usada hoy, simple y rápida |
| Softmax | \( \frac{e^{z_k}}{\sum_j e^{z_j}} \) | 0 a 1, suman 1 | Salida de un clasificador con **varias** clases (p. ej. 6 categorías de reclamo) |

<div class="ia-widget" data-widget="c1-neurona"></div>

!!! tip "💼 En el negocio"
    Los pesos son **interpretables** en una sola neurona: un peso positivo y grande para "palabras de alarma"
    dice que esa señal empuja fuerte hacia "urgente". Esa transparencia se pierde cuando apilamos muchas neuronas,
    y por eso en banca (regulada) la regresión logística sigue viva: a veces **explicar** la decisión vale más que
    ganar dos puntos de F1.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Una neurona a mano</p>

Tres reclamos descritos con dos números. La neurona calcula \( z \), aplica la sigmoide y decide.

```python
import numpy as np

# Cada reclamo se describe con dos números:
#   x1 = cantidad de palabras de alarma ("urgente", "fraude", "no reconozco"...)
#   x2 = monto reclamado, en millones de pesos
reclamos = {
    "Me cobraron dos veces la cuota":        [1, 0.08],
    "NO RECONOZCO compras, urgente, fraude": [3, 0.85],
    "¿Cómo cambio la clave de la app?":      [0, 0.00],
}

w = np.array([1.2, 2.0])   # pesos: cuánto importa cada entrada
b = -3.0                   # sesgo: qué tan exigente es la neurona

def sigmoide(z):
    return 1 / (1 + np.exp(-z))

for texto, x in reclamos.items():
    z = np.dot(w, x) + b          # 1) suma ponderada
    p = sigmoide(z)               # 2) activación
    etiqueta = "URGENTE" if p >= 0.5 else "normal"
    print(f"{texto:40s} z = {z:5.2f}  ->  p = {p:.2f}  ({etiqueta})")
```

**🎯 Reto:** cambia el sesgo a `b = -1.0`. ¿Qué reclamo cambia de etiqueta? ¿Te parece razonable para el negocio
marcar un cobro duplicado como urgente?
{: .py-run-reto }

</div>

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 1</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Una neurona con activación sigmoide y una sola capa, entrenada para predecir si un reclamo es urgente, es equivalente a…</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Un árbol parte el espacio con cortes del tipo “x₁ > 2”; la neurona hace una suma ponderada continua.">Un árbol de decisión de profundidad 1.</button>
<button class="econ-quiz-opt" data-correct>Una regresión logística.</button>
<button class="econ-quiz-opt" data-why="La regresión lineal no acota la salida entre 0 y 1; la sigmoide sí, y por eso la salida se lee como probabilidad.">Una regresión lineal.</button>
</div>
<p class="econ-quiz-fb">✅ Suma ponderada + sigmoide = regresión logística. Los pesos son los coeficientes y el sesgo es el intercepto. Las redes “de verdad” aparecen al apilar muchas de estas neuronas.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Tienes que clasificar reclamos en 6 categorías (Fraude, Cobro indebido, …). ¿Qué activación usas en la capa de salida?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="ReLU no está acotada ni suma 1: no entrega probabilidades. Se usa en capas ocultas.">ReLU</button>
<button class="econ-quiz-opt" data-why="Una sigmoide por clase daría 6 probabilidades que no suman 1; sirve si un reclamo pudiera tener varias categorías a la vez (multietiqueta), no es nuestro caso.">Sigmoide</button>
<button class="econ-quiz-opt" data-correct>Softmax</button>
</div>
<p class="econ-quiz-fb">✅ Softmax convierte 6 puntajes en 6 probabilidades que suman 1, y la red elige la categoría con mayor probabilidad. Es lo que usarás en Keras en el notebook.</p>
</div>
</div>

---

## Tema 2 · Redes multicapa: fronteras no lineales {#tema-2}

> **Pregunta guía:** si una neurona ya es una regresión logística, ¿para qué queremos muchas?

Una neurona sola traza una **frontera recta**: a un lado "sí", al otro "no". El problema es que muchos patrones
de negocio **no se separan con una recta**:

- Clientes que se van de MercaSur: los que compran **muy poco** (no enganchan) *y* los que compran **muchísimo**
  (revendedores que encontraron un mejor precio). Los del medio se quedan. Eso es un **anillo**, no una recta.
- Reclamos urgentes en FinTrust: "monto alto **y** cliente nuevo" o "monto bajo **y** muchas palabras de alarma".
  Es un "o exclusivo" (**XOR**): ninguna recta lo separa.

La solución es poner **capas ocultas** entre la entrada y la salida. Cada neurona oculta traza **su propia recta**;
la neurona de salida **combina** esas rectas y puede formar curvas, bandas o regiones cerradas. Eso es una
**red multicapa** o **MLP** (*multilayer perceptron*).

$$ \text{entrada } x \;\longrightarrow\; \underbrace{h = f(W_1 x + b_1)}_{\text{capa oculta}} \;\longrightarrow\; \underbrace{\hat{y} = \sigma(W_2 h + b_2)}_{\text{capa de salida}} $$

<div class="ia-widget" data-widget="c1-frontera"></div>

!!! info "La activación es lo que hace la magia"
    Si las capas ocultas **no** tuvieran activación (o fuera lineal), apilar capas no serviría de nada: una
    combinación lineal de combinaciones lineales sigue siendo lineal, y la red entera volvería a ser una recta.
    La no linealidad (ReLU, tanh) es lo que permite "doblar" la frontera.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Logística vs. red con capa oculta</p>

Clientes "promedio" en el centro y clientes "extremos" en un anillo. Entrenamos los dos modelos y dibujamos sus fronteras.

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_circles
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier

# 400 clientes: centro = se quedan (0), anillo = se van (1)
X, y = make_circles(n_samples=400, noise=0.12, factor=0.45, random_state=1)

modelos = {
    "Regresión logística (1 neurona)": LogisticRegression(),
    "Red con 8 neuronas ocultas": MLPClassifier(hidden_layer_sizes=(8,), activation="tanh",
                                                solver="lbfgs", max_iter=2000, random_state=1),
}

# Grilla para pintar la frontera de decisión
xx, yy = np.meshgrid(np.linspace(-1.6, 1.6, 150), np.linspace(-1.6, 1.6, 150))
grilla = np.c_[xx.ravel(), yy.ravel()]

fig, axes = plt.subplots(1, 2, figsize=(9, 4))
for ax, (nombre, modelo) in zip(axes, modelos.items()):
    modelo.fit(X, y)
    exactitud = modelo.score(X, y)
    prob = modelo.predict_proba(grilla)[:, 1].reshape(xx.shape)
    ax.contourf(xx, yy, prob, levels=20, cmap="coolwarm", alpha=0.6)
    ax.scatter(X[:, 0], X[:, 1], c=y, cmap="coolwarm", edgecolor="k", s=15)
    ax.set_title(f"{nombre}\nexactitud = {exactitud:.0%}", fontsize=10)
    ax.set_xticks([]); ax.set_yticks([])
    print(f"{nombre:35s} exactitud = {exactitud:.1%}")
plt.tight_layout()
```

**🎯 Reto:** cambia `hidden_layer_sizes=(8,)` por `(1,)` y luego por `(2,)`. ¿Con cuántas neuronas ocultas la red
logra "encerrar" el centro? ¿Por qué con una sola neurona oculta se parece tanto a la logística?
{: .py-run-reto }

</div>

!!! warning "⚠️ Error común"
    Pensar que "más capas siempre es mejor". Una red más grande **puede** dibujar fronteras más complejas, pero también
    puede dibujar fronteras **absurdas** que se acomodan al ruido de los datos (lo verás en el Tema 4). Con texto
    representado como TF-IDF, a menudo una regresión logística ya funciona muy bien: **la red tiene que ganarse su
    lugar** en la comparación del Sprint 1.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 2</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">En el simulador, con <strong>0 neuronas ocultas</strong> y los datos en anillo, la exactitud se queda cerca del 50–60 % aunque entrenes muchas épocas. ¿Por qué?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Más épocas no cambian la forma de la frontera: con 0 neuronas ocultas siempre es una recta.">Porque le faltan épocas de entrenamiento.</button>
<button class="econ-quiz-opt" data-why="La tasa de aprendizaje afecta la velocidad, no el tipo de frontera que el modelo puede dibujar.">Porque la tasa de aprendizaje es muy baja.</button>
<button class="econ-quiz-opt" data-correct>Porque sin capa oculta el modelo solo puede trazar una frontera recta, y un anillo no se separa con una recta.</button>
</div>
<p class="econ-quiz-fb">✅ Es un problema de <strong>capacidad</strong> del modelo, no de entrenamiento. Con capa oculta, cada neurona aporta una recta y la salida las combina en una región cerrada.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Qué pasaría si quitaras la función de activación de las capas ocultas (dejándolas lineales)?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-correct>La red completa sería equivalente a un modelo lineal, sin importar cuántas capas tenga.</button>
<button class="econ-quiz-opt" data-why="Al contrario: sin activación, las capas se “funden” en una sola transformación lineal y la red pierde capacidad.">La red sería más flexible porque no “aplasta” los valores.</button>
<button class="econ-quiz-opt" data-why="Entrenaría igual de rápido o más, pero el problema es lo que puede representar: solo fronteras rectas.">La red no podría entrenarse con descenso de gradiente.</button>
</div>
<p class="econ-quiz-fb">✅ Lineal de lineal es lineal: \( W_2(W_1x) = (W_2W_1)x \). La no linealidad es la que permite doblar la frontera.</p>
</div>
</div>

---

## Tema 3 · Cómo aprende una red {#tema-3}

> **Pregunta guía:** nadie le dice a la red cuáles son los pesos correctos. ¿Cómo los encuentra?

Una red parte con pesos **al azar** y los va corrigiendo, como quien aprende a lanzar al aro: lanza, mira qué tan
lejos quedó, y ajusta. Para eso necesita tres piezas:

**1. Una función de pérdida: ¿qué tan mal lo hice?** En clasificación se usa la **entropía cruzada**. La intuición es
simple: *mira la probabilidad que la red le dio a la respuesta correcta y castígala si es baja*.

$$ \text{pérdida} = -\log(p_{\text{clase correcta}}) $$

| La red dijo que era "Fraude" con probabilidad… | …y era Fraude. Pérdida |
|---|---|
| 0,90 (segura y acertó) | \( -\log 0{,}90 = 0{,}11 \) 🙂 |
| 0,50 (dudosa) | \( -\log 0{,}50 = 0{,}69 \) 😐 |
| 0,05 (segura y **se equivocó**) | \( -\log 0{,}05 = 3{,}00 \) 😱 |

Equivocarse **con seguridad** cuesta muchísimo más que dudar. Eso empuja a la red a ser honesta con sus probabilidades.

**2. El descenso de gradiente: ¿hacia dónde corrijo?** Imagina que estás en un cerro con niebla y quieres llegar al
valle. No ves el valle, pero sí sientes la **pendiente** bajo tus pies. Das un paso cuesta abajo, vuelves a sentir la
pendiente, otro paso… El **gradiente** es esa pendiente: dice cómo cambia la pérdida si mueves cada peso un poquito.

$$ w \;\leftarrow\; w - \eta \cdot \frac{\partial\, \text{pérdida}}{\partial w} $$

**3. La tasa de aprendizaje \( \eta \): ¿qué tan largo es el paso?** Es el hiperparámetro más importante del
entrenamiento. Pruébalo:

<div class="ia-widget" data-widget="c1-gradiente"></div>

**Épocas y batches.** Calcular el gradiente con *todos* los reclamos a la vez es caro. En la práctica la red mira los
datos de a **batches** (lotes, p. ej. 32 reclamos), da un paso con cada lote, y cuando ya vio todos los datos una vez,
completó una **época**.

| Concepto | Qué es | Ejemplo con 6.000 reclamos |
|---|---|---|
| Batch | Grupo de ejemplos con que se calcula **un** paso | 32 reclamos |
| Iteración | Un paso de descenso de gradiente | 6.000 / 32 ≈ 188 pasos por época |
| Época | Una pasada completa por los datos de entrenamiento | 20 épocas = 3.760 pasos |

El algoritmo que calcula el gradiente de todos los pesos de una red, capa por capa desde la salida hacia atrás, es
la **retropropagación** (*backpropagation*), que viste en el curso I. Hoy no lo programas a mano: Keras y
scikit-learn lo hacen por ti. Lo que **sí** decides tú es la tasa, el tamaño del batch y cuántas épocas entrenar.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Descenso de gradiente a mano</p>

Entrenamos una neurona (regresión logística) con tres tasas de aprendizaje y comparamos cómo baja la pérdida.

```python
import numpy as np
import matplotlib.pyplot as plt

# Intuición de la entropía cruzada: castiga equivocarse con seguridad
for p in [0.9, 0.5, 0.05]:
    print(f"Prob. asignada a la clase correcta = {p:.2f}  ->  pérdida = {-np.log(p):.2f}")

# 200 reclamos simulados: x = palabras de alarma (estandarizado), y = 1 si es urgente
rng = np.random.default_rng(0)
x = rng.normal(size=200)
y = (rng.random(200) < 1 / (1 + np.exp(-(2.5 * x - 0.5)))).astype(float)

def entrenar(lr, epocas=30):
    w, b = 0.0, 0.0                    # pesos iniciales
    historia = []
    for _ in range(epocas):
        p = 1 / (1 + np.exp(-(w * x + b)))                                  # predicción
        perdida = -np.mean(y * np.log(p + 1e-9) + (1 - y) * np.log(1 - p + 1e-9))
        historia.append(perdida)
        grad_w = np.mean((p - y) * x)  # pendiente de la pérdida respecto de w
        grad_b = np.mean(p - y)        # pendiente respecto de b
        w -= lr * grad_w               # paso cuesta abajo
        b -= lr * grad_b
    return historia

plt.figure(figsize=(7, 3.5))
for lr in [0.1, 2, 30]:
    h = entrenar(lr)
    plt.plot(h, marker="o", ms=3, label=f"tasa = {lr}")
    print(f"tasa {lr:>4}: pérdida inicial {h[0]:.3f} -> final {h[-1]:.3f}")
plt.xlabel("época"); plt.ylabel("entropía cruzada"); plt.legend()
plt.title("¿Qué tasa de aprendizaje elegirías?")
plt.tight_layout()
```

**🎯 Reto:** prueba con `lr = 0.5` y `lr = 8`. Busca la tasa más grande que todavía baja de forma suave. ¿Qué pasa
con la curva de `30`, y por qué se parece a la bola del simulador cuando la tasa es mayor que 2?
{: .py-run-reto }

</div>

!!! warning "⚠️ Error común"
    Entrenar con una tasa demasiado alta y concluir que "la red no funciona". Si la pérdida **sube o salta** de una
    época a otra, el primer sospechoso es la tasa de aprendizaje. Si baja **lentísimo**, también. En Keras el
    optimizador **Adam** (el que usaremos) ajusta el tamaño del paso de cada peso de forma automática, y su valor por
    defecto (0,001) suele ser un buen punto de partida.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 3</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Un reclamo era “Cobro indebido”. El modelo A le asignó 0,40 a esa clase; el modelo B, 0,02. ¿Cuál tiene mayor entropía cruzada en ese reclamo?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="−log(0,40) ≈ 0,92, mientras que −log(0,02) ≈ 3,9: A se equivoca menos.">El modelo A, porque 0,40 está más lejos de 1 que de 0.</button>
<button class="econ-quiz-opt" data-correct>El modelo B: casi descartó la respuesta correcta, y eso se castiga fuerte.</button>
<button class="econ-quiz-opt" data-why="La entropía cruzada solo mira la probabilidad de la clase correcta, y ahí los modelos son muy distintos.">Igual, porque ninguno de los dos acertó (ambos &lt; 0,5).</button>
</div>
<p class="econ-quiz-fb">✅ −log(0,02) ≈ 3,9 frente a −log(0,40) ≈ 0,92. La pérdida castiga mucho más la seguridad equivocada que la duda, aunque en exactitud los dos “fallan” igual.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Durante el entrenamiento, la pérdida salta así: 0,69 → 0,52 → 2,10 → 0,61 → 3,40… ¿Qué cambias primero?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Más épocas solo prolongan los saltos; el problema es el tamaño de cada paso.">Aumento el número de épocas.</button>
<button class="econ-quiz-opt" data-why="Más neuronas no arreglan un paso demasiado largo; incluso pueden empeorar la inestabilidad.">Agrego más neuronas ocultas.</button>
<button class="econ-quiz-opt" data-correct>Bajo la tasa de aprendizaje.</button>
</div>
<p class="econ-quiz-fb">✅ Pérdida que rebota o crece = pasos demasiado largos que sobrepasan el mínimo, como la bola del simulador con tasa &gt; 2.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Tienes 4.800 reclamos de entrenamiento y usas <code>batch_size=64</code>. ¿Cuántos pasos de descenso de gradiente da la red en una época?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Ese sería el caso de batch_size = 4.800 (todos los datos en un solo lote).">1</button>
<button class="econ-quiz-opt" data-correct>75</button>
<button class="econ-quiz-opt" data-why="Eso sería un paso por reclamo (batch_size = 1).">4.800</button>
</div>
<p class="econ-quiz-fb">✅ 4.800 / 64 = 75 pasos (iteraciones) por época. En Keras verás “75/75” en la barra de progreso de cada época.</p>
</div>
</div>

---

## Tema 4 · Sobreajuste y cómo evitarlo {#tema-4}

> **Pregunta guía:** si la pérdida de entrenamiento sigue bajando, ¿por qué no entrenar para siempre?

Porque la red puede **memorizar** en vez de **aprender**. Es como el alumno que se aprende de memoria las respuestas
de la prueba del año pasado: le va perfecto en *esa* prueba, pero mal en la de este año. Una red con muchos pesos
puede aprenderse de memoria hasta el ruido de los reclamos de entrenamiento (incluidas las etiquetas mal puestas,
que en FinTrust y MercaSur existen a propósito).

Para detectarlo separamos un grupo de **validación**: datos que la red **no usa para aprender**, solo para
controlar cómo le va. Luego comparamos las dos curvas:

- Las dos bajan juntas → la red está aprendiendo patrones generales. 👍
- Entrenamiento sigue bajando, validación **sube** → **sobreajuste** (*overfitting*). 🚩

Las dos herramientas que usarás en Keras:

- **Early stopping:** vigila la pérdida de validación; si no mejora en *N* épocas seguidas (la **paciencia**), detiene
  el entrenamiento y **recupera los pesos de la mejor época**.
- **Dropout:** en cada paso de entrenamiento **apaga al azar** un porcentaje de neuronas (p. ej. 30 %). La red no
  puede depender de una sola neurona "estrella" y se ve obligada a repartir lo aprendido. Es como entrenar a un
  equipo rotando a los jugadores: nadie se vuelve imprescindible.

<div class="ia-widget" data-widget="c1-curvas"></div>

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Ver el sobreajuste en vivo</p>

Una red demasiado grande para pocos datos ruidosos. Registramos la pérdida en entrenamiento y validación época a época.

```python
import numpy as np
import warnings
import matplotlib.pyplot as plt
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import log_loss
warnings.filterwarnings("ignore")

# Pocos datos y bastante ruido: terreno fértil para memorizar
X, y = make_moons(n_samples=160, noise=0.35, random_state=3)
X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.5, random_state=3)

# Red grande (2 capas de 64 neuronas) y sin regularización (alpha = 0)
red = MLPClassifier(hidden_layer_sizes=(64, 64), alpha=0.0, learning_rate_init=0.01, random_state=0)

perdida_tr, perdida_val = [], []
for epoca in range(250):
    red.partial_fit(X_tr, y_tr, classes=[0, 1])          # una época de entrenamiento
    perdida_tr.append(log_loss(y_tr, red.predict_proba(X_tr)))
    perdida_val.append(log_loss(y_val, red.predict_proba(X_val)))

mejor = int(np.argmin(perdida_val))
print(f"Mejor época según validación: {mejor + 1}  (pérdida val = {perdida_val[mejor]:.3f})")
print(f"Época 250: pérdida train = {perdida_tr[-1]:.3f}, pérdida val = {perdida_val[-1]:.3f}")

plt.figure(figsize=(7, 3.5))
plt.plot(perdida_tr, label="entrenamiento", color="#e5b300")
plt.plot(perdida_val, label="validación", color="#005f96")
plt.axvline(mejor, ls="--", color="#b30828", label="aquí convenía parar")
plt.xlabel("época"); plt.ylabel("entropía cruzada"); plt.ylim(0, 1.2); plt.legend()
plt.tight_layout()
```

**🎯 Reto:** scikit-learn no trae dropout, pero sí otra forma de frenar la memorización: la penalización `alpha`
(como el Ridge del curso I). Prueba `alpha=0.05` y luego `hidden_layer_sizes=(8,)`. ¿Qué pasa con la brecha entre
las curvas y con la mejor época?
{: .py-run-reto }

</div>

!!! warning "⚠️ Error común"
    Elegir el modelo (o la época, o la cantidad de neuronas) mirando el **test**. El test es la "prueba final":
    se mira **una sola vez**, al final, para reportar. Para decidir hiperparámetros se usa **validación**
    (en Keras, `validation_split=0.15`). Si ajustas mirando el test, tu F1 reportado será optimista y en producción
    te llevarás una sorpresa.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 4</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">En la época 30, la pérdida de entrenamiento es 0,05 y la de validación es 0,95 (y viene subiendo desde la época 8). ¿Qué diagnosticas?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Subajuste sería que ambas pérdidas se quedan altas: el modelo no logra aprender ni siquiera los datos de entrenamiento.">Subajuste: la red necesita más capacidad.</button>
<button class="econ-quiz-opt" data-correct>Sobreajuste: la red memorizó el entrenamiento; convenía parar cerca de la época 8.</button>
<button class="econ-quiz-opt" data-why="Una tasa alta haría saltar la pérdida de entrenamiento; aquí la de entrenamiento baja suavemente hasta casi cero.">La tasa de aprendizaje es demasiado alta.</button>
</div>
<p class="econ-quiz-fb">✅ Brecha grande y validación subiendo = sobreajuste. Early stopping con <code>restore_best_weights=True</code> se habría quedado con los pesos de la época 8.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Cuál de estas afirmaciones sobre el <strong>dropout</strong> es correcta?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Dropout no borra datos: apaga neuronas (temporalmente) durante el entrenamiento.">Elimina al azar el 30 % de los reclamos de entrenamiento en cada época.</button>
<button class="econ-quiz-opt" data-why="Al predecir (validación, test, producción) todas las neuronas están encendidas; Keras lo maneja solo.">También apaga neuronas al momento de predecir, para que las predicciones sean más prudentes.</button>
<button class="econ-quiz-opt" data-correct>Apaga neuronas al azar solo durante el entrenamiento, para que la red no dependa de unas pocas.</button>
</div>
<p class="econ-quiz-fb">✅ Por eso con dropout la pérdida de entrenamiento suele quedar <em>más alta</em> que sin él, pero la de validación mejora: la red aprende patrones más robustos.</p>
</div>
</div>

---

## Tema 5 · El texto también es un dato {#tema-5}

> **Pregunta guía:** una red neuronal solo entiende números. ¿Cómo le pasamos un reclamo escrito por un cliente?

### 5.1 Antes de modelar: auditar y limpiar

Antes de cualquier modelo, **mira los datos**. Los casos FinTrust y MercaSur vienen sucios a propósito, como los
datos reales: reclamos duplicados, textos vacíos o basura ("reclamo", "ok"), categorías escritas de cinco formas
distintas ("Fraude", "FRAUDE", "fraude ", …), montos negativos o días de resolución imposibles. Si entrenas con
"Fraude" y "FRAUDE" como clases distintas, el modelo aprende 12 categorías en vez de 6 y tus métricas no significan nada.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Auditoría de calidad de FinTrust</p>

Cuántos problemas hay, y de qué tipo. La herramienta estrella es `value_counts()`.

```python
import pandas as pd

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv")
print("Filas:", len(df))
print("Duplicados exactos:", df.duplicated().sum())

texto = df["texto"].fillna("").str.strip()
print("Textos vacíos o de menos de 3 palabras:", (texto.str.split().str.len() < 3).sum())
print("Montos negativos:", (df["monto_reclamado"] < 0).sum())
print("Días de resolución imposibles (< 0 o > 365):",
      ((df["dias_resolucion"] < 0) | (df["dias_resolucion"] > 365)).sum())
print("Urgencia nula:", df["urgencia"].isna().sum())
print("Formas distintas de escribir la categoría:", df["categoria"].nunique(), "(deberían ser 6)\n")

# ¿Cómo está escrita la categoría? Debería haber 6 valores...
df["categoria"].value_counts()
```

**🎯 Reto:** haz lo mismo con la columna `canal` (`df["canal"].value_counts()`). ¿Cuántos canales distintos hay
*de verdad*? Si eliges MercaSur, cambia el archivo por `resenas_mercasur_muestra.csv` y audita `aspecto` y `rating`.
{: .py-run-reto }

</div>

La limpieza mínima para el Sprint 1 cabe en una función reutilizable: quitar duplicados, sacar textos basura y
**normalizar las categorías** (minúsculas, sin tildes, sin espacios extra, y un diccionario para los sinónimos).

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Una función de limpieza</p>

Normalizamos la categoría para que "FRAUDE", "fraude " y "Fraude" sean la misma clase.

```python
import pandas as pd
import unicodedata

def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def clave(s):
    """'  Crédito y  TASAS ' -> 'credito y tasas'"""
    return " ".join(sin_tildes(str(s)).lower().split())

CATEGORIAS = ["Fraude", "Cobro indebido", "App y canales digitales",
              "Crédito y tasas", "Atención al cliente", "Información y trámites"]
MAPA = {clave(c): c for c in CATEGORIAS}
MAPA["cobros indebidos"] = "Cobro indebido"          # sinónimos detectados en la auditoría

def limpiar(df, col_texto="texto", col_clase="categoria"):
    n0 = len(df)
    df = df.drop_duplicates().copy()
    df[col_texto] = df[col_texto].fillna("").str.strip()
    df = df[df[col_texto].str.split().str.len() >= 3]               # fuera textos basura
    df[col_clase] = df[col_clase].map(lambda s: MAPA.get(clave(s)))  # normaliza categorías
    df = df.dropna(subset=[col_clase])
    print(f"Filas: {n0} -> {len(df)}  (eliminadas: {n0 - len(df)})")
    return df

df = limpiar(pd.read_csv(DATA + "reclamos_fintrust_muestra.csv"))
df["categoria"].value_counts()
```

**🎯 Reto:** agrega una línea a `limpiar` que elimine los montos negativos (convirtiéndolos en `NaN` con
`df.loc[df["monto_reclamado"] < 0, "monto_reclamado"] = None`). ¿Por qué es mejor convertirlos en nulos que borrar la fila completa?
{: .py-run-reto }

</div>

### 5.2 Bolsa de palabras y TF-IDF

La idea más simple para convertir texto en números es la **bolsa de palabras**: hacemos una columna por cada palabra
del vocabulario y contamos cuántas veces aparece en cada reclamo. Se pierde el orden ("me cobraron y no pagué" y "no
me cobraron y pagué" quedan casi iguales), pero funciona sorprendentemente bien para clasificar temas.

<div class="c1-bow" markdown>

*Algunas columnas del vocabulario (en la práctica hay miles):*

| Reclamo | cobraron | dos | veces | comisión | reconozco | compra | fraude | app | cae | la | no |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R1 · "me cobraron dos veces la comisión" | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| R2 · "no reconozco una compra, creo que es fraude" | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 1 |
| R3 · "la app no me deja entrar, la app se cae" | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 2 | 1 |

</div>

Problema: palabras como "la", "no" o "me" aparecen en casi todos los reclamos y no ayudan a distinguir la categoría.
**TF-IDF** corrige esto multiplicando dos cosas:

- **TF** (*term frequency*): cuántas veces aparece la palabra **en este reclamo** → "app" pesa más en R3 porque aparece dos veces.
- **IDF** (*inverse document frequency*): qué tan **rara** es la palabra **en todos los reclamos** → "fraude" aparece
  en pocos reclamos y pesa mucho; "la" aparece en casi todos y pesa poco.

$$ \text{tf-idf}(\text{palabra}, \text{reclamo}) = \text{tf} \times \log\frac{N}{\text{n.º de reclamos con esa palabra}} $$

El resultado: cada reclamo se convierte en un vector (una fila) con miles de columnas, casi todas en cero, donde
las palabras **frecuentes en ese reclamo pero raras en general** tienen los valores más altos. Esa matriz es la
entrada de la regresión logística y de la red neuronal.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · TF-IDF con tres reclamos</p>

Compara los conteos con los pesos TF-IDF: mira qué pasa con "la" y con "fraude".

```python
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

reclamos = ["me cobraron dos veces la comisión",
            "no reconozco una compra, creo que es fraude",
            "la app no me deja entrar, la app se cae"]

bolsa = CountVectorizer()
conteos = bolsa.fit_transform(reclamos)
print("Vocabulario:", len(bolsa.get_feature_names_out()), "palabras\n")

tfidf = TfidfVectorizer()
pesos = tfidf.fit_transform(reclamos)

# Palabras en filas, reclamos en columnas (más fácil de leer)
tabla = pd.DataFrame(pesos.toarray().T, index=tfidf.get_feature_names_out(),
                     columns=["R1", "R2", "R3"])
tabla["conteo total"] = conteos.toarray().sum(axis=0)
tabla.round(2).sort_values("R3", ascending=False)
```

**🎯 Reto:** agrega un cuarto reclamo: `"la app me cobró una comisión que no reconozco"`. ¿Qué le pasa al peso de
"app" en R3 ahora que la palabra aparece en dos reclamos?
{: .py-run-reto }

</div>

### 5.3 Logística vs. red neuronal sobre TF-IDF

Ahora sí, el flujo completo del Sprint 1 en miniatura: limpiar → separar entrenamiento y test → TF-IDF →
dos modelos → comparar con **F1 macro**.

<div class="ia-flow">
<div class="ia-flow-step is-done"><strong>1 · Limpiar</strong>duplicados, textos basura, categorías</div>
<div class="ia-flow-step is-done"><strong>2 · Separar</strong>80 % entrena · 20 % test (estratificado)</div>
<div class="ia-flow-step is-done"><strong>3 · TF-IDF</strong>se ajusta <em>solo</em> con entrenamiento</div>
<div class="ia-flow-step is-on"><strong>4 · Modelos</strong>logística vs. red (MLP)</div>
<div class="ia-flow-step"><strong>5 · Evaluar</strong>F1 macro + matriz de confusión</div>
</div>

¿Por qué **F1 macro** y no exactitud? Porque las categorías no tienen el mismo tamaño. F1 macro calcula el F1 de
**cada** categoría y los promedia **sin ponderar**: una categoría chica pero crítica (como Fraude) pesa lo mismo que
la más grande. Un modelo que ignora Fraude no puede esconderse detrás de un buen promedio.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Primer duelo: logística vs. MLP</p>

Con la muestra de 1.500 reclamos. Tarda unos segundos: la red se entrena en tu navegador.

```python
import pandas as pd
import unicodedata, warnings
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import f1_score, ConfusionMatrixDisplay
from sklearn.preprocessing import LabelEncoder
warnings.filterwarnings("ignore")

# --- 1. Limpiar (misma función de antes, compacta)
def clave(s):
    s = "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn")
    return " ".join(s.lower().split())
CATS = ["Fraude", "Cobro indebido", "App y canales digitales", "Crédito y tasas",
        "Atención al cliente", "Información y trámites"]
MAPA = {clave(c): c for c in CATS} | {"cobros indebidos": "Cobro indebido"}

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv").drop_duplicates()
df["texto"] = df["texto"].fillna("").str.strip()
df = df[df["texto"].str.split().str.len() >= 3]
df["categoria"] = df["categoria"].map(lambda s: MAPA.get(clave(s)))
df = df.dropna(subset=["categoria"])

# Las redes trabajan con números: cada categoría pasa a ser 0, 1, ..., 5
codif = LabelEncoder()
y = codif.fit_transform(df["categoria"])

# --- 2. Separar (estratificado: misma proporción de categorías en train y test)
X_tr, X_te, y_tr, y_te = train_test_split(df["texto"], y, test_size=0.2,
                                          stratify=y, random_state=42)

# --- 3. TF-IDF: se ajusta SOLO con entrenamiento
vec = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)
Xtr = vec.fit_transform(X_tr)
Xte = vec.transform(X_te)
print("Matriz TF-IDF de entrenamiento:", Xtr.shape)

# --- 4. Dos modelos
modelos = {
    "Regresión logística": LogisticRegression(max_iter=1000, C=5),
    "Red neuronal (MLP 64)": MLPClassifier(hidden_layer_sizes=(64,), early_stopping=True,
                                           max_iter=60, random_state=42),
}
for nombre, m in modelos.items():
    m.fit(Xtr, y_tr)
    pred = m.predict(Xte)
    print(f"{nombre:25s} F1 macro en test = {f1_score(y_te, pred, average='macro'):.3f}")

# --- 5. Matriz de confusión del modelo logístico
fig, ax = plt.subplots(figsize=(7, 6))
ConfusionMatrixDisplay.from_predictions(y_te, modelos["Regresión logística"].predict(Xte),
                                        labels=range(len(codif.classes_)),
                                        display_labels=codif.classes_, ax=ax,
                                        xticks_rotation=45, cmap="Blues", colorbar=False)
ax.set_title("Regresión logística · matriz de confusión (test)")
ax.set_xlabel("Categoría predicha"); ax.set_ylabel("Categoría real")
plt.tight_layout()
```

**🎯 Reto:** comenta la línea que normaliza `categoria` (ponle `#` adelante) y vuelve a ejecutar. ¿Cuántas
"categorías" ve ahora el modelo y qué le pasa al F1 macro? Esa es la razón de auditar primero.
{: .py-run-reto }

</div>

!!! tip "💼 En el negocio"
    Que la red neuronal **no** le gane a la logística sobre TF-IDF no es un fracaso: es un **hallazgo**. Con
    vocabularios claros ("no reconozco", "cobraron dos veces", "la app se cae"), un modelo lineal ya separa bien, es
    más rápido, más barato y más fácil de explicar a un gerente. En las próximas clases verás cuándo sí ganan los
    modelos más sofisticados (embeddings y LLM): con **pocos datos etiquetados**, sinónimos y tareas de extracción.

!!! warning "⚠️ Error común"
    Ajustar el `TfidfVectorizer` con **todos** los datos (`fit` antes de separar). El IDF "espía" las palabras del test
    y el resultado sale optimista. La regla: `fit_transform` en entrenamiento, `transform` en test. Lo mismo vale para
    cualquier limpieza que "aprenda" de los datos.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 5</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">En la auditoría, <code>value_counts()</code> de la categoría muestra 20 valores distintos en vez de 6. ¿Qué haces?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Borrarías ~7 % de los datos que tienen una etiqueta válida, solo mal escrita. Es información recuperable.">Eliminas las filas cuya categoría no esté escrita exactamente igual a las 6 oficiales.</button>
<button class="econ-quiz-opt" data-correct>Normalizas (minúsculas, sin tildes, sin espacios extra) y mapeas sinónimos a las 6 categorías oficiales.</button>
<button class="econ-quiz-opt" data-why="El modelo trataría “Fraude” y “FRAUDE” como clases distintas y repartiría los ejemplos entre ellas: aprende peor y las métricas pierden sentido.">Nada: la red neuronal es capaz de aprender que son la misma categoría.</button>
</div>
<p class="econ-quiz-fb">✅ Normalizar recupera esas filas y deja exactamente 6 clases. Reporta en tu Sprint 1 cuántas filas corregiste: es parte de la auditoría.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">En TF-IDF, ¿qué palabra tendrá <strong>mayor</strong> peso en el reclamo “no reconozco un cargo, creo que es fraude, no fui yo”?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="“no” aparece dos veces (TF alto), pero también aparece en una enorme cantidad de reclamos: su IDF es bajo.">“no”, porque aparece dos veces.</button>
<button class="econ-quiz-opt" data-why="“que” aparece en casi todos los textos en español: IDF muy bajo.">“que”, porque es la más común en español.</button>
<button class="econ-quiz-opt" data-correct>“reconozco” o “fraude”, porque aparecen en este reclamo y son raras en el resto.</button>
</div>
<p class="econ-quiz-fb">✅ TF-IDF premia lo frecuente <em>aquí</em> y raro <em>en general</em>: justo las palabras que distinguen la categoría.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Un modelo tiene 85 % de exactitud, pero su F1 macro es 0,60. ¿Qué es lo más probable?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-correct>Le va bien en las categorías grandes y mal en una o más categorías chicas.</button>
<button class="econ-quiz-opt" data-why="La exactitud y el F1 macro miden cosas distintas; la discrepancia es información, no un error de cálculo.">Hay un error de cálculo: ambas métricas deberían coincidir.</button>
<button class="econ-quiz-opt" data-why="El F1 macro no castiga el tamaño del modelo; promedia el F1 de cada categoría con igual peso.">La red es demasiado grande y el F1 macro castiga la complejidad.</button>
</div>
<p class="econ-quiz-fb">✅ La exactitud la dominan las clases grandes; el F1 macro da el mismo peso a todas. Revisa el F1 por clase en el <code>classification_report</code> para encontrar la categoría débil.</p>
</div>
</div>

---

## Tema 6 · La matriz de confusión con ojos de negocio {#tema-6}

> **Pregunta guía:** si el modelo se equivoca en 20 reclamos, ¿da lo mismo **cuáles** 20?

**No da lo mismo.** En FinTrust no cuesta lo mismo:

- Un **fraude** clasificado como "Información y trámites": el reclamo va a la cola lenta, el cliente sigue perdiendo
  plata, el banco puede tener que devolver el dinero con intereses, aparece en redes sociales y quizás en la CMF.
- Una **consulta de información** clasificada como "Fraude": el equipo antifraude pierde 10 minutos revisándola y la
  reenvía. Molesta, pero barato.

La matriz de confusión te dice **cuántos** errores de cada tipo hay; el negocio te dice **cuánto cuesta** cada uno.
Multiplicando ambas cosas obtienes el **costo esperado** del modelo, que es lo que le importa al gerente. Y hay una
palanca que no requiere reentrenar: el **umbral** de decisión. Si un fraude no detectado es muy caro, conviene marcar
como fraude todo reclamo con probabilidad sobre 0,3 (no 0,5), aceptando más falsas alarmas.

<div class="ia-widget" data-widget="c1-costos"></div>

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · ¿Cuánto cuestan los errores del modelo?</p>

Usamos la probabilidad de "Fraude" de la regresión logística y buscamos el umbral que minimiza el costo.

```python
import numpy as np
import pandas as pd
import unicodedata
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

def clave(s):
    s = "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn")
    return " ".join(s.lower().split())
CATS = ["Fraude", "Cobro indebido", "App y canales digitales", "Crédito y tasas",
        "Atención al cliente", "Información y trámites"]
MAPA = {clave(c): c for c in CATS} | {"cobros indebidos": "Cobro indebido"}
df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv").drop_duplicates()
df["texto"] = df["texto"].fillna("").str.strip()
df = df[df["texto"].str.split().str.len() >= 3]
df["categoria"] = df["categoria"].map(lambda s: MAPA.get(clave(s)))
df = df.dropna(subset=["categoria"])

X_tr, X_te, y_tr, y_te = train_test_split(df["texto"], df["categoria"], test_size=0.3,
                                          stratify=df["categoria"], random_state=7)
vec = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)
modelo = LogisticRegression(max_iter=1000, C=5).fit(vec.fit_transform(X_tr), y_tr)
p_fraude = modelo.predict_proba(vec.transform(X_te))[:, list(modelo.classes_).index("Fraude")]
es_fraude = (y_te == "Fraude").to_numpy()

COSTO_FN = 400_000   # fraude que se nos escapa (devolución, multa, reputación)
COSTO_FP = 20_000    # falsa alarma: revisión manual del equipo antifraude

filas = []
for umbral in [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]:
    marcado = p_fraude >= umbral
    fn = int((es_fraude & ~marcado).sum())
    fp = int((~es_fraude & marcado).sum())
    filas.append({"umbral": umbral, "fraudes no detectados": fn, "falsas alarmas": fp,
                  "costo total ($)": fn * COSTO_FN + fp * COSTO_FP})
tabla = pd.DataFrame(filas)
print("Umbral de menor costo:", tabla.loc[tabla["costo total ($)"].idxmin(), "umbral"])

# Los "fraudes" que el modelo no ve ni con umbral 0,1: ¿son fraude de verdad?
print("\nReclamos etiquetados como Fraude con probabilidad < 0,1:")
for t in X_te[es_fraude & (p_fraude < 0.1)]:
    print("  ·", t)
tabla
```

Mira los "fraudes" que el modelo no detecta ni con umbral 0,1: ¿de verdad son fraudes? Son **ruido de etiqueta**
(reclamos mal etiquetados por una persona). Ningún umbral ni ninguna red los arregla: el techo de tu F1 lo pone
la calidad de las etiquetas.

**🎯 Reto:** ¿qué pasa con el umbral óptimo si la falsa alarma cuesta $150.000 (por ejemplo, porque bloquea la
tarjeta del cliente)? Cambia `COSTO_FP` y explícalo en una frase como se lo dirías a la gerenta de riesgo.
{: .py-run-reto }

</div>

!!! tip "💼 En el negocio"
    Presenta los errores en **pesos y en clientes**, no solo en F1. "El modelo deja pasar 3 de cada 100 fraudes, lo
    que estimamos en $X al mes; bajando el umbral a 0,3 dejamos pasar 1 de cada 100 a cambio de 40 revisiones manuales
    más por semana" es una frase que un comité puede **decidir**. Esa traducción es lo que se evalúa en la presentación final.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 6</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Si un fraude no detectado cuesta 20 veces más que una falsa alarma, ¿hacia dónde mueves el umbral para marcar “Fraude”?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Subir el umbral marca menos reclamos como fraude: menos falsas alarmas, pero se escapan más fraudes, que son los caros.">Lo subo (p. ej. a 0,8), para estar muy seguro antes de marcar.</button>
<button class="econ-quiz-opt" data-correct>Lo bajo (p. ej. a 0,3), aceptando más falsas alarmas a cambio de detectar más fraudes.</button>
<button class="econ-quiz-opt" data-why="0,5 solo es óptimo si ambos errores cuestan lo mismo, lo que aquí no se cumple.">Lo dejo en 0,5, que es el umbral estándar.</button>
</div>
<p class="econ-quiz-fb">✅ Cuando el falso negativo es mucho más caro, conviene sacrificar precisión para ganar <strong>recall</strong> en Fraude. Compruébalo en el simulador con el botón 🎯.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">En la matriz de confusión de tu modelo, 6 reclamos de “Fraude” quedaron como “Información y trámites” y 6 de “Información y trámites” quedaron como “Fraude”. ¿Qué le dices al gerente?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Son la misma cantidad, pero no el mismo costo: el fraude mal clasificado es el que duele.">Que los errores se compensan: 6 hacia un lado y 6 hacia el otro.</button>
<button class="econ-quiz-opt" data-why="El F1 macro resume, pero no distingue el costo de cada tipo de error; el gerente necesita saber cuáles errores importan.">Que el F1 macro ya resume eso, no hace falta mirar la matriz.</button>
<button class="econ-quiz-opt" data-correct>Que los 6 fraudes mal derivados son el error crítico y propones cómo reducirlos (umbral o revisión humana).</button>
</div>
<p class="econ-quiz-fb">✅ Misma cantidad, costo muy distinto. Leer la matriz con ojos de negocio es separar el error molesto del error caro y proponer una acción.</p>
</div>
</div>

---

## 🧑‍💻 Notebook de Colab

<div class="ia-colab" markdown>
<p>🧑‍💻 <strong>Notebook de la clase:</strong> carga el caso completo (FinTrust o MercaSur, ~6.000 textos), audita y limpia
los datos, hace el EDA de texto, entrena el baseline TF-IDF + regresión logística y una red neuronal en
<strong>Keras</strong> con dropout y early stopping, y compara ambos en test con F1 macro y matriz de confusión.
Toma ~45 minutos leyéndolo con calma (el entrenamiento corre en menos de 2 minutos). Es el esqueleto de tu Sprint 1.</p>
<a class="ia-colab-btn" href="https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/clase1_redes_neuronales.ipynb" target="_blank" rel="noopener">▶ Abrir en Colab</a>
</div>

!!! info "Antes de abrirlo"
    En Colab, usa **Archivo → Guardar una copia en Drive** para no perder tus cambios. En la primera celda de código
    elige tu caso: `CASO = "fintrust"` o `CASO = "mercasur"`. No necesitas GPU ni clave de API para esta clase.

## 🔗 Conexión con tu proyecto (Sprint 1)

<div class="ia-sprint" markdown>

### 📬 Sprint 1 · Datos y primeros modelos <span class="ia-badge is-gold">domingo 8 de noviembre, 23:59</span> <span class="ia-badge">10 %</span>

Antes, el **domingo 1 de noviembre** se inscribe el equipo y el caso por [buzón](../proyecto/buzon.md) (sin nota). Para el Sprint 1, tu
notebook debe incluir:

- [ ] **Pregunta de negocio** en una o dos frases: qué decisión apoya el clasificador y quién lo usaría
      (p. ej. "derivar automáticamente cada reclamo al equipo correcto en menos de un minuto").
- [ ] **Auditoría de calidad** con números: duplicados, nulos, textos vacíos o basura, categorías mal escritas y
      valores imposibles (montos negativos, días o ratings fuera de rango). Una tabla "problema → cuántos → qué hicimos".
- [ ] **Función de limpieza** reutilizable y el `value_counts()` de las clases **antes y después**.
- [ ] **EDA de texto:** distribución de clases, largo de los textos y palabras más frecuentes por clase, con una
      conclusión breve de cada gráfico.
- [ ] **Baseline:** TF-IDF + regresión logística, con el vectorizador ajustado solo en entrenamiento.
- [ ] **Red neuronal MLP en Keras** sobre TF-IDF, con dropout, early stopping y sus **curvas de entrenamiento**
      (pérdida en entrenamiento y validación).
- [ ] **Comparación en test:** F1 macro de ambos modelos, `classification_report` y matriz de confusión del mejor.
- [ ] **Lectura de negocio** (3–5 líneas): qué error es el más caro en tu caso y qué modelo recomiendas por ahora.

</div>

!!! tip "Para la tutoría del jueves 5 de noviembre"
    Lleva el notebook con la auditoría y el baseline funcionando, y **una pregunta concreta** (p. ej. "¿cómo
    tratamos las reseñas con sarcasmo?" o "¿nuestra red sobreajusta?"). Recibirás un semáforo 🟢🟡🔴 de avance.

## 🧠 Resumen

| Concepto | La idea en una línea |
|---|---|
| Neurona | Suma ponderada de las entradas + sesgo, pasada por una activación. Con sigmoide = regresión logística. |
| Activación | La no linealidad (ReLU, tanh) que permite fronteras curvas; softmax en la salida multiclase. |
| Red multicapa (MLP) | Capas ocultas que combinan muchas "rectas" en fronteras de cualquier forma. |
| Entropía cruzada | −log(probabilidad de la clase correcta): castiga mucho equivocarse con seguridad. |
| Descenso de gradiente | Corregir los pesos dando pasos cuesta abajo en la pérdida. |
| Tasa de aprendizaje | El largo del paso: muy chica = lento; muy grande = rebota o diverge. |
| Época / batch | Una pasada completa por los datos / el grupo de ejemplos con que se da cada paso. |
| Sobreajuste | Validación empeora mientras entrenamiento mejora: la red memoriza. |
| Early stopping / dropout | Parar en la mejor época / apagar neuronas al azar al entrenar. |
| Auditoría y limpieza | Duplicados, textos basura y categorías mal escritas se corrigen **antes** de modelar. |
| TF-IDF | Peso alto a palabras frecuentes en el texto y raras en el resto. |
| F1 macro | Promedio simple del F1 de cada clase: las clases chicas importan igual. |
| Matriz de confusión con ojos de negocio | No todos los errores cuestan lo mismo; el umbral es una palanca de negocio. |

## 📚 Para profundizar

- **3Blue1Brown · ¿Qué es una red neuronal?** (video, con subtítulos en español): la mejor intuición visual de
  neuronas, capas y pesos. [youtube.com/watch?v=aircAruvnKk](https://www.youtube.com/watch?v=aircAruvnKk)
- **TensorFlow Playground:** el simulador del Tema 2 en versión extendida; prueba capas, activaciones, tasa de
  aprendizaje y regularización. [playground.tensorflow.org](https://playground.tensorflow.org/)
- **Google · Machine Learning Crash Course** (módulos de redes neuronales y clasificación):
  [developers.google.com/machine-learning/crash-course](https://developers.google.com/machine-learning/crash-course)
- **scikit-learn · Extracción de características de texto** (bolsa de palabras y TF-IDF, con ejemplos):
  [scikit-learn.org/stable/modules/feature_extraction.html](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction)
