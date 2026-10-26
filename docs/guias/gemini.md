# 🔑 Guía de la API de Gemini

En las clases 3 y 4 usamos un LLM a través de la **API de Gemini** (Google), porque tiene una **capa
gratuita** que alcanza para el proyecto y funciona directo en Colab. Haz esta configuración **una sola vez**
antes del Sprint 3.

## 1. Obtener la clave (2 minutos)

1. Entra a [Google AI Studio](https://aistudio.google.com/apikey) con tu cuenta de Google.
2. Presiona **Create API key** (Crear clave de API) y copia la clave.
3. **No la compartas ni la pegues en el notebook.** Quien tenga tu clave puede usarla a tu nombre.

!!! info "Si no puedes crear la clave"
    Algunas cuentas institucionales tienen AI Studio bloqueado: usa una cuenta personal de Gmail. Si aun
    así no puedes, avísalo en la tutoría. Los notebooks tienen un camino alternativo que no se cae sin
    clave, y te ayudaremos a resolverlo.

## 2. Guardarla en los Secretos de Colab

1. En Colab, abre el panel izquierdo y haz clic en el ícono de la **llave 🔑 (Secretos)**.
2. **Agregar un secreto nuevo** con el nombre `GEMINI_API_KEY` y pega la clave como valor.
3. Activa el interruptor **Acceso al notebook**.

Así el notebook lee la clave sin que quede escrita en el código:

```python
from google.colab import userdata

GEMINI_API_KEY = userdata.get("GEMINI_API_KEY")
```

## 3. Probar que funciona

```python
!pip -q install -U google-genai

from google import genai
from google.colab import userdata

client = genai.Client(api_key=userdata.get("GEMINI_API_KEY"))
MODELO = "gemini-2.5-flash"  # revisa el nombre vigente en la documentación (enlace abajo)

resp = client.models.generate_content(
    model=MODELO,
    contents="Clasifica este reclamo en una palabra: 'me cobraron dos veces la cuota'",
)
print(resp.text)
print("Tokens de entrada:", resp.usage_metadata.prompt_token_count)
print("Tokens de salida:", resp.usage_metadata.candidates_token_count)
```

Si imprime una respuesta, está todo listo. Los nombres de los modelos cambian con el tiempo: si aparece
un error de modelo no encontrado, revisa la lista vigente en
[ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) o lista los
disponibles con:

```python
for m in client.models.list():
    print(m.name)
```

## 4. Límites de la capa gratuita

La capa gratuita limita las **solicitudes por minuto y por día** (los valores actuales están en
[ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits)). Para el
proyecto:

- Trabaja con **muestras** (100–200 casos), no con los 6.000 textos.
- Pon una pausa entre llamadas (`time.sleep(4)`) y reintenta si aparece el error `429`.
- **Guarda los resultados** en un CSV apenas los obtengas, para no repetir llamadas si se reinicia la sesión.

```python
import time

def llamar_con_reintentos(prompt, intentos=4, espera=10):
    for i in range(intentos):
        try:
            return client.models.generate_content(model=MODELO, contents=prompt)
        except Exception as e:
            if "429" in str(e) and i < intentos - 1:
                time.sleep(espera * (i + 1))   # espera cada vez más
            else:
                raise
```

## 5. Privacidad: lee esto antes de enviar datos

!!! danger "Lo que envías a una API sale de tu computador"
    En la capa gratuita, Google puede usar lo que envías para mejorar sus productos (revisa los
    [términos de la API de Gemini](https://ai.google.dev/gemini-api/terms)). En una empresa real, enviar
    reclamos con RUT, teléfonos o nombres de clientes a una API externa sin resguardos puede infringir la
    ley de protección de datos personales.

    En el curso los datos son ficticios, pero practicamos como si fueran reales: **anonimiza antes de
    enviar** (lo vemos en la [Clase 3](../clases/clase3.md)).
