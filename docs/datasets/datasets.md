# 🗄️ Datasets

Datos **ficticios** creados para el curso con [`tools/generar_datos.py`](https://github.com/hizocar/analitica-negocios-2/blob/main/tools/generar_datos.py).
Son realistas y vienen **sucios a propósito**: duplicados, textos basura sin contenido (como «reclamo» u «ok»),
faltas de ortografía y frases repetidas dentro de un mismo texto, categorías escritas de varias formas, valores imposibles, errores de etiquetado (~6 %) y **datos personales falsos** (RUT, teléfonos,
correos y nombres) que deberás anonimizar antes de enviarlos a una API.

En Colab, léelos directo desde GitHub:

```python
import pandas as pd

BASE = "https://raw.githubusercontent.com/hizocar/analitica-negocios-2/main/docs/datasets/"
df = pd.read_csv(BASE + "reclamos_fintrust.csv")
```

## 🏦 Caso A · FinTrust (banco)

| Archivo | Filas | Descripción |
|---|:-:|---|
| [reclamos_fintrust.csv](reclamos_fintrust.csv) | 6.180 | Reclamos de clientes, dataset completo del proyecto |
| [reclamos_fintrust_muestra.csv](reclamos_fintrust_muestra.csv) | 1.500 | Muestra liviana para los ejercicios en el navegador |
| [politicas_fintrust.csv](politicas_fintrust.csv) | 10 | Manual de políticas internas (para RAG) |
| [preguntas_eval_fintrust.csv](preguntas_eval_fintrust.csv) | 18 | Preguntas de evaluación del asistente, con respuesta esperada y documento fuente |

| Columna | Tipo | Descripción |
|---|---|---|
| `id_reclamo` | texto | Identificador del reclamo |
| `fecha` | fecha | Fecha de ingreso (enero 2025 a junio 2026) |
| `canal` | categoría | App, Web, Call center, Sucursal o Redes sociales (⚠️ escritas de varias formas) |
| `producto` | categoría | Tarjeta de crédito, Cuenta corriente, Cuenta vista, Crédito de consumo, Crédito hipotecario, Seguros |
| `texto` | texto | Lo que escribió el cliente |
| `monto_reclamado` | número | Monto en pesos, cuando aplica (⚠️ hay negativos) |
| `dias_resolucion` | entero | Días que tomó resolverlo (⚠️ hay valores imposibles) |
| `categoria` | **etiqueta** | Fraude · Cobro indebido · App y canales digitales · Crédito y tasas · Atención al cliente · Información y trámites (⚠️ escritas de varias formas: unifícalas antes de entrenar) |
| `urgencia` | etiqueta | Alta · Media · Baja (⚠️ hay nulos) |

## 🛒 Caso B · MercaSur (retail online)

| Archivo | Filas | Descripción |
|---|:-:|---|
| [resenas_mercasur.csv](resenas_mercasur.csv) | 6.180 | Reseñas de clientes, dataset completo del proyecto |
| [resenas_mercasur_muestra.csv](resenas_mercasur_muestra.csv) | 1.500 | Muestra liviana para los ejercicios en el navegador |
| [politicas_mercasur.csv](politicas_mercasur.csv) | 8 | Políticas de despacho, devoluciones, garantía, pagos y más (para RAG) |
| [preguntas_eval_mercasur.csv](preguntas_eval_mercasur.csv) | 18 | Preguntas de evaluación del asistente, con respuesta esperada y documento fuente |

| Columna | Tipo | Descripción |
|---|---|---|
| `id_resena` | texto | Identificador de la reseña |
| `fecha` | fecha | Fecha de la reseña (marzo 2025 a agosto 2026) |
| `categoria_producto` | categoría | Tecnología, Electrohogar, Hogar, Moda, Deportes, Belleza (⚠️ mayúsculas inconsistentes) |
| `producto` | texto | Producto comprado |
| `canal_compra` | categoría | Web, App o Tienda |
| `precio_clp` | entero | Precio pagado (⚠️ hay ceros) |
| `rating` | número | Estrellas de 1 a 5 (⚠️ hay nulos y valores imposibles) |
| `texto` | texto | Lo que escribió el cliente |
| `aspecto` | **etiqueta** | Despacho · Calidad del producto · Precio · Atención · Devoluciones y garantía · Pago (⚠️ escritas de varias formas: unifícalas antes de entrenar) |

## 📚 Documentos para RAG

Cada política también está como archivo Markdown, por si quieres trocearla tú:

- FinTrust: [`docs_fintrust/`](https://github.com/hizocar/analitica-negocios-2/tree/main/docs/datasets/docs_fintrust) (FT-POL-01 a FT-POL-10)
- MercaSur: [`docs_mercasur/`](https://github.com/hizocar/analitica-negocios-2/tree/main/docs/datasets/docs_mercasur) (MS-POL-01 a MS-POL-08)

Los archivos `preguntas_eval_*.csv` traen una **pregunta trampa** (`doc_id = NINGUNO`) cuya respuesta no
está en los documentos: un buen asistente debe reconocer que no lo sabe.

!!! info "Datos para los ejercicios de las cápsulas"
    Algunas clases usan archivos derivados (por ejemplo, embeddings precalculados) con el prefijo
    `claseN_`. Los ejercicios del navegador los cargan automáticamente.
