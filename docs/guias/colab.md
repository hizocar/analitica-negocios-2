# 🧑‍💻 Guía de Google Colab

Todo el curso se trabaja en **Google Colab**: notebooks de Python en el navegador, sin instalar nada y con
GPU gratuita. Solo necesitas una cuenta de Google.

## 1. Abrir el notebook de una clase

Cada cápsula tiene un botón **▶ Abrir en Colab**. Se abre una copia de solo lectura; para guardar tus
cambios:

1. *Archivo → Guardar una copia en Drive*.
2. Renómbrala (por ejemplo, `Proyecto_FinTrust_equipo3.ipynb`).
3. Comparte la copia con tu equipo: *Compartir → agregar correos → Editor*.

!!! tip "Un notebook por equipo"
    Trabajen sobre **un solo notebook compartido** del proyecto y copien ahí lo que les sirva de los
    notebooks de cada clase. Colab no permite que dos personas ejecuten celdas a la vez sin pisarse:
    organícense por secciones.

## 2. Activar la GPU (clases 2, 3 y 4)

Calcular embeddings o usar modelos de Hugging Face es mucho más rápido con GPU:

*Entorno de ejecución → Cambiar tipo de entorno de ejecución → Acelerador de hardware: **T4 GPU***.

La GPU gratuita tiene un límite de uso diario. Si se agota, el notebook funciona igual en CPU, aunque más
lento. Por eso conviene **guardar los embeddings** con `np.save` y no recalcularlos cada vez.

## 3. Leer los datos

Los datos se leen directo desde GitHub, sin subir archivos:

```python
import pandas as pd

BASE = "https://raw.githubusercontent.com/hizocar/analitica-negocios-2/main/docs/datasets/"
CASO = "fintrust"   # o "mercasur"

archivo = "reclamos_fintrust.csv" if CASO == "fintrust" else "resenas_mercasur.csv"
df = pd.read_csv(BASE + archivo)
df.shape
```

Detalle de columnas en [Datasets](../datasets/datasets.md).

## 4. Instalar paquetes

Colab ya trae pandas, scikit-learn, Keras, PyTorch y Transformers. Si una celda dice que falta un paquete,
instálalo así (el `!` ejecuta un comando de sistema):

```python
!pip -q install -U sentence-transformers google-genai gradio
```

Si después de instalar algo aparece un error raro, usa *Entorno de ejecución → Reiniciar sesión* y vuelve
a ejecutar.

## 5. Antes de entregar

- [ ] *Entorno de ejecución → Reiniciar y ejecutar todo* corre **sin errores**.
- [ ] Cada sección parte con una celda de texto que explica qué se hace y qué se concluye.
- [ ] Los gráficos tienen título, ejes con nombre y una conclusión debajo.
- [ ] No hay claves de API escritas en el código (usa Secretos, ver [guía de Gemini](gemini.md)).
- [ ] La primera celda tiene los integrantes, el caso y el enlace de Colab.
- [ ] La última celda declara el uso de IA.

## 6. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `NameError: name 'df' is not defined` | Ejecutaste una celda sin correr las anteriores: *Ejecutar todas las celdas anteriores* (Ctrl+F8). |
| La sesión se desconecta | Colab se apaga tras un rato de inactividad: vuelve a ejecutar desde el inicio. Guarda resultados pesados en Drive o con `np.save`. |
| `CUDA out of memory` | Baja el `batch_size` o reinicia la sesión. |
| `429 RESOURCE_EXHAUSTED` en Gemini | Superaste el límite por minuto de la capa gratuita: espera un minuto, usa `time.sleep` entre llamadas y procesa muestras más chicas. |
| El notebook entregado no muestra resultados | Ejecuta todo antes de descargar el `.ipynb`: las salidas se guardan dentro del archivo. |
