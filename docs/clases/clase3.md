# Clase 3 · Transformers y LLMs

<div class="usm-session-meta">
<span>📅 Jueves 12 de noviembre de 2026</span>
<span>⏱️ Tutoría 18:30 – 19:30 · cápsula de ~3 h de autoestudio</span>
<span class="usm-tag-gold">Se aplica en el Sprint 3 · domingo 22 de noviembre</span>
</div>

!!! example "Cómo estudiar esta cápsula"
    Esta clase no tiene cátedra: la página está hecha para que la estudies sola o solo, a tu ritmo. Está ordenada en
    **6 temas**. Cada uno parte con una **pregunta guía**, explica la idea con un ejemplo de FinTrust o MercaSur y trae:

    - **Simuladores** (🔤 🌡️ 👀 🧩): muévelos *antes* de leer la explicación larga. Están hechos para que veas la idea.
    - **Código ▶ ejecutable**: los bloques de Python corren en tu navegador, sin instalar nada. La primera vez
      Python tarda unos 15 segundos en cargar. Puedes editar el código y cada bloque trae un **🎯 Reto**.
    - **✍️ Preguntas**: cada alternativa incorrecta te explica por qué no lo es. Equivocarse aquí es gratis.
    - **🧑‍💻 Notebook de Colab**: ahí usas modelos de verdad (Hugging Face y Gemini) sobre tu caso. Es la base
      del **Sprint 3**.

    **Para la tutoría del jueves 19 (clínica de LLM)**, trae: (1) tu prompt de clasificación escrito (rol, categorías, formato, ejemplos),
    (2) 3 respuestas del LLM que te hayan sorprendido y (3) tus dudas sobre la API de Gemini.

## 🎯 Objetivos

Al terminar esta cápsula podrás:

- Explicar qué es un **token**, por qué el costo y los límites de un LLM se miden en tokens y estimar cuánto cuesta
  procesar miles de reclamos.
- Entender que un LLM **predice la siguiente palabra** y cómo la **temperatura** controla cuán predecible es la respuesta.
- Describir con tus palabras la **atención**, la idea central del *transformer*, y distinguir modelos **encoder** (BERT)
  y **decoder** (GPT).
- Explicar cómo un modelo preentrenado se convierte en **asistente**, por qué **alucina** y qué cambia entre un modelo
  **abierto** y uno **cerrado** por API.
- Escribir **prompts de negocio** (zero-shot y few-shot) que devuelvan **JSON validable**.
- **Anonimizar** datos personales antes de enviarlos a una API y **evaluar a un LLM como clasificador** (F1, costo,
  latencia) frente a lo que construiste en los Sprints 1 y 2.

## 🗺️ Ruta de la cápsula

Haz clic en un tema para ir directo a él. Los tiempos son referenciales.

<ol class="econ-ruta">
<li><span class="econ-ruta-h">25 min</span><a class="econ-ruta-a" href="#tema-1"><span class="econ-ruta-n">1</span><span class="econ-ruta-t">Tokens: cómo «lee» un modelo</span><span class="econ-ruta-l">🔤 simulador · 🧪 Python · ✍️ 3 preguntas</span></a></li>
<li><span class="econ-ruta-h">30 min</span><a class="econ-ruta-a" href="#tema-2"><span class="econ-ruta-n">2</span><span class="econ-ruta-t">Un modelo de lenguaje predice la siguiente palabra</span><span class="econ-ruta-l">🌡️ simulador · 🧪 Python ×2 · ✍️ 3 preguntas</span></a></li>
<li><span class="econ-ruta-h">30 min</span><a class="econ-ruta-a" href="#tema-3"><span class="econ-ruta-n">3</span><span class="econ-ruta-t">Atención: el truco del transformer</span><span class="econ-ruta-l">👀 simulador · 🧪 Python · ✍️ 3 preguntas</span></a></li>
<li><span class="econ-ruta-h">20 min</span><a class="econ-ruta-a" href="#tema-4"><span class="econ-ruta-n">4</span><span class="econ-ruta-t">De modelo preentrenado a asistente</span><span class="econ-ruta-l">📖 lectura · ✍️ 3 preguntas</span></a></li>
<li><span class="econ-ruta-h">35 min</span><a class="econ-ruta-a" href="#tema-5"><span class="econ-ruta-n">5</span><span class="econ-ruta-t">Prompting para negocio</span><span class="econ-ruta-l">🧩 simulador · 🧪 Python ×2 · ✍️ 3 preguntas</span></a></li>
<li><span class="econ-ruta-h">40 min</span><a class="econ-ruta-a" href="#tema-6"><span class="econ-ruta-n">6</span><span class="econ-ruta-t">Anonimizar y evaluar al LLM como clasificador</span><span class="econ-ruta-l">🧪 Python ×2 · ✍️ 3 preguntas</span></a></li>
<li class="is-break"><span class="econ-ruta-h">⏭️</span><span class="econ-ruta-t">🧑‍💻 Notebook de Colab y Sprint 3</span></li>
</ol>

---

## Tema 1 · Tokens: cómo «lee» un modelo {#tema-1}

> **Pregunta guía:** si mañana FinTrust quiere clasificar sus 100.000 reclamos mensuales con un LLM, ¿cuánto le va a
> costar y de qué depende?

Tú lees letras y palabras. Un modelo de lenguaje no: lee **tokens**, que son trozos de texto. Las palabras muy comunes
suelen ser un solo token (`" la"`, `" banco"`), mientras que las largas o poco frecuentes se parten en varios
(`" cobr"` + `"aron"`). Piensa en el vocabulario del modelo como una caja de piezas de Lego: con piezas grandes armas
rápido las palabras frecuentes, y lo raro lo construyes con piezas chicas.

¿Por qué no usar letras sueltas o palabras completas?

- **Letras sueltas:** las secuencias serían larguísimas y el modelo tendría que aprender a deletrear todo.
- **Palabras completas:** el vocabulario sería gigante y no sabría qué hacer con una palabra nueva o mal escrita
  («tarjtea», «FinTruts»).
- **Subpalabras** (lo que se usa en la práctica): un vocabulario fijo de unas 30.000 a más de 250.000 piezas, aprendido de
  los textos de entrenamiento, con el que se puede escribir *cualquier* texto.

Esto tiene tres consecuencias directas para el negocio:

1. **Se cobra por token.** Los proveedores cobran por millón de tokens de **entrada** (tu prompt + el reclamo) y,
   más caro, por millón de tokens de **salida** (lo que el modelo escribe).
2. **El idioma importa.** El vocabulario se aprende sobre todo con texto en inglés, así que el español suele
   necesitar más piezas para decir lo mismo. En tokenizadores antiguos centrados en inglés (como el de GPT-2) la
   diferencia suele ser de 30 a 60 % o más; en los modernos y multilingües, para el español casi desaparece (sigue
   siendo grande en idiomas con poco texto en internet). En el notebook lo mides con tokenizadores reales.
3. **Hay un límite: la ventana de contexto.** Es el máximo de tokens que el modelo puede «tener a la vista» en una
   llamada (instrucciones + datos + respuesta). Hoy va desde unos miles hasta más de un millón de tokens según el
   modelo. Si te pasas, la API rechaza la llamada o hay que recortar el texto: lo que no cabe, el modelo no lo ve.

<div class="ia-widget" data-widget="c3-tokens"></div>

La cuenta del costo es una multiplicación:

$$
\text{costo por reclamo} = \frac{\text{tokens de entrada} \times p_{\text{entrada}} + \text{tokens de salida} \times p_{\text{salida}}}{1.000.000}
$$

donde \(p\) es el precio en US$ por millón de tokens. Una regla gruesa para estimar sin tokenizador: en inglés hay
~4 caracteres por token y en español entre 3 y 4, según el tokenizador (abajo usamos 3,5, un supuesto
conservador). Si quieres jugar con un tokenizador real, prueba el [tokenizador de OpenAI](https://platform.openai.com/tokenizer) con un reclamo en español y su traducción.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · ¿Cuánto cuesta leer todos los reclamos?</p>

Estimamos los tokens de cada reclamo de la muestra con la regla de ~3,5 caracteres por token y calculamos el costo
mensual de clasificar 100.000 reclamos.

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv")
textos = df["texto"].fillna("").astype(str)

# Regla gruesa: en español ≈ 1 token cada 3,5 caracteres (depende del tokenizador)
CHARS_POR_TOKEN = 3.5
tokens = (textos.str.len() / CHARS_POR_TOKEN).round()

print(f"Reclamos en la muestra: {len(textos)}")
print(f"Tokens por reclamo: promedio {tokens.mean():.0f} · mediana {tokens.median():.0f} · máximo {tokens.max():.0f}")

# Supuestos del costo (revisa los precios vigentes de tu proveedor)
PRECIO_IN = 0.30       # US$ por millón de tokens de entrada
PRECIO_OUT = 2.50      # US$ por millón de tokens de salida
INSTRUCCIONES = 300    # tokens fijos del prompt: rol, categorías, formato
SALIDA = 15            # tokens de la respuesta, p. ej. {"categoria": "Fraude"}
N_MES = 100_000        # reclamos por mes

tok_in = INSTRUCCIONES + tokens.mean()
costo_1 = (tok_in * PRECIO_IN + SALIDA * PRECIO_OUT) / 1e6

print(f"\nTokens de entrada por llamada: {tok_in:.0f} (de los cuales {INSTRUCCIONES} son instrucciones)")
print(f"Costo por reclamo: US$ {costo_1:.6f}")
print(f"Costo mensual ({N_MES:,} reclamos): US$ {costo_1 * N_MES:,.2f}")
print(f"El {INSTRUCCIONES / tok_in:.0%} de los tokens de entrada son instrucciones que se repiten en cada llamada")

plt.hist(tokens, bins=30, color="#005f96")
plt.title("¿Cuántos tokens tiene un reclamo?")
plt.xlabel("tokens (aprox.)")
plt.ylabel("reclamos");
```

**🎯 Reto:** un prompt *few-shot* con 12 ejemplos puede llegar a 1.200 tokens de instrucciones. Cambia `INSTRUCCIONES`
a 1200: ¿cuánto sube el costo mensual? ¿Y si además el modelo responde con una explicación de 150 tokens (`SALIDA`)?
{: .py-run-reto }

</div>

!!! tip "💼 En el negocio"
    Para clasificar reclamos, el costo en tokens suele ser **bajo** (del orden de 10 a 50 dólares al mes para 100.000
    casos con un modelo rápido) y lo que más pesa es **lo que repites en cada llamada**: instrucciones largas, muchos
    ejemplos o pedirle al modelo que «explique su razonamiento». Antes de presentar un piloto, haz esta cuenta con los precios
    vigentes y con tu prompt real. El costo que no aparece en la factura del proveedor (personas revisando errores,
    integración, gobierno de datos) suele ser mayor.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 1</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Por qué un mismo reclamo suele gastar más tokens en español que en inglés?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="El modelo no traduce internamente antes de procesar: trabaja directo con los tokens del texto que recibe.">Porque el modelo primero lo traduce al inglés y eso suma tokens.</button>
<button class="econ-quiz-opt" data-correct>Porque el vocabulario de tokens se aprendió con mucho más texto en inglés, así que las palabras en español se parten en más piezas.</button>
<button class="econ-quiz-opt" data-why="No se cobra por letra sino por token. El largo influye, pero la causa principal es qué tan bien cubre el vocabulario al idioma.">Porque los proveedores cobran por letra y el español usa más letras.</button>
</div>
<p class="econ-quiz-fb">✅ El tokenizador se entrena con textos donde domina el inglés: sus palabras frecuentes quedan como una sola pieza y las del español se arman con varias. Los tokenizadores multilingües modernos achican mucho esa brecha: en el notebook verás que con el de GPT-4o casi desaparece, mientras que con el de GPT-2 es grande.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Tu prompt tiene 400 tokens de entrada y el modelo responde 20 tokens. Con precios de US$ 0,30 (entrada) y US$ 2,50 (salida) por millón de tokens, ¿cuánto cuesta procesar 100.000 reclamos?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Revisa los ceros: 400 × 100.000 = 40 millones de tokens de entrada, que a US$ 0,30 por millón son US$ 12, no US$ 1,2.">Unos US$ 1,7.</button>
<button class="econ-quiz-opt" data-why="Ese sería el costo si cada reclamo usara 10 veces más tokens. Recalcula: 40 millones × 0,30 + 2 millones × 2,50.">Unos US$ 170.</button>
<button class="econ-quiz-opt" data-correct>Unos US$ 17.</button>
</div>
<p class="econ-quiz-fb">✅ Entrada: 400 × 100.000 = 40 millones de tokens × US$ 0,30 = US$ 12. Salida: 20 × 100.000 = 2 millones × US$ 2,50 = US$ 5. Total ≈ US$ 17. Fíjate que la salida es 20 veces más corta, pero aporta casi un tercio del costo.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Quieres pegar los 6.000 reclamos del año en un solo prompt para pedirle al LLM un resumen. ¿Qué es lo primero que te va a limitar?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="La temperatura controla cuán aleatoria es la respuesta, no cuánto texto cabe.">La temperatura del modelo.</button>
<button class="econ-quiz-opt" data-correct>La ventana de contexto: el máximo de tokens que el modelo puede ver en una llamada.</button>
<button class="econ-quiz-opt" data-why="El modelo no tiene un límite de «reclamos», tiene un límite de tokens. Lo que importa es cuántos tokens suman.">El número máximo de reclamos que acepta la API.</button>
</div>
<p class="econ-quiz-fb">✅ 6.000 reclamos × ~40 tokens ≈ 240.000 tokens, más instrucciones. Algunos modelos lo aceptan y otros no. Aunque quepa, sale caro y el modelo tiende a prestar menos atención a lo que queda «en el medio». Por eso se procesa por lotes o se busca solo lo relevante (eso es RAG, en la Clase 4).</p>
</div>
</div>

---

## Tema 2 · Un modelo de lenguaje predice la siguiente palabra {#tema-2}

> **Pregunta guía:** si un LLM «solo» predice la siguiente palabra, ¿cómo es que escribe respuestas completas? ¿Y por
> qué a veces responde distinto a la misma pregunta?

Piensa en el autocompletado del teclado de tu celular: escribes «me cobraron una» y te sugiere «comisión». Un
**modelo de lenguaje** hace exactamente eso, pero muchísimo mejor. Dado todo el texto anterior, calcula una
**probabilidad para cada token posible** de su vocabulario:

$$
P(\text{siguiente token} \mid \text{todo el texto anterior})
$$

Para escribir una respuesta completa repite un ciclo muy simple: **predecir → elegir un token → pegarlo al final →
volver a predecir**. Una respuesta de 50 tokens son 50 vueltas de este ciclo. Por eso los modelos «escriben» de a
poco en la pantalla y por eso la salida cuesta más que la entrada: los tokens de entrada se procesan todos juntos,
en una sola pasada, mientras que cada token de salida exige una pasada completa por el modelo.

El modelo de lenguaje más simple que existe es el de **bigramas**: mira solo la palabra anterior y cuenta, en un
montón de textos, qué palabra suele venir después. Es un buen punto de partida para entender la idea, y para ver
sus límites.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Un modelo de bigramas que inventa reclamos</p>

Contamos qué palabra sigue a cada palabra en los reclamos de FinTrust y usamos esas probabilidades para generar
reclamos nuevos, palabra por palabra.

```python
import pandas as pd, re, random
from collections import Counter, defaultdict

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv")
textos = df["texto"].dropna().astype(str).str.lower()

def palabras(t):
    t = re.sub(r"\$?\s?\d[\d.,]*", " MONTO ", t)       # todos los montos y números → "MONTO"
    return re.findall(r"MONTO|[a-záéíóúñü]+|[.,?!]", t)

# siguientes["me"]["cobraron"] = cuántas veces "cobraron" vino justo después de "me"
siguientes = defaultdict(Counter)
for t in textos:
    ws = ["<inicio>"] + palabras(t) + ["<fin>"]
    for a, b in zip(ws, ws[1:]):
        siguientes[a][b] += 1

# 1) La "predicción" del modelo: P(siguiente palabra | "cobraron")
c = siguientes["cobraron"]
total = sum(c.values())
print("P(siguiente | 'cobraron'):")
for w, n in c.most_common(5):
    print(f"   {w:<10} {n / total:.0%}")

# 2) Generar: elegir la siguiente palabra según esas probabilidades, una y otra vez
def generar(semilla, max_palabras=30):
    rnd = random.Random(semilla)
    w, salida = "<inicio>", []
    for _ in range(max_palabras):
        opciones = siguientes[w]
        w = rnd.choices(list(opciones), weights=list(opciones.values()))[0]
        if w == "<fin>":
            break
        salida.append(w)
    return " ".join(salida).replace(" .", ".").replace(" ,", ",").replace(" ?", "?")

print("\nReclamos «inventados» por el modelo de bigramas:")
for s in range(5):
    print(" •", generar(semilla=s))
```

**🎯 Reto:** cambia `"cobraron"` por `"tarjeta"` o `"app"`. Luego genera con otras semillas. ¿En qué momento los
reclamos inventados «pierden el hilo»? ¿Por qué un modelo que solo mira una palabra hacia atrás no puede mantener el tema?
{: .py-run-reto }

</div>

Los reclamos inventados suenan a FinTrust, pero mezclan temas sin sentido: el bigrama solo recuerda **una** palabra.
Un LLM moderno condiciona en **miles** de tokens anteriores (todo tu prompt) y en vez de contar pares usa una red
neuronal enorme. Pero el principio es el mismo: probabilidades del siguiente token.

### La temperatura: ¿siempre la favorita o a veces una sorpresa?

Una vez que el modelo tiene las probabilidades, falta **elegir** un token. La **temperatura** \(T\) controla cuán
«arriesgada» es esa elección. El modelo produce un puntaje \(z_i\) por cada token, y la probabilidad se calcula con
la función *softmax* (la misma que viste en la capa de salida de las redes de la Clase 1), dividiendo por \(T\):

$$
p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}
$$

- **\(T\) cercana a 0:** la diferencia entre puntajes se agranda y casi toda la probabilidad se va a la favorita.
  Con \(T = 0\) se elige siempre la más probable: **determinista**.
- **\(T = 1\):** las probabilidades «originales» del modelo.
- **\(T\) alta (1,5 a 2):** la distribución se aplana y palabras improbables tienen chance. Más creatividad, más riesgo.

<div class="ia-widget" data-widget="c3-temperatura"></div>

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Softmax con temperatura</p>

Tomamos las palabras que de verdad siguen a «una» en los reclamos, convertimos los conteos en puntajes y vemos cómo
la temperatura cambia las probabilidades y las muestras.

```python
import numpy as np, pandas as pd, re
from collections import Counter

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv")
c = Counter()
for t in df["texto"].dropna().astype(str).str.lower():
    ws = re.findall(r"[a-záéíóúñü]+", t)
    c.update(b for a, b in zip(ws, ws[1:]) if a == "una")

palabras, conteos = zip(*c.most_common(8))
z = np.log(np.array(conteos, dtype=float))     # puntajes del modelo (logits)

def softmax_T(z, T):
    if T == 0:                                 # T = 0: siempre la más probable
        p = np.zeros_like(z)
        p[np.argmax(z)] = 1.0
        return p
    e = np.exp((z - z.max()) / T)
    return e / e.sum()

tabla = pd.DataFrame({f"T = {T}": softmax_T(z, T) for T in [0, 0.5, 1, 2]}, index=palabras)
print("Probabilidad (%) de la palabra que sigue a «una»:\n")
print((tabla * 100).round(1).to_string())

rng = np.random.default_rng(0)
for T in [0, 1, 2]:
    muestras = rng.choice(palabras, size=8, p=softmax_T(z, T))
    print(f"\n8 muestras con T = {T}: " + " · ".join(muestras))
```

**🎯 Reto:** agrega `T = 5` a la tabla. ¿A qué distribución se parece? Si tu tarea es clasificar reclamos para un
reporte mensual, ¿qué temperatura usarías y por qué?
{: .py-run-reto }

</div>

!!! warning "⚠️ Error común"
    «Con temperatura 0 el modelo responde lo correcto». **No.** Con \(T = 0\) responde lo **más probable**, de forma
    (casi) repetible, y eso es lo que quieres para clasificar o extraer datos: el mismo reclamo debe recibir la misma
    categoría. Pero si el modelo está equivocado, se equivocará de forma consistente. La temperatura controla la
    **variabilidad**, no la **inteligencia**. (Además, en algunos proveedores incluso con \(T = 0\) puede haber
    pequeñas diferencias entre llamadas).

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 2</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Cuál es la descripción más precisa de lo que hace un LLM al generar una respuesta?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Los LLM no consultan una base de datos de respuestas: generan texto nuevo token a token. Por eso pueden inventar.">Busca la respuesta correcta en una base de datos gigante de textos.</button>
<button class="econ-quiz-opt" data-why="No decide la respuesta completa de antemano: genera de a un token, y cada token nuevo pasa a ser parte del contexto del siguiente.">Decide la respuesta completa y luego la escribe de una sola vez.</button>
<button class="econ-quiz-opt" data-correct>Calcula la probabilidad de cada posible siguiente token, elige uno, lo agrega al texto y repite.</button>
</div>
<p class="econ-quiz-fb">✅ Es un ciclo de «predecir → elegir → agregar». Todo lo que sabe hacer (responder, resumir, clasificar) sale de ese mecanismo, entrenado con cantidades enormes de texto.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Vas a clasificar 5.000 reclamos con un LLM para el reporte mensual de la gerencia. ¿Qué temperatura conviene?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-correct>0 o muy cercana a 0, para que el mismo reclamo reciba siempre la misma categoría.</button>
<button class="econ-quiz-opt" data-why="Una temperatura alta no hace al modelo más inteligente ni más cuidadoso: solo hace más probable que elija tokens poco probables. Para clasificar eso es ruido.">Alta (1,5 o más), para que el modelo piense más opciones.</button>
<button class="econ-quiz-opt" data-why="Variar la temperatura entre reclamos haría que dos reclamos iguales se clasificaran distinto según el orden. No hay ganancia.">Distinta para cada reclamo, para equilibrar.</button>
</div>
<p class="econ-quiz-fb">✅ En tareas con una respuesta correcta (clasificar, extraer campos) se busca consistencia. Las temperaturas altas sirven para tareas creativas, como proponer cinco versiones de un mensaje de disculpa.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">El modelo de bigramas generó: «me cobraron una comisión de la app se cae cada vez que me atiende». ¿Por qué mezcla temas?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Más datos mejorarían los conteos, pero el problema de fondo seguiría: el modelo solo mira una palabra hacia atrás.">Porque la muestra de 1.500 reclamos es muy chica.</button>
<button class="econ-quiz-opt" data-correct>Porque solo mira la palabra anterior: no recuerda que el reclamo empezó hablando de un cobro.</button>
<button class="econ-quiz-opt" data-why="La temperatura cambia cuán aleatoria es cada elección, pero aunque fuera 0, el bigrama seguiría sin «ver» el comienzo de la oración.">Porque la temperatura está muy alta.</button>
</div>
<p class="econ-quiz-fb">✅ Su «contexto» es de una palabra. El gran salto de los transformers es poder mirar todo el contexto a la vez y decidir qué partes importan. Eso es la atención (Tema 3).</p>
</div>
</div>

---

## Tema 3 · Atención: el truco del transformer {#tema-3}

> **Pregunta guía:** en «Bloqueé la tarjeta porque *la* clonaron», ¿cómo sabe el modelo que lo clonado es la tarjeta
> y no otra cosa?

En la Clase 2 cada texto se convertía en un vector (embedding). Pero una palabra aislada es ambigua: «banco» puede
ser el banco donde pagas la cuota o el banco de la plaza; «la» puede ser cualquier cosa femenina. El significado lo da
el **contexto**.

El **transformer** (presentado por Google en 2017 en el artículo *Attention Is All You Need*) resuelve esto con un
mecanismo llamado **atención**: cada palabra **mira a todas las demás** de la oración, decide cuánto le importa cada
una y actualiza su propio vector mezclando información de las que más le importan.

Una analogía de oficina: imagina una reunión donde cada palabra es una persona.

- Cada persona lleva una **pregunta** («soy un pronombre, ¿a quién me refiero?»). Eso es la *consulta* (query).
- Cada persona muestra una **etiqueta** con lo que ofrece («soy un objeto, sustantivo femenino»). Eso es la *clave* (key).
- Si la pregunta de una calza con la etiqueta de otra, le pone **mucha atención** y toma su **información** (el *valor*).

Después de la reunión, «la» ya no es un «la» genérico: su vector quedó muy parecido al de «tarjeta».

<div class="ia-widget" data-widget="c3-atencion"></div>

Esto explica algo que usaste sin saberlo: los modelos de `sentence-transformers` de la Clase 2 **son transformers**.
Por eso entendían que «me clonaron la tarjeta» y «cargos que no reconozco» están cerca: cada palabra se interpretó
según su contexto antes de promediar.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · La atención es álgebra: productos punto + softmax</p>

Con vectores de juguete de 4 dimensiones calculamos los pesos de atención de la oración, como lo hace una capa
de un transformer. Las matrices de consulta y clave las fijamos a mano; en un modelo real se aprenden.

```python
import numpy as np
import matplotlib.pyplot as plt

palabras = ["Bloqueé", "la", "tarjeta", "porque", "la₂", "clonaron"]
# Embeddings de juguete: [¿es un objeto?, ¿es una acción?, ¿es pronombre/artículo?, ¿es conector?]
E = np.array([
    [0.0, 1.0, 0.0, 0.0],   # Bloqueé
    [0.2, 0.0, 1.0, 0.0],   # la
    [1.0, 0.0, 0.0, 0.0],   # tarjeta
    [0.0, 0.0, 0.0, 1.0],   # porque
    [0.2, 0.0, 1.0, 0.0],   # la₂
    [0.0, 1.0, 0.0, 0.0],   # clonaron
])
# W_q convierte cada palabra en una "pregunta"; W_k en una "etiqueta"
W_q = np.array([[0, 3, 0, 0],    # un objeto pregunta: ¿qué acción me afecta?
                [3, 0, 0, 0],    # una acción pregunta: ¿sobre qué objeto?
                [4, 0, 0, 0],    # un pronombre pregunta: ¿a qué objeto me refiero?
                [0, 3, 0, 0]])   # un conector pregunta: ¿qué acciones conecto?
W_k = np.eye(4)                  # la etiqueta muestra lo que la palabra es

Q, K, V = E @ W_q, E @ W_k, E                      # (en un modelo real, V también pasa por una matriz W_v)
d_k = K.shape[1]                                     # dimensión de las claves (aquí 4)
puntajes = Q @ K.T / np.sqrt(d_k)                    # ¿cuánto calza cada pregunta con cada etiqueta?
A = np.exp(puntajes) / np.exp(puntajes).sum(axis=1, keepdims=True)   # softmax por fila

print("Atención de «la₂»:", " · ".join(f"{w} {a:.0%}" for w, a in zip(palabras, A[4])))
nuevo = A @ V                                        # cada palabra mezcla la información que atendió
print("«la₂» antes :", E[4].round(2), "→ después:", nuevo[4].round(2), "(ganó dimensión 'objeto')")

fig, ax = plt.subplots(figsize=(5.5, 4.5))
ax.imshow(A, cmap="Blues")
ax.set_xticks(range(6), palabras, rotation=45)
ax.set_yticks(range(6), palabras)
for i in range(6):
    for j in range(6):
        ax.text(j, i, f"{A[i, j]:.2f}", ha="center", va="center", fontsize=8,
                color="white" if A[i, j] > 0.4 else "black")
ax.set_title("Pesos de atención (fila mira a columna)")
plt.tight_layout()
```

**🎯 Reto:** cambia el 4 de la fila del pronombre en `W_q` por un 1. ¿Qué pasa con la atención de «la₂» hacia
«tarjeta»? Luego intenta que «porque» mire más a «clonaron» que a «Bloqueé» cambiando solo `W_q`. ¿Por qué es
imposible? (Pista: compara sus filas en `E`. Lo que falta es información de **posición**, que verás más abajo).
{: .py-run-reto }

</div>

??? info "Para curiosos: la fórmula de la atención"
    En notación matricial, una capa de atención calcula:

    $$
    \text{Atención}(Q, K, V) = \text{softmax}\!\left(\frac{Q K^\top}{\sqrt{d_k}}\right) V
    $$

    \(Q K^\top\) son los productos punto entre preguntas y etiquetas (la similitud que viste en la Clase 2). La
    división por \(\sqrt{d_k}\) (\(d_k\) es el largo de cada vector clave) evita puntajes gigantes que harían que el
    softmax pusiera casi todo el peso en una sola palabra. El softmax convierte cada fila en pesos que suman 1, y la
    multiplicación por \(V\) mezcla la información. Un modelo real usa varias «cabezas» de atención en paralelo (cada
    una se especializa en algo: sintaxis, referencias, temas…) y apila decenas de capas.

### El transformer completo, a vista de pájaro

<div class="ia-flow">
<div class="ia-flow-step"><strong>1 · Tokens</strong>El texto se parte en fichas (Tema 1).</div>
<div class="ia-flow-step"><strong>2 · Embeddings + posición</strong>Cada ficha se vuelve un vector, y se le suma información de su posición.</div>
<div class="ia-flow-step is-on"><strong>3 · Capas de atención</strong>Cada vector mira a los demás y se actualiza (y pasa por una red densa como la de la Clase 1). Se repite N veces.</div>
<div class="ia-flow-step is-done"><strong>4 · Salida</strong>Probabilidad del siguiente token (decoder) o un vector que representa el texto (encoder).</div>
</div>

¿Por qué hace falta la **posición**? Porque la atención, por sí sola, mira a todas las palabras «a la vez» y no sabe
en qué orden venían: «el cliente demandó al banco» y «el banco demandó al cliente» tendrían las mismas palabras.
Sumar un vector de posición a cada token arregla eso.

Con estas piezas se arman dos grandes familias:

<div class="c3-small" markdown>

| | **Encoder** (familia BERT) | **Decoder** (familia GPT) |
|---|---|---|
| Cómo lee | Toda la oración a la vez, hacia la izquierda y la derecha | Solo lo anterior, de izquierda a derecha |
| Entrenado para | Adivinar palabras tapadas en medio del texto | Predecir el siguiente token |
| Sirve para | **Entender**: clasificar, embeddings, buscar | **Generar**: responder, resumir, extraer en JSON |
| Ejemplos | BERT, mDeBERTa (lo usas en el notebook), los `sentence-transformers` de la Clase 2 | GPT, Gemini, Claude, Llama |
| Tamaño y costo típico | Cientos de millones de parámetros: corre en tu notebook | Miles de millones: normalmente por API |

</div>

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 3</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">En «Bloqueé la tarjeta porque la clonaron», ¿qué logra la atención con la segunda «la»?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="La atención no borra palabras: todas siguen ahí. Lo que cambia es el vector de cada una.">La elimina, porque los artículos no aportan significado.</button>
<button class="econ-quiz-opt" data-correct>Le da mucho peso a «tarjeta», de modo que el vector de «la» pasa a contener información de «tarjeta».</button>
<button class="econ-quiz-opt" data-why="La atención no copia la palabra anterior ni mira solo hacia atrás una posición; eso se parece más al bigrama del Tema 2.">La reemplaza por la palabra inmediatamente anterior, «porque».</button>
</div>
<p class="econ-quiz-fb">✅ Después de la capa de atención, el vector de «la» es una mezcla ponderada que se parece mucho al de «tarjeta». Así el modelo «sabe» a qué se refiere el pronombre.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">FinTrust quiere clasificar 50.000 reclamos diarios, tiene 5.000 reclamos etiquetados y un presupuesto ajustado. ¿Qué familia de modelos tiene más sentido como primera opción?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Un decoder grande por API funciona, pero para una tarea de «entender» con muchos datos etiquetados y alto volumen suele ser más caro y lento que necesario.">Un decoder grande (tipo GPT o Gemini) por API para cada reclamo.</button>
<button class="econ-quiz-opt" data-why="Los bigramas no capturan contexto: su calidad sería muy inferior a la del TF-IDF que ya hiciste en el Sprint 1.">Un modelo de bigramas entrenado con los reclamos.</button>
<button class="econ-quiz-opt" data-correct>Un encoder (o embeddings de uno, como en la Clase 2) más un clasificador entrenado con los 5.000 ejemplos.</button>
</div>
<p class="econ-quiz-fb">✅ Los encoders son buenos para entender, son baratos de correr y aprovechan los datos etiquetados. Los decoders brillan cuando hay pocos datos etiquetados, categorías nuevas o hay que generar/extraer texto. Esta comparación es justo la que harás en el Sprint 3.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Por qué el transformer necesita sumar información de posición a cada token?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-correct>Porque la atención compara todos los tokens a la vez y, sin posición, «el banco demandó al cliente» y «el cliente demandó al banco» se verían iguales.</button>
<button class="econ-quiz-opt" data-why="La posición no tiene que ver con el costo: se cobra por número de tokens, no por dónde están.">Porque así el proveedor puede cobrar distinto según la posición.</button>
<button class="econ-quiz-opt" data-why="El largo máximo lo fija la ventana de contexto; la codificación de posición existe para que el modelo sepa el orden.">Para saber cuándo se acabó la ventana de contexto.</button>
</div>
<p class="econ-quiz-fb">✅ La atención es un promedio ponderado, y los promedios no saben de orden. La codificación de posición le devuelve al modelo la noción de «quién va antes de quién».</p>
</div>
</div>

---

## Tema 4 · De modelo preentrenado a asistente {#tema-4}

> **Pregunta guía:** si el modelo solo aprendió a predecir la siguiente palabra en textos de internet, ¿cómo termina
> siguiendo instrucciones como «clasifica este reclamo y responde en JSON»?

Un asistente como Gemini, ChatGPT o Claude pasa por tres etapas de entrenamiento:

<div class="ia-flow">
<div class="ia-flow-step"><strong>1 · Preentrenamiento</strong>Predecir el siguiente token en billones de tokens de texto. Aprende idioma, datos del mundo y estilos. Es lo más caro (meses, miles de GPUs).</div>
<div class="ia-flow-step"><strong>2 · Ajuste por instrucciones</strong>Se entrena con miles de ejemplos «instrucción → buena respuesta» escritos por personas. Aprende a <em>obedecer</em> en vez de solo continuar texto.</div>
<div class="ia-flow-step"><strong>3 · Preferencias humanas (RLHF)</strong>Personas comparan dos respuestas y eligen la mejor; el modelo aprende a preferir respuestas útiles, honestas y seguras.</div>
<div class="ia-flow-step is-done"><strong>Asistente</strong>Sigue instrucciones, conversa y respeta formatos… la mayor parte del tiempo.</div>
</div>

Un ejemplo de la diferencia: si a un modelo **solo preentrenado** le escribes «¿Cuál es el plazo para desconocer una
compra en FinTrust?», es muy posible que continúe con *otras preguntas* («¿Cómo bloqueo mi tarjeta? ¿Dónde está mi
sucursal?…»), porque en internet las preguntas suelen venir en listas de preguntas frecuentes. El ajuste por
instrucciones es lo que le enseña que, ante una pregunta, se responde.

### Por qué alucinan

El modelo fue entrenado para producir texto **plausible**, no para verificar si es **verdadero**. Cuando no sabe
algo (por ejemplo, la política interna de FinTrust, que nunca vio), la continuación más probable es una respuesta con
el tono correcto y datos inventados: «Tienes 30 días para desconocer la compra». Suena perfecto y puede ser falso.
A eso se le llama **alucinación**. Tres hechos que conviene tener presentes:

- **Fecha de corte:** el modelo solo sabe lo que había en sus datos hasta cierta fecha.
- **No tiene memoria entre llamadas:** cada llamada a la API parte de cero. Si quieres que use tus categorías, tu
  política o el historial de la conversación, tienes que enviarlos en el prompt, dentro de la ventana de contexto.
- **El remedio principal es darle la información:** pegar en el prompt los documentos relevantes y pedirle que
  responda solo con ellos. Eso es **RAG**, el tema de la Clase 4.

### ¿Modelo abierto o cerrado?

<div class="c3-small" markdown>

| | **Modelo abierto** (Hugging Face: Llama, Mistral, Qwen, Gemma, mDeBERTa…) | **Modelo cerrado por API** (Gemini, GPT, Claude) |
|---|---|---|
| Dónde corre | En tu computador o tus servidores | En los servidores del proveedor |
| Privacidad | Los datos no salen de la empresa | Los datos viajan al proveedor (revisa contrato y dónde se procesan) |
| Costo | Infraestructura propia (GPU), sin pago por token | Pago por token, sin infraestructura |
| Calidad | Muy buena en tareas acotadas; los mejores modelos grandes suelen ser cerrados | En general, la más alta en tareas difíciles |
| Control | Tú decides la versión: no cambia si no quieres | El proveedor actualiza o retira modelos |
| Latencia | Depende de tu hardware | Depende de la red y la carga del proveedor |

</div>

!!! tip "💼 En el negocio"
    Para un banco, la pregunta no es solo «¿qué modelo es mejor?», sino «¿qué datos puedo enviar y a quién?». En Chile,
    la nueva **Ley 21.719 de protección de datos personales**, que entra en vigencia el 1 de diciembre de 2026, exige
    justificar para qué se tratan los datos y usar solo los necesarios (lo verás con más detalle en la Clase 5). Un
    patrón muy común es: **anonimizar** y luego usar un modelo por API para tareas no críticas, o usar un **modelo abierto en servidores propios** cuando los
    datos no pueden salir de la empresa. En tu informe del Sprint 3, la privacidad es un criterio de decisión tan
    importante como el F1.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 4</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">Le preguntas a un LLM: «¿Cuántos días tengo para desconocer una compra en FinTrust?» y responde «30 días hábiles», con total seguridad. ¿Qué es lo más prudente concluir?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="La seguridad del tono no es evidencia: el modelo está entrenado para sonar fluido, sepa o no la respuesta.">Que es correcto, porque el modelo respondió sin dudar.</button>
<button class="econ-quiz-opt" data-correct>Que puede ser una alucinación: el modelo nunca vio la política de FinTrust, así que hay que darle el documento o verificarlo.</button>
<button class="econ-quiz-opt" data-why="Con temperatura 0 la respuesta sería la más probable, no necesariamente la verdadera. Si no conoce el dato, seguirá inventando, solo que siempre lo mismo.">Que basta con repetir la pregunta con temperatura 0 para confirmarlo.</button>
</div>
<p class="econ-quiz-fb">✅ FinTrust es ficticio, así que el modelo no puede conocer su política. Generó lo plausible. La solución es incluir la política en el prompt (RAG, Clase 4) y pedirle que diga «no sé» si no está en el documento.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Qué etapa del entrenamiento hace que el modelo responda a una instrucción en vez de simplemente continuar el texto?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="El preentrenamiento solo enseña a continuar texto plausible: no distingue entre una instrucción y cualquier otro texto.">El preentrenamiento con billones de tokens.</button>
<button class="econ-quiz-opt" data-why="La tokenización ocurre antes de todo y no tiene que ver con el comportamiento: es solo cómo se parte el texto.">La tokenización en subpalabras.</button>
<button class="econ-quiz-opt" data-correct>El ajuste por instrucciones (y luego el ajuste con preferencias humanas).</button>
</div>
<p class="econ-quiz-fb">✅ El ajuste por instrucciones le muestra miles de pares «instrucción → respuesta» y el ajuste con preferencias humanas lo empuja hacia respuestas útiles y seguras. El conocimiento viene del preentrenamiento; el «buen comportamiento», de las etapas siguientes.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">El área legal de FinTrust prohíbe que los textos de clientes salgan de los servidores del banco, incluso anonimizados. ¿Qué opción respeta esa regla?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Una API externa procesa los textos en los servidores del proveedor: los datos salen del banco, aunque el contrato sea bueno.">Usar la API del proveedor con mejor contrato de privacidad.</button>
<button class="econ-quiz-opt" data-correct>Usar un modelo abierto (por ejemplo, de Hugging Face) instalado en servidores del banco.</button>
<button class="econ-quiz-opt" data-why="La temperatura no tiene relación con dónde se procesan los datos.">Usar una API externa con temperatura 0.</button>
</div>
<p class="econ-quiz-fb">✅ Con un modelo abierto en infraestructura propia, los datos nunca salen del banco. El costo es mantener esa infraestructura y, a veces, aceptar algo menos de calidad que los mejores modelos cerrados.</p>
</div>
</div>

---

## Tema 5 · Prompting para negocio {#tema-5}

> **Pregunta guía:** ¿cómo le pides a un LLM que clasifique 100 reclamos de forma que puedas **procesar las respuestas
> con código** y **confiar** en ellas?

Un prompt de negocio no es una conversación: es una **especificación**. Debe ser tan clara que dos analistas
distintos, leyéndola, clasificarían igual. Tiene cinco piezas:

| Pieza | Para qué sirve | Ejemplo (FinTrust) |
|---|---|---|
| **Rol** | Fija el criterio y el tono | «Eres un analista de reclamos de FinTrust, un banco chileno.» |
| **Tarea** | Qué hacer, sin ambigüedad | «Clasifica el reclamo en UNA categoría.» |
| **Categorías permitidas** | Evita etiquetas inventadas; idealmente con una definición breve de cada una | «Fraude: cargos o transferencias que el cliente no reconoce…» |
| **Formato de salida** | Que un programa pueda leer la respuesta | «Responde solo con JSON: `{"categoria": "..."}`» |
| **Ejemplos** (opcional) | Enseñan a desempatar casos ambiguos | «"La app falló y me cobraron igual" → App y canales digitales» |

- **Zero-shot:** sin ejemplos. Más barato y rápido de escribir. Funciona sorprendentemente bien cuando las categorías
  son claras.
- **Few-shot:** con algunos ejemplos resueltos (típicamente 1 o 2 por categoría, o solo para los casos difíciles).
  Mejora los casos ambiguos y la consistencia del formato, pero **cada ejemplo se paga en cada llamada**.

<div class="ia-widget" data-widget="c3-prompt"></div>

### Salida estructurada: JSON con esquema

Pedir «responde en JSON» funciona casi siempre. Pero «casi siempre», con 10.000 reclamos, son decenas de respuestas
rotas. Las APIs modernas permiten entregar un **esquema** (qué campos, de qué tipo y qué valores permitidos) y el
modelo queda obligado a respetarlo. En el notebook lo harás con Gemini y una clase de **Pydantic**:

```python
from typing import Literal
from pydantic import BaseModel

class Clasificacion(BaseModel):
    categoria: Literal["Fraude", "Cobro indebido", "App y canales digitales",
                       "Crédito y tasas", "Atención al cliente", "Información y trámites"]
```

Aun con esquema, **valida siempre** lo que vuelve: la respuesta puede venir vacía, cortada o, si cambias de modelo o
proveedor, sin esquema. En el código de abajo practicas esa validación «a mano».

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Prompts zero-shot y few-shot con f-strings</p>

Armamos los dos tipos de prompt a partir de reclamos reales de la muestra y comparamos cuántos tokens (y cuánto
dinero) cuesta cada uno.

```python
import pandas as pd

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv")
CATEGORIAS = ["Fraude", "Cobro indebido", "App y canales digitales",
              "Crédito y tasas", "Atención al cliente", "Información y trámites"]
LISTA = "\n".join(f"- {c}" for c in CATEGORIAS)

def prompt_zero_shot(reclamo):
    # Ojo: dentro de un f-string, las llaves literales del JSON se escriben dobles {{ }}
    return f"""Eres un analista de reclamos de FinTrust, un banco chileno.
Clasifica el reclamo en UNA de estas categorías:
{LISTA}
Responde SOLO con un JSON de la forma {{"categoria": "<categoría>"}}.

Reclamo: \"\"\"{reclamo}\"\"\""""

# Ejemplos few-shot: 1 por categoría, tomados de reclamos ya etiquetados (¡nunca del set de test!)
limpios = df[df["categoria"].isin(CATEGORIAS) & df["texto"].str.len().between(50, 110)]
ejemplos = limpios.groupby("categoria").head(1)

def prompt_few_shot(reclamo):
    bloque = "\n".join(f'Reclamo: "{r.texto.strip()}" → {{"categoria": "{r.categoria}"}}'
                       for r in ejemplos.itertuples())
    return prompt_zero_shot(reclamo).replace("\n\nReclamo:", f"\n\nEjemplos:\n{bloque}\n\nReclamo:")

reclamo = df.loc[df["id_reclamo"] == "FT-102560", "texto"].iloc[0]
p0, p1 = prompt_zero_shot(reclamo), prompt_few_shot(reclamo)
print(p1)

tok = lambda s: round(len(s) / 3.5)        # aproximación del Tema 1
for nombre, p in [("zero-shot", p0), ("few-shot", p1)]:
    costo_100k = tok(p) * 0.30 / 1e6 * 100_000
    print(f"\n{nombre:<9}: ~{tok(p)} tokens de entrada → US$ {costo_100k:.2f} por 100.000 reclamos (solo la entrada)")
```

**🎯 Reto:** agrega una **definición** de una línea a cada categoría (por ejemplo, «Fraude: cargos o transferencias que
el cliente no reconoce»). ¿Cuántos tokens suma? ¿En qué casos crees que ayudaría más que un ejemplo?
{: .py-run-reto }

</div>

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Validar las respuestas del modelo</p>

Estas 12 respuestas **simuladas** imitan errores reales de un LLM: JSON envuelto en «```», texto de más, categorías
en minúscula, categorías inventadas y JSON cortado. Las validamos y medimos el acierto contra las etiquetas.

````python
import json, re, unicodedata
import pandas as pd

CATEGORIAS = ["Fraude", "Cobro indebido", "App y canales digitales",
              "Crédito y tasas", "Atención al cliente", "Información y trámites"]

def clave(s):   # "Crédito y Tasas " → "credito y tasas"
    s = unicodedata.normalize("NFD", str(s).strip().lower())
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
CANON = {clave(c): c for c in CATEGORIAS}
CANON.update({"cobros indebidos": "Cobro indebido"})

# Respuestas crudas (simuladas) de un LLM para 12 reclamos reales de la muestra
respuestas = {
    "FT-105331": '{"categoria": "Cobro indebido"}',
    "FT-102225": '{"categoria": "Fraude", "confianza": "alta"}',
    "FT-102591": '```json\n{"categoria": "App y canales digitales"}\n```',
    "FT-102863": '{"categoria": "Atención al cliente"}',
    "FT-100562": '{"categoria": "Información y trámites"}',
    "FT-101712": '{"categoria": "Crédito y tasas"}',
    "FT-102560": '{"categoria": "Cobro indebido"}',
    "FT-103940": '{"categoria": "fraude"}',
    "FT-104709": '{"categoria": "Problemas de acceso"}',
    "FT-100746": '{"categoria": "Información y trámites"}',
    "FT-103564": '{"categoria": "Atención al cliente"',
    "FT-100797": 'Claro, aquí va: {"categoria": "Crédito y tasas"}',
}

def validar(crudo):
    """Devuelve (categoria_valida, problema)."""
    m = re.search(r"\{.*\}", crudo, flags=re.S)          # rescata el {...} aunque venga con texto alrededor
    if not m:
        return None, "JSON roto o cortado" if "{" in crudo else "sin JSON"
    try:
        datos = json.loads(m.group(0))
    except json.JSONDecodeError:
        return None, "JSON roto"
    cat = CANON.get(clave(datos.get("categoria", "")))
    if cat is None:
        return None, f"categoría inventada: {datos.get('categoria')!r}"
    return cat, "ok" if m.group(0) == crudo.strip() else "ok (había que limpiar)"

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv").set_index("id_reclamo")
filas = []
for id_, crudo in respuestas.items():
    cat, problema = validar(crudo)
    real = CANON.get(clave(df.loc[id_, "categoria"]))
    filas.append({"id": id_, "etiqueta": real, "llm": cat, "validación": problema, "acierto": cat == real})

res = pd.DataFrame(filas)
print(f"Respuestas válidas: {res['llm'].notna().mean():.0%}")
print(f"Accuracy (inválidas cuentan como error): {res['acierto'].mean():.0%}")
res
````

**🎯 Reto:** mira el caso `FT-100746`: el «error» del LLM, ¿es del modelo o de la etiqueta? Imprime su texto con
`df.loc["FT-100746", "texto"]`. Luego cambia `validar` para que una categoría inventada se reintente en vez de
descartarse: ¿qué le dirías al modelo en el reintento?
{: .py-run-reto }

</div>

!!! warning "⚠️ Error común"
    Sacar los ejemplos *few-shot* del **set de test**. Si el reclamo que usaste como ejemplo también está entre los que
    evalúas, el modelo «se sabe la respuesta» y tu F1 queda inflado: es la misma fuga de información que evitabas en
    el Sprint 1 al no entrenar con el test. Los ejemplos salen **siempre** del set de entrenamiento. Y otra trampa:
    ajustar el prompt mirando los errores del test hasta que mejore. Para iterar el prompt usa un set de
    **validación** aparte, y el test solo al final.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 5</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Cuál es la diferencia entre un prompt zero-shot y uno few-shot?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Ambos usan el mismo modelo ya entrenado: ninguno de los dos reentrena al modelo. Los ejemplos solo viajan dentro del prompt.">El few-shot reentrena el modelo con algunos ejemplos; el zero-shot no.</button>
<button class="econ-quiz-opt" data-correct>El few-shot incluye en el prompt algunos ejemplos resueltos; el zero-shot solo da instrucciones.</button>
<button class="econ-quiz-opt" data-why="La temperatura es independiente del tipo de prompt.">El zero-shot usa temperatura 0 y el few-shot una temperatura mayor.</button>
</div>
<p class="econ-quiz-fb">✅ Los ejemplos «enseñan» dentro del prompt, sin cambiar los parámetros del modelo. Por eso cuestan tokens en cada llamada y por eso deben venir del set de entrenamiento.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">El modelo responde <code>{"categoria": "Problemas de acceso"}</code>, que no está en tu lista. ¿Qué haces?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="Aceptarla rompe tus reportes: aparecería una séptima categoría que nadie definió y que no puedes comparar con las etiquetas.">La aceptas: el modelo sabe más categorías que tú.</button>
<button class="econ-quiz-opt" data-why="Asignar una categoría por defecto esconde el problema y sesga los resultados hacia esa categoría.">La reemplazas por «Información y trámites», que es la más genérica.</button>
<button class="econ-quiz-opt" data-correct>La marcas como inválida (o reintentas) y la cuentas en la tasa de respuestas inválidas; además, usas un esquema con valores permitidos.</button>
</div>
<p class="econ-quiz-fb">✅ Las respuestas inválidas son parte del desempeño del sistema y deben reportarse. Con un esquema (<code>Literal</code> en Pydantic) el modelo queda restringido a tus categorías, pero igual conviene validar.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Tu prompt few-shot mejoró el F1 de 0,84 a 0,88, pero ahora tiene 4 veces más tokens. ¿Cómo lo presentarías a la gerencia?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-correct>Como una decisión de costo-beneficio: cuánto cuesta cada punto de F1 extra en dólares al mes y cuántos reclamos mal clasificados se evitan.</button>
<button class="econ-quiz-opt" data-why="Ocultar el costo impide que la gerencia decida bien. Un aumento de 4 veces puede ser irrelevante o decisivo según el volumen.">Solo como una mejora de 4 puntos de F1, que es lo que importa.</button>
<button class="econ-quiz-opt" data-why="Descartar sin hacer la cuenta tampoco es correcto: si el costo total es bajo, la mejora puede valer la pena.">Como un fracaso, porque el costo subió más que el F1.</button>
</div>
<p class="econ-quiz-fb">✅ Si esos cuatro puntos se traducen en ~4 % más de aciertos, en 100.000 reclamos son ~4.000 reclamos mejor clasificados al mes. Si eso cuesta US$ 30 más, probablemente vale la pena; si cuesta US$ 3.000, hay que pensarlo. Haz la cuenta.</p>
</div>
</div>

---

## Tema 6 · Antes de enviar datos a una API: anonimizar, y evaluar al LLM {#tema-6}

> **Pregunta guía:** ¿qué datos de tus clientes estás a punto de enviar a otra empresa? Y cuando el LLM responde,
> ¿cómo sabes si es mejor que lo que ya tenías?

### Anonimizar: minimizar lo que sale de la empresa

Revisa los reclamos de FinTrust y verás frases como «Mi RUT es 16.113.376-3», «Pueden llamarme al +56 9 3704 8204» o
«Atte. Joaquín Sepúlveda». (Son datos **falsos**, generados para el curso, pero en una empresa real serían de personas
reales). Para clasificar el reclamo, **el modelo no necesita nada de eso**. El principio es **minimización de datos**:
envía solo lo necesario para la tarea.

La técnica más simple es **enmascarar** con expresiones regulares: reemplazar cada dato personal por una etiqueta.

| Antes | Después |
|---|---|
| «…no me devuelven el dinero. Mi RUT es 16.113.376-3.» | «…no me devuelven el dinero. Mi RUT es [RUT].» |
| «Escríbanme a catalina.soto30@yahoo.es.» | «Escríbanme a [CORREO].» |

Se reemplaza por una etiqueta en vez de borrar porque así el texto conserva su estructura y el modelo entiende que
ahí había un dato. Si guardas una tabla para revertir el reemplazo (por ejemplo, para contactar al cliente), eso se
llama **seudonimización**, y esa tabla también es un dato sensible.

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · Detectar y enmascarar datos personales</p>

Buscamos RUT, teléfonos, correos y nombres con expresiones regulares, los reemplazamos por etiquetas y contamos
cuántos reclamos tenían datos personales.

```python
import pandas as pd, re

df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv")
textos = df["texto"].fillna("").astype(str)

PATRONES = {
    # 16.113.376-3 (también con "..." por la suciedad del texto) o 16113376-3
    "RUT": r"\b\d{1,2}(?:\.+\d{3}){2}-[\dkK]\b|\b\d{7,8}-[\dkK]\b",
    # +56 9 3704 8204 · 56 9 37048204 · 9 3704 8204
    "TELEFONO": r"(?:\+?56\s*)?\b9\s*\d{4}\s*\d{4}\b",
    # nombre.apellido@dominio.com (y la versión sucia con "...")
    "CORREO": r"[\w.+-]+@[\w-]+(?:\.+[\w-]+)+",
}
# Nombres: difícil en general. Aquí aprovechamos la firma "Atte. Nombre Apellido"
FIRMA = re.compile(r"(atte\.?\s+)([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+)?)", flags=re.IGNORECASE)

def anonimizar(texto):
    encontrados = []
    for etiqueta, patron in PATRONES.items():
        texto, n = re.subn(patron, f"[{etiqueta}]", texto)
        encontrados += [etiqueta] * n
    texto, n = FIRMA.subn(r"\1[NOMBRE]", texto)
    encontrados += ["NOMBRE"] * n
    return texto, encontrados

resultado = textos.apply(anonimizar)
df["texto_anon"] = resultado.str[0]
df["pii"] = resultado.str[1]

con_pii = df["pii"].str.len() > 0
print(f"Reclamos con datos personales: {con_pii.sum()} de {len(df)} ({con_pii.mean():.1%})")
print("Por tipo:", pd.Series(df["pii"].sum()).value_counts().to_dict())

# Chequeo: ¿quedó algo con pinta de dato personal?
sospechosos = df["texto_anon"].str.contains(r"@|\d{7,}|\+56", regex=True)
print(f"Textos anonimizados con restos sospechosos: {sospechosos.sum()}")

pd.set_option("display.max_colwidth", 120)
df.loc[con_pii, ["texto", "texto_anon"]].head(6)
```

**🎯 Reto:** hay un texto con «restos sospechosos»: muéstralo con `df.loc[sospechosos, "texto_anon"]`. ¿Por qué se
escapó? Luego prueba `anonimizar("Soy Camila Rojas, mi rut es 12345678-5 y mi cel 987654321")`: ¿qué detecta y qué
se le escapa? ¿Un monto como «$16.113.376» se confunde con un RUT?
{: .py-run-reto }

</div>

!!! warning "⚠️ Error común"
    Creer que las expresiones regulares encuentran **todo**. Detectan bien formatos fijos (RUT, correo, teléfono),
    pero los nombres sueltos («hablé con la ejecutiva Fernanda»), las direcciones o los números de tarjeta escritos
    raro se escapan. En producción se combinan reglas con modelos de reconocimiento de entidades (NER) y se audita una
    muestra a mano. En tu informe, reporta cuántos casos detectaste **y** qué tipos de dato personal podrían quedar sin
    detectar.

### Evaluar al LLM como clasificador

Un LLM que clasifica es, al final, **un clasificador más**. Se evalúa igual que tu TF-IDF del Sprint 1 y tu
clasificador de embeddings del Sprint 2: **mismo set de test, mismas métricas**. Pero hay que sumar tres columnas
que antes casi no importaban:

| Métrica | Por qué importa con un LLM |
|---|---|
| **F1 macro** y matriz de confusión | La calidad, comparable con los sprints anteriores |
| **% de respuestas inválidas** | Un JSON roto o una categoría inventada es un error del sistema |
| **Costo por 1.000 casos** | \(1.000 \times (\text{tokens}_{in} \cdot p_{in} + \text{tokens}_{out} \cdot p_{out}) / 10^6\) |
| **Latencia** (mediana y percentil 95) | Un clasificador local tarda milisegundos; una API, cientos de milisegundos o segundos |
| **Datos etiquetados necesarios** | Para entrenar, el LLM zero-shot necesita 0 y el TF-IDF, miles (para evaluar, ambos necesitan el mismo test etiquetado) |

<div class="py-run" markdown>

<p class="py-run-t">🧪 Practica en Python · LLM vs. TF-IDF: calidad, costo y latencia</p>

Entrenamos de verdad el baseline TF-IDF + regresión logística y lo comparamos con un LLM zero-shot. Como en el
navegador no hay acceso a la API, las **predicciones del LLM están simuladas** (~88 % de acierto, con confusiones
típicas). Las reales las obtienes en el notebook de Colab.

```python
import numpy as np, pandas as pd, time, unicodedata
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score

CATEGORIAS = ["Fraude", "Cobro indebido", "App y canales digitales",
              "Crédito y tasas", "Atención al cliente", "Información y trámites"]
clave = lambda s: "".join(c for c in unicodedata.normalize("NFD", str(s).strip().lower())
                          if unicodedata.category(c) != "Mn")
CANON = {clave(c): c for c in CATEGORIAS} | {"cobros indebidos": "Cobro indebido"}

# Limpieza mínima (la misma idea del Sprint 1)
df = pd.read_csv(DATA + "reclamos_fintrust_muestra.csv").drop_duplicates()
df["categoria"] = df["categoria"].map(lambda c: CANON.get(clave(c)))
df = df[df["texto"].fillna("").str.strip().str.len() > 10].dropna(subset=["categoria"])
train, test = train_test_split(df, test_size=0.25, stratify=df["categoria"], random_state=42)

# A) Baseline real: TF-IDF + regresión logística
vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)
modelo = LogisticRegression(max_iter=1000).fit(vec.fit_transform(train["texto"]), train["categoria"])
t0 = time.perf_counter()
pred_tfidf = modelo.predict(vec.transform(test["texto"]))
lat_tfidf = (time.perf_counter() - t0) / len(test)

# B) LLM zero-shot SIMULADO: acierta ~88 %, confunde categorías vecinas y a veces responde algo inválido
rng = np.random.default_rng(7)
VECINA = {"Fraude": "Cobro indebido", "Cobro indebido": "Fraude", "App y canales digitales": "Cobro indebido",
          "Crédito y tasas": "Cobro indebido", "Atención al cliente": "Información y trámites",
          "Información y trámites": "Atención al cliente"}
pred_llm = [y if rng.random() < 0.88 else (VECINA[y] if rng.random() < 0.8 else "INVÁLIDA")
            for y in test["categoria"]]
lat_llm = rng.lognormal(np.log(0.9), 0.35, len(test))           # segundos por llamada
tok_in, tok_out = 320 + test["texto"].str.len() / 3.5, 12        # tokens por llamada

costo_1000 = 1000 * (tok_in.mean() * 0.30 + tok_out * 2.50) / 1e6
tabla = pd.DataFrame({
    "F1 macro": [f1_score(test["categoria"], pred_tfidf, average="macro"),
                 f1_score(test["categoria"], pred_llm, average="macro", labels=CATEGORIAS)],
    "% inválidas": [0.0, 100 * np.mean([p == "INVÁLIDA" for p in pred_llm])],
    "US$ por 1.000 casos": [0.0, costo_1000],
    "Latencia mediana (ms)": [1000 * lat_tfidf, 1000 * np.median(lat_llm)],
    "Latencia p95 (ms)": [1000 * lat_tfidf, 1000 * np.percentile(lat_llm, 95)],
    "Etiquetas usadas": [len(train), 0],
}, index=["TF-IDF + logística", "LLM zero-shot (simulado)"])

print("Matriz de confusión del LLM (filas = etiqueta real):")
print(pd.crosstab(test["categoria"], pd.Series(pred_llm, index=test.index, name="LLM")).to_string())
tabla.round(3)
```

**🎯 Reto:** el TF-IDF usó más de 1.000 reclamos etiquetados. Entrénalo solo con 60 (`train.sample(60, random_state=0)`)
y vuelve a mirar la tabla. ¿En qué escenario de negocio el LLM zero-shot pasa a ser la mejor opción?
{: .py-run-reto }

</div>

!!! tip "💼 En el negocio"
    La pregunta del Sprint 3 no es «¿el LLM es más inteligente?», sino **«¿cuándo conviene?»**. Como regla práctica:
    si tienes **miles de ejemplos etiquetados** y categorías estables, un clasificador clásico o sobre embeddings suele
    ganar en costo y latencia con calidad similar. El LLM gana cuando **no hay etiquetas** (un producto nuevo, una
    categoría nueva), cuando hay que **extraer** varios campos a la vez (monto, producto, urgencia, resumen) o cuando
    los textos son muy variados. Y en el **análisis de errores** busca casos donde el LLM «se equivocó» pero la
    etiqueta estaba mal: recuerda que los datos traen un ~6 % de etiquetas ruidosas.

<div class="econ-practica" markdown>
<p class="econ-practica-t"><span>✍️ Practica · Tema 6</span></p>
<div class="econ-quiz">
<p class="econ-quiz-q">¿Por qué es mejor reemplazar «16.113.376-3» por «[RUT]» que simplemente borrarlo?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="La etiqueta no permite recuperar el dato: «[RUT]» es igual para todos los clientes. Para recuperarlo necesitarías guardar una tabla aparte (seudonimización).">Porque así el modelo puede recuperar el RUT original si lo necesita.</button>
<button class="econ-quiz-opt" data-correct>Porque el texto conserva su estructura y el modelo entiende que ahí había un identificador, sin conocer el dato.</button>
<button class="econ-quiz-opt" data-why="Ahorrar tokens no es el objetivo; de hecho «[RUT]» puede ocupar más o menos tokens que el número. La razón es conservar el sentido sin exponer el dato.">Porque «[RUT]» ocupa menos tokens que el número.</button>
</div>
<p class="econ-quiz-fb">✅ «Mi RUT es [RUT]» sigue siendo una oración con sentido. Para clasificar el reclamo, el número exacto es irrelevante, así que no hay razón para enviarlo.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Tu regex detectó datos personales en el 7 % de los reclamos. ¿Qué afirmación es correcta?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-why="La regex solo encuentra lo que sabe buscar. Un 93 % «sin hallazgos» no prueba que no haya datos personales.">El 93 % restante no tiene datos personales: ya es seguro enviarlo.</button>
<button class="econ-quiz-opt" data-why="Las regex son útiles y baratas para formatos fijos; el punto es complementarlas y auditarlas, no descartarlas.">Las regex no sirven; hay que revisar todo a mano.</button>
<button class="econ-quiz-opt" data-correct>El 7 % es lo que la regex encontró; hay que auditar una muestra para estimar qué se le escapa (por ejemplo, nombres sin «Atte.»).</button>
</div>
<p class="econ-quiz-fb">✅ La detección tiene falsos negativos. Revisar a mano 50 o 100 textos «limpios» te da una estimación de cuánto se escapa, y eso va en tu informe de riesgos.</p>
</div>
<div class="econ-quiz">
<p class="econ-quiz-q">Con 1.000 reclamos etiquetados, el TF-IDF logra F1 = 0,92 y el LLM zero-shot F1 = 0,89, a US$ 0,15 por cada 1.000 casos y 1 segundo por caso. ¿Qué recomendación es más sólida para clasificar los reclamos del día a día?</p>
<div class="econ-quiz-opts">
<button class="econ-quiz-opt" data-correct>Usar el TF-IDF (o embeddings) para clasificar, y reservar el LLM para extracción de campos, categorías nuevas o casos dudosos.</button>
<button class="econ-quiz-opt" data-why="Ser más nuevo no lo hace mejor para esta tarea: aquí rinde un poco menos, cuesta más y es más lento.">Usar el LLM, porque es la tecnología más moderna.</button>
<button class="econ-quiz-opt" data-why="No hay que descartarlo: puede ser muy útil en las tareas donde no hay etiquetas o hay que extraer información.">Descartar los LLM para todo el proyecto.</button>
</div>
<p class="econ-quiz-fb">✅ Con datos etiquetados y una tarea estable, el modelo clásico gana en costo y latencia. El LLM aporta donde el clásico no llega. Una arquitectura combinada suele ser la mejor recomendación de negocio.</p>
</div>
</div>

---

## 🧑‍💻 Notebook de Colab {#notebook}

<div class="ia-colab" markdown>
<p>🧑‍💻 <strong>Notebook de la clase:</strong> tokenización real (español vs. inglés), clasificación zero-shot con un
modelo abierto de Hugging Face (mDeBERTa), y con <strong>Gemini</strong>: anonimización, clasificación zero-shot y
few-shot con salida estructurada (Pydantic), extracción de campos en JSON, F1 macro sobre ≥100 casos de test, tokens,
costo y latencia. Funciona para FinTrust y MercaSur, y si no tienes clave de Gemini salta esas celdas sin caerse.
Toma ~60–90 min (incluye unos 5–10 min de pausas entre las llamadas a la API).</p>
<a class="ia-colab-btn" href="https://colab.research.google.com/github/hizocar/analitica-negocios-2/blob/main/docs/notebooks/clase3_llms.ipynb" target="_blank" rel="noopener">▶ Abrir en Colab</a>
</div>

Para la parte de Gemini necesitas una clave gratuita de la API. Sigue la [guía de la API de Gemini](../guias/gemini.md)
y guárdala en los **Secretos** de Colab con el nombre `GEMINI_API_KEY`. Nunca pegues la clave dentro del código:
el buzón **rechaza** los notebooks que contienen una clave de API.

## 🔗 Conexión con tu proyecto (Sprint 3) {#sprint-3}

El **Sprint 3 se entrega el domingo 22 de noviembre a las 23:59 por buzón** ([abrir buzón](../proyecto/buzon.md)). Usa el notebook como base y adáptalo a tu
caso. Checklist de lo que debes entregar:

- [ ] **Anonimización** antes de llamar a la API: función aplicada a todos los textos enviados, cuántos casos tenían
      datos personales (por tipo) y qué podría escaparse.
- [ ] **Clasificación zero-shot** con un LLM sobre **≥100 casos del mismo set de test** de los Sprints 1 y 2, con
      salida estructurada (JSON con esquema).
- [ ] **Clasificación few-shot** con ejemplos tomados **solo del set de entrenamiento**, y comparación con zero-shot.
- [ ] **Extracción estructurada** en JSON de **al menos 4 campos** (por ejemplo: categoría, urgencia, producto, monto,
      si requiere contacto urgente y un resumen breve) sobre al menos 20 casos, con una revisión de qué tan bien extrae.
- [ ] **Tabla comparativa** contra el Sprint 2 (y el baseline del Sprint 1): F1 macro, % de respuestas inválidas,
      costo por 1.000 casos, latencia mediana y p95, datos etiquetados necesarios.
- [ ] **Análisis de errores**: matriz de confusión y al menos 5 errores comentados (¿error del modelo, caso ambiguo
      o etiqueta ruidosa?).
- [ ] **Conclusión de negocio** en 3–5 líneas, estilo piramidal: ¿cuándo conviene el LLM y cuándo no en tu caso?

## 🧠 Resumen

| Concepto | Idea en una línea |
|---|---|
| Token | Trozo de texto (subpalabra) que el modelo lee; la unidad de costo y de límite |
| Ventana de contexto | Máximo de tokens que el modelo ve en una llamada (prompt + respuesta) |
| Modelo de lenguaje | Estima la probabilidad del siguiente token y genera repitiendo «predecir → elegir → agregar» |
| Temperatura | Controla la variabilidad: T = 0 es repetible (clasificar); T alta es creativa (y riesgosa) |
| Atención | Cada palabra pondera a las demás para construir un significado según el contexto |
| Encoder vs. decoder | Encoder (BERT) para entender y clasificar; decoder (GPT, Gemini) para generar |
| Preentrenamiento → instrucciones → RLHF | De autocompletador a asistente que sigue instrucciones |
| Alucinación | Texto plausible pero falso; se mitiga dando la información en el prompt (RAG) |
| Prompt de negocio | Rol + tarea + categorías permitidas + formato + ejemplos |
| Zero-shot / few-shot | Sin ejemplos / con ejemplos en el prompt (del set de entrenamiento) |
| Salida estructurada | JSON con esquema (Pydantic) + validación de lo que vuelve |
| Anonimizar | Enmascarar datos personales antes de enviarlos: minimización de datos |
| Evaluar un LLM | F1 + % inválidas + costo por 1.000 + latencia, en el mismo test de siempre |

## 📚 Para profundizar

- Jay Alammar · [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) (en inglés): la
  explicación visual clásica de la atención, paso a paso.
- 3Blue1Brown · [Transformers, explicados visualmente](https://www.youtube.com/watch?v=wjZofJX0v4M) (video en inglés
  con subtítulos): tokens, embeddings y predicción del siguiente token con animaciones excelentes.
- Andrej Karpathy · [Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) (1 hora, en
  inglés): preentrenamiento, ajuste, alucinaciones y seguridad, para público general.
- Google · [Salida estructurada en la API de Gemini](https://ai.google.dev/gemini-api/docs/structured-output):
  la documentación oficial de lo que usas en el notebook.
