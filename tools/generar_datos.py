"""
Genera los datasets sintéticos del curso Analítica para los Negocios II.

Caso A · FinTrust: reclamos de clientes de un banco (texto en español).
Caso B · MercaSur: reseñas de un retail online (texto en español).

Cada caso trae además una base documental ficticia (políticas / FAQ) para RAG
y un set de preguntas de evaluación con su respuesta esperada.

Los datos vienen "sucios" a propósito: duplicados, nulos, categorías escritas
de distintas formas, valores imposibles, ruido de etiquetas y datos personales
FALSOS (RUT, teléfonos, correos) para discutir anonimización.

Uso:  python tools/generar_datos.py
"""
from __future__ import annotations

import random
import unicodedata
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 2026
OUT = Path(__file__).resolve().parents[1] / "docs" / "datasets"

rng = random.Random(SEED)
np_rng = np.random.default_rng(SEED)


# --------------------------------------------------------------------------
# Utilidades de ruido
# --------------------------------------------------------------------------
def quitar_tildes(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def typo(word: str) -> str:
    if len(word) < 5:
        return word
    i = rng.randrange(1, len(word) - 2)
    op = rng.choice(["swap", "drop", "dup"])
    if op == "swap":
        return word[:i] + word[i + 1] + word[i] + word[i + 2:]
    if op == "drop":
        return word[:i] + word[i + 1:]
    return word[:i] + word[i] + word[i:]


def ensuciar(texto: str) -> str:
    """Aplica ruido realista de escritura de clientes."""
    r = rng.random()
    if r < 0.18:
        texto = quitar_tildes(texto)
    if rng.random() < 0.12:
        texto = texto.lower()
    if rng.random() < 0.04:
        texto = texto.upper()
    if rng.random() < 0.20:
        palabras = texto.split()
        for _ in range(rng.randint(1, 2)):
            j = rng.randrange(len(palabras))
            palabras[j] = typo(palabras[j])
        texto = " ".join(palabras)
    if rng.random() < 0.06:
        texto = texto.replace(".", "...")
    if rng.random() < 0.05:
        texto = "  " + texto + "   "
    return texto


def rut_falso() -> str:
    n = rng.randint(6_000_000, 24_999_999)
    dv = rng.choice("0123456789K")
    s = f"{n:,}".replace(",", ".")
    return f"{s}-{dv}"


def telefono_falso() -> str:
    return f"+56 9 {rng.randint(1000, 9999)} {rng.randint(1000, 9999)}"


NOMBRES = ["Camila", "Matías", "Valentina", "Benjamín", "Javiera", "Tomás", "Francisca", "Diego",
           "Catalina", "Sebastián", "Fernanda", "Joaquín", "Constanza", "Felipe", "Antonia", "Ignacio"]
APELLIDOS = ["González", "Muñoz", "Rojas", "Díaz", "Pérez", "Soto", "Contreras", "Silva", "Martínez",
             "Sepúlveda", "Morales", "Rodríguez", "López", "Fuentes", "Hernández", "Torres"]


def correo_falso() -> str:
    n = quitar_tildes(rng.choice(NOMBRES)).lower()
    a = quitar_tildes(rng.choice(APELLIDOS)).lower()
    return f"{n}.{a}{rng.randint(1, 99)}@{rng.choice(['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.es'])}"


def pii_frase() -> str:
    tipo = rng.choice(["rut", "fono", "mail", "nombre"])
    if tipo == "rut":
        return rng.choice([f"Mi RUT es {rut_falso()}.", f"rut {rut_falso()}", f"(RUT {rut_falso()})"])
    if tipo == "fono":
        return rng.choice([f"Pueden llamarme al {telefono_falso()}.", f"mi fono es {telefono_falso()}"])
    if tipo == "mail":
        return f"Escríbanme a {correo_falso()}."
    return f"Atte. {rng.choice(NOMBRES)} {rng.choice(APELLIDOS)}."


def monto_clp() -> int:
    return int(round(np_rng.lognormal(10.6, 1.0), -2))


def fmt_monto(m: int) -> str:
    s = f"{m:,}".replace(",", ".")
    return rng.choice([f"${s}", f"$ {s}", f"{s} pesos", f"${s} CLP"])


def fecha_aleatoria(ini: date, fin: date) -> date:
    return ini + timedelta(days=rng.randrange((fin - ini).days + 1))


def armar(apertura: list[str], nucleo: str, detalle: list[str], cierre: list[str]) -> str:
    partes = []
    if rng.random() < 0.55:
        partes.append(rng.choice(apertura))
    partes.append(nucleo)
    if rng.random() < 0.6:
        partes.append(rng.choice(detalle))
    if rng.random() < 0.5:
        partes.append(rng.choice(cierre))
    return " ".join(p for p in partes if p)


# --------------------------------------------------------------------------
# Caso A · FinTrust · reclamos
# --------------------------------------------------------------------------
COMERCIOS = ["Falabella", "Ripley", "Lider", "Jumbo", "Uber", "Rappi", "Mercado Libre", "Netflix",
             "Spotify", "una bencinera", "Amazon", "AliExpress", "Temu", "Paris", "Sodimac", "Copec"]

FT_APERTURA = ["Hola,", "Buenas tardes,", "Estimados:", "Señores FinTrust:", "Buenos días.", "Hola buenas,",
               "Quiero dejar un reclamo formal.", "Escribo por segunda vez.", "Necesito ayuda urgente."]
FT_CIERRE = ["Espero una pronta respuesta.", "Gracias.", "Quedo atento.", "Saludos.",
             "Si no lo solucionan me cambio de banco.", "Esto es una vergüenza.", "Ojalá me ayuden.",
             "Voy a ir al SERNAC.", "Muchas gracias de antemano."]

FT_NUCLEOS = {
    "Fraude": [
        "Aparecen compras en {comercio} que yo no hice por {monto}.",
        "Me clonaron la tarjeta, hay cargos que no reconozco en {comercio}.",
        "Recibí un SMS supuestamente del banco, entré al link y ahora me sacaron {monto} de la cuenta.",
        "Me robaron la billetera y usaron mi tarjeta en {comercio} antes de que alcanzara a bloquearla.",
        "Hay {n} transacciones desconocidas en el extranjero, yo nunca he salido de Chile.",
        "Alguien hizo una transferencia de {monto} desde mi cuenta a un tercero que no conozco.",
        "Me llamaron haciéndose pasar por ejecutivos del banco y me pidieron la clave dinámica, creo que fue una estafa.",
        "Desconozco un cargo de {monto} en {comercio}, necesito que lo investiguen.",
    ],
    "Cobro indebido": [
        "Me cobraron dos veces la misma compra en {comercio} por {monto}.",
        "Me están cobrando una comisión de mantención que según mi contrato no corresponde.",
        "Aparece cobrado un seguro que nunca contraté por {monto} mensuales.",
        "Pagué la cuota del mes y igual me cobraron intereses por mora.",
        "Me cobraron {monto} de comisión por un avance que nunca pedí.",
        "Hice un reverso en {comercio} hace un mes y todavía no me devuelven el dinero.",
        "Cerré la tarjeta adicional y me siguen cobrando la mantención.",
        "El cobro del estado de cuenta no coincide con lo que compré, hay {monto} de diferencia.",
    ],
    "App y canales digitales": [
        "La app se cae cada vez que intento hacer una transferencia.",
        "No puedo iniciar sesión en la app, dice error de credenciales aunque la clave está bien.",
        "No me llega el código de la clave dinámica al celular.",
        "La página web queda cargando y no me deja pagar la tarjeta.",
        "Actualicé la aplicación y ahora no me aparecen mis productos.",
        "Intenté transferir {monto} y la app me dio error pero igual se descontó el saldo.",
        "La app me bloqueó el acceso después de un intento y no sé cómo desbloquearla.",
        "El chat de la app no responde, solo sale un mensaje automático.",
    ],
    "Crédito y tasas": [
        "Quiero prepagar mi crédito de consumo y me están cobrando una comisión muy alta.",
        "La tasa de interés que me aplicaron no es la que me ofrecieron al firmar.",
        "Necesito renegociar las cuotas de mi crédito porque quedé sin trabajo.",
        "Me rechazaron el crédito hipotecario sin explicarme el motivo.",
        "Pedí una simulación de crédito por {monto} y el valor de la cuota cambió al firmar.",
        "No entiendo por qué la cuota de mi crédito subió este mes.",
        "Solicité postergar dos cuotas y no me han respondido.",
        "El CAE que aparece en el contrato es distinto al de la simulación.",
    ],
    "Atención al cliente": [
        "Llevo más de una hora esperando en el call center y nadie me atiende.",
        "La ejecutiva de la sucursal fue muy mal educada conmigo.",
        "Hice un reclamo hace 20 días y nadie me ha contactado.",
        "Cada vez que llamo me derivan a otra área y nadie resuelve.",
        "Fui tres veces a la sucursal por el mismo problema y siempre me dicen que vuelva otro día.",
        "Me prometieron una llamada de vuelta que nunca llegó.",
        "El ejecutivo me dio información equivocada y ahora tengo un problema mayor.",
        "Pésima atención, me cortaron la llamada dos veces.",
    ],
    "Información y trámites": [
        "Necesito un certificado de deuda para presentarlo en otra institución.",
        "Quiero cerrar mi cuenta corriente, ¿cuál es el procedimiento?",
        "¿Cómo puedo aumentar el cupo de mi tarjeta de crédito?",
        "Necesito actualizar mi dirección y no encuentro la opción en la web.",
        "Quisiera saber cuáles son los requisitos para abrir una cuenta para mi hijo.",
        "¿Dónde puedo descargar la cartola de los últimos seis meses?",
        "Quiero cambiar la fecha de pago de mi tarjeta.",
        "Necesito el certificado de intereses pagados para la declaración de renta.",
    ],
}

FT_DETALLES = {
    "Fraude": ["Ya bloqueé la tarjeta.", "Necesito que me devuelvan la plata.", "Hice la denuncia en Carabineros.",
               "Fue el {fecha}.", "No he compartido mis claves con nadie."],
    "Cobro indebido": ["Adjunto el comprobante.", "Revisen el estado de cuenta de {mes}.",
                       "Ya me pasó el mes pasado también.", "Exijo la devolución."],
    "App y canales digitales": ["Tengo un iPhone actualizado.", "Desde Android pasa lo mismo.",
                                "Ya desinstalé y reinstalé la app.", "Pasa desde el {fecha}."],
    "Crédito y tasas": ["Tengo todo al día.", "Soy cliente hace más de diez años.",
                        "Me parece abusivo.", "Necesito una respuesta formal por escrito."],
    "Atención al cliente": ["Tengo el número de atención.", "No es la primera vez.",
                            "Exijo hablar con un supervisor.", "Fue en la sucursal del centro."],
    "Información y trámites": ["Gracias por la información.", "Lo necesito antes del {fecha}.",
                               "No encuentro nada en la web.", "Soy cliente nuevo."],
}

# Frases "puente" que agregan ambigüedad entre categorías
FT_AMBIGUO = {
    "Fraude": "Además el call center no me contesta.",
    "Cobro indebido": "Y la app no me deja ver el detalle.",
    "App y canales digitales": "Encima me cobraron una comisión por la transferencia fallida.",
    "Crédito y tasas": "El ejecutivo no supo explicarme nada.",
    "Atención al cliente": "Todo esto por un cobro que no reconozco.",
    "Información y trámites": "La app tampoco muestra la opción.",
}

FT_PRODUCTO_POR_CAT = {
    "Fraude": ["Tarjeta de crédito", "Tarjeta de crédito", "Cuenta corriente", "Cuenta vista"],
    "Cobro indebido": ["Tarjeta de crédito", "Cuenta corriente", "Seguros", "Tarjeta de crédito"],
    "App y canales digitales": ["Cuenta corriente", "Cuenta vista", "Tarjeta de crédito"],
    "Crédito y tasas": ["Crédito de consumo", "Crédito de consumo", "Crédito hipotecario"],
    "Atención al cliente": ["Cuenta corriente", "Tarjeta de crédito", "Crédito de consumo", "Seguros"],
    "Información y trámites": ["Cuenta corriente", "Cuenta vista", "Tarjeta de crédito", "Crédito hipotecario"],
}

FT_PESOS = {"Fraude": 0.15, "Cobro indebido": 0.22, "App y canales digitales": 0.20,
            "Crédito y tasas": 0.13, "Atención al cliente": 0.17, "Información y trámites": 0.13}

FT_URGENCIA_BASE = {"Fraude": [0.75, 0.2, 0.05], "Cobro indebido": [0.3, 0.5, 0.2],
                    "App y canales digitales": [0.25, 0.5, 0.25], "Crédito y tasas": [0.2, 0.5, 0.3],
                    "Atención al cliente": [0.2, 0.45, 0.35], "Información y trámites": [0.05, 0.25, 0.7]}

CANAL_VARIANTES = {"App": ["App", "app", "APP", "Aplicación", "App móvil"],
                   "Web": ["Web", "web", "Sitio web", "WEB"],
                   "Call center": ["Call center", "call center", "Teléfono", "CallCenter"],
                   "Sucursal": ["Sucursal", "sucursal", "SUCURSAL"],
                   "Redes sociales": ["Redes sociales", "Twitter/X", "Instagram"]}

CAT_VARIANTES_FT = {"Fraude": ["fraude", "FRAUDE", "Fraude "],
                    "Cobro indebido": ["cobro indebido", "Cobros indebidos", "Cobro Indebido"],
                    "App y canales digitales": ["App y Canales Digitales", "app y canales digitales"],
                    "Crédito y tasas": ["Credito y tasas", "crédito y tasas"],
                    "Atención al cliente": ["Atencion al cliente", "atención al cliente"],
                    "Información y trámites": ["Informacion y tramites", "Información y Trámites"]}

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre",
         "octubre", "noviembre", "diciembre"]


def rellenar(t: str) -> str:
    return (t.replace("{comercio}", rng.choice(COMERCIOS))
             .replace("{monto}", fmt_monto(monto_clp()))
             .replace("{n}", str(rng.randint(2, 6)))
             .replace("{mes}", rng.choice(MESES))
             .replace("{fecha}", f"{rng.randint(1, 28)} de {rng.choice(MESES)}"))


def generar_fintrust(n: int = 6000) -> pd.DataFrame:
    cats = list(FT_PESOS)
    filas = []
    ini, fin = date(2025, 1, 1), date(2026, 6, 30)
    for i in range(n):
        cat = rng.choices(cats, weights=[FT_PESOS[c] for c in cats])[0]
        nucleo = rellenar(rng.choice(FT_NUCLEOS[cat]))
        if rng.random() < 0.35:  # segundo núcleo de la misma categoría
            nucleo += " " + rellenar(rng.choice(FT_NUCLEOS[cat]))
        texto = armar(FT_APERTURA, nucleo, [rellenar(d) for d in FT_DETALLES[cat]], FT_CIERRE)
        if rng.random() < 0.12:
            texto += " " + FT_AMBIGUO[cat]
        if rng.random() < 0.07:
            texto += " " + pii_frase()
        if rng.random() < 0.05:
            texto += " " + rng.choice(["😡", "🙏", "😤😤", "!!!", "🤬"])
        urg_p = list(FT_URGENCIA_BASE[cat])
        low = texto.lower()
        if "urgente" in low or "sernac" in low or "vergüenza" in low:
            urg_p = [urg_p[0] + 0.3, urg_p[1], max(urg_p[2] - 0.2, 0.02)]
        urg = rng.choices(["Alta", "Media", "Baja"], weights=urg_p)[0]
        canal = rng.choices(list(CANAL_VARIANTES), weights=[0.38, 0.22, 0.2, 0.12, 0.08])[0]
        monto = monto_clp() if cat in ("Fraude", "Cobro indebido") or rng.random() < 0.15 else np.nan
        dias = int(np_rng.gamma(2.2, 4.5)) + (6 if cat == "Atención al cliente" else 0)
        filas.append({
            "id_reclamo": f"FT-{100000 + i}",
            "fecha": fecha_aleatoria(ini, fin).isoformat(),
            "canal": rng.choice(CANAL_VARIANTES[canal]),
            "producto": rng.choice(FT_PRODUCTO_POR_CAT[cat]),
            "texto": ensuciar(texto),
            "monto_reclamado": monto,
            "dias_resolucion": dias,
            "categoria": cat,
            "urgencia": urg,
        })
    df = pd.DataFrame(filas)

    # Ruido de etiquetas (~6 %): clasificadores humanos se equivocan
    idx = df.sample(frac=0.06, random_state=SEED).index
    df.loc[idx, "categoria"] = [rng.choice([c for c in cats if c != v]) for v in df.loc[idx, "categoria"]]
    # Categorías escritas de distintas formas (~7 %)
    idx = df.sample(frac=0.07, random_state=SEED + 1).index
    df.loc[idx, "categoria"] = [rng.choice(CAT_VARIANTES_FT[v]) for v in df.loc[idx, "categoria"]]
    # Valores imposibles y nulos
    idx = df.sample(n=25, random_state=SEED + 2).index
    df.loc[idx, "monto_reclamado"] = -df.loc[idx, "monto_reclamado"].fillna(15000).abs()
    idx = df.sample(n=12, random_state=SEED + 3).index
    df.loc[idx, "dias_resolucion"] = rng.choice([-3, 999, 540])
    idx = df.sample(n=40, random_state=SEED + 4).index
    df.loc[idx, "texto"] = rng.choice([np.nan, "", "   ", "reclamo", "..."])
    idx = df.sample(frac=0.03, random_state=SEED + 5).index
    df.loc[idx, "urgencia"] = np.nan
    # Duplicados exactos (~3 %) y desorden
    dups = df.sample(frac=0.03, random_state=SEED + 6)
    df = pd.concat([df, dups]).sample(frac=1, random_state=SEED + 7).reset_index(drop=True)
    return df


# --------------------------------------------------------------------------
# Caso B · MercaSur · reseñas
# --------------------------------------------------------------------------
PRODUCTOS = {
    "Tecnología": ["audífonos bluetooth", "notebook", "smartwatch", "celular", "tablet", "mouse inalámbrico"],
    "Electrohogar": ["hervidor", "aspiradora", "microondas", "freidora de aire", "lavadora", "refrigerador"],
    "Hogar": ["juego de sábanas", "sartén antiadherente", "lámpara de pie", "set de toallas", "silla de escritorio"],
    "Moda": ["zapatillas", "chaqueta impermeable", "jeans", "polerón", "mochila"],
    "Deportes": ["bicicleta", "mancuernas", "mat de yoga", "carpa", "botella térmica"],
    "Belleza": ["secador de pelo", "perfume", "plancha de pelo", "crema facial", "afeitadora"],
}

MS_ASPECTOS = ["Despacho", "Calidad del producto", "Precio", "Atención", "Devoluciones y garantía", "Pago"]

MS_POS = {
    "Despacho": ["El {p} llegó antes de lo prometido.", "Despacho rápido y el {p} venía bien embalado.",
                 "Llegó en {d} días, súper puntual.", "El repartidor fue muy amable y el {p} llegó perfecto."],
    "Calidad del producto": ["Excelente calidad el {p}, se nota firme.", "El {p} funciona perfecto, muy buena calidad.",
                             "Superó mis expectativas, el {p} es tal cual la foto.",
                             "Llevo {d} semanas usando el {p} y anda impecable."],
    "Precio": ["Muy buen precio para lo que es el {p}.", "Lo compré en oferta, imposible encontrar el {p} más barato.",
               "Relación precio calidad inmejorable.", "Con el descuento el {p} salió regalado."],
    "Atención": ["La atención por chat fue rápida y me resolvieron todo.", "El vendedor me asesoró muy bien con el {p}.",
                 "Me contestaron el correo en menos de una hora.", "Muy buena disposición del servicio al cliente."],
    "Devoluciones y garantía": ["Devolví el {p} sin problemas y me reembolsaron en {d} días.",
                                "Hice efectiva la garantía del {p} y me lo cambiaron al tiro.",
                                "El cambio de talla fue fácil y gratis.", "La devolución fue simple, todo online."],
    "Pago": ["Pude pagar en cuotas sin interés sin problemas.", "El pago con débito fue rápido y seguro.",
             "Me aplicaron bien el cupón de descuento al pagar.", "Pagar con transferencia fue muy fácil."],
}
MS_NEG = {
    "Despacho": ["El {p} llegó con {d} días de atraso.", "Nunca llegó el {p} y el seguimiento dice entregado.",
                 "La caja del {p} llegó rota y mojada.", "Me cambiaron la fecha de entrega tres veces."],
    "Calidad del producto": ["El {p} dejó de funcionar a los {d} días.", "Pésima calidad, el {p} se rompió altiro.",
                             "El {p} no se parece en nada a la foto.", "El material del {p} es muy delgado y frágil."],
    "Precio": ["Carísimo el {p} para lo que es.", "Subieron el precio del {p} justo antes del cyber.",
               "En otra tienda el {p} estaba mucho más barato.", "El precio del {p} cambió al llegar al carro."],
    "Atención": ["Nadie responde el chat, solo bots.", "Llamé {d} veces y nadie me dio una solución.",
                 "La atención en tienda fue pésima, nadie sabía nada del {p}.",
                 "Me respondieron con un correo automático que no sirvió."],
    "Devoluciones y garantía": ["Quise devolver el {p} y me pusieron mil trabas.",
                                "Llevo {d} semanas esperando el reembolso del {p}.",
                                "No me quisieron hacer válida la garantía del {p}.",
                                "Para cambiar el {p} me hicieron ir tres veces a la tienda."],
    "Pago": ["Me cobraron dos veces el {p} en la tarjeta.", "El pago fue rechazado pero igual me descontaron la plata.",
             "No me aplicaron el descuento del banco al pagar.", "La página se cayó al momento de pagar."],
}
MS_NEU = {
    "Despacho": ["El {p} llegó en la fecha indicada, sin más.", "Despacho normal, ni rápido ni lento."],
    "Calidad del producto": ["El {p} cumple, nada especial.", "Calidad aceptable para el uso que le doy al {p}."],
    "Precio": ["Precio normal, similar a otras tiendas.", "Ni caro ni barato el {p}."],
    "Atención": ["La atención fue correcta.", "Me respondieron, aunque se demoraron un poco."],
    "Devoluciones y garantía": ["La devolución tomó lo que decían las políticas.", "El cambio fue normal, sin sorpresas."],
    "Pago": ["El pago funcionó como siempre.", "Nada que destacar del pago."],
}
MS_APERTURA = ["", "Compré un {p}.", "Mi experiencia:", "Les cuento:", "Segunda compra en MercaSur."]
MS_CIERRE = ["Recomendado.", "No vuelvo a comprar.", "Volvería a comprar.", "5 estrellas.", "Ojo con esta tienda.",
             "Bien en general.", "Decepcionado.", "Feliz con la compra."]

CAT_VARIANTES_MS = {"Despacho": ["despacho", "DESPACHO", "Despacho "],
                    "Calidad del producto": ["calidad del producto", "Calidad producto"],
                    "Precio": ["precio", "PRECIO"],
                    "Atención": ["Atencion", "atención"],
                    "Devoluciones y garantía": ["Devoluciones y garantia", "devoluciones y garantía"],
                    "Pago": ["pago", "Pagos"]}


FEMENINOS = {"aspiradora", "freidora de aire", "lavadora", "sartén antiadherente", "lámpara de pie",
             "silla de escritorio", "chaqueta impermeable", "mochila", "bicicleta", "carpa", "botella térmica",
             "plancha de pelo", "crema facial", "afeitadora", "tablet"}
PLURALES_M = {"audífonos bluetooth", "jeans"}
PLURALES_F = {"zapatillas", "mancuernas"}


def rellenar_ms(t: str, p: str) -> str:
    if p in FEMENINOS:
        t = t.replace("del {p}", "de la {p}").replace("el {p}", "la {p}").replace("El {p}", "La {p}").replace("un {p}", "una {p}")
    elif p in PLURALES_M:
        t = t.replace("del {p}", "de los {p}").replace("el {p}", "los {p}").replace("El {p}", "Los {p}").replace("un {p}", "unos {p}")
    elif p in PLURALES_F:
        t = t.replace("del {p}", "de las {p}").replace("el {p}", "las {p}").replace("El {p}", "Las {p}").replace("un {p}", "unas {p}")
    return t.replace("{p}", p).replace("{d}", str(rng.randint(2, 15)))


def generar_mercasur(n: int = 6000) -> pd.DataFrame:
    filas = []
    ini, fin = date(2025, 3, 1), date(2026, 8, 31)
    pesos_asp = [0.27, 0.25, 0.13, 0.15, 0.12, 0.08]
    for i in range(n):
        cat_prod = rng.choice(list(PRODUCTOS))
        p = rng.choice(PRODUCTOS[cat_prod])
        asp = rng.choices(MS_ASPECTOS, weights=pesos_asp)[0]
        rating = int(rng.choices([1, 2, 3, 4, 5], weights=[0.17, 0.11, 0.14, 0.24, 0.34])[0])
        banco = MS_POS if rating >= 4 else MS_NEG if rating <= 2 else MS_NEU
        nucleo = rellenar_ms(rng.choice(banco[asp]), p)
        if rng.random() < 0.3:
            nucleo += " " + rellenar_ms(rng.choice(banco[asp]), p)
        if rng.random() < 0.15:  # comentario secundario de otro aspecto
            otro = rng.choice([a for a in MS_ASPECTOS if a != asp])
            nucleo += " " + rellenar_ms(rng.choice(rng.choice([MS_POS, MS_NEG, MS_NEU])[otro]), p)
        if rng.random() < 0.04 and rating <= 2:  # sarcasmo
            nucleo = rng.choice(["Genial, ", "Excelente servicio... ", "Qué maravilla, "]) + nucleo[0].lower() + nucleo[1:]
        texto = armar([rellenar_ms(a, p) for a in MS_APERTURA], nucleo, [""], MS_CIERRE)
        if rng.random() < 0.04:
            texto += " " + pii_frase()
        if rng.random() < 0.06:
            texto += " " + rng.choice(["👍", "😍", "😡", "🙄", "⭐⭐⭐⭐⭐"])
        filas.append({
            "id_resena": f"MS-{200000 + i}",
            "fecha": fecha_aleatoria(ini, fin).isoformat(),
            "categoria_producto": cat_prod,
            "producto": p,
            "canal_compra": rng.choices(["Web", "App", "Tienda"], weights=[0.5, 0.35, 0.15])[0],
            "precio_clp": int(round(np_rng.lognormal(10.4, 0.9), -2)),
            "rating": rating,
            "texto": ensuciar(texto.strip()),
            "aspecto": asp,
        })
    df = pd.DataFrame(filas)
    idx = df.sample(frac=0.06, random_state=SEED).index
    df.loc[idx, "aspecto"] = [rng.choice([a for a in MS_ASPECTOS if a != v]) for v in df.loc[idx, "aspecto"]]
    idx = df.sample(frac=0.07, random_state=SEED + 1).index
    df.loc[idx, "aspecto"] = [rng.choice(CAT_VARIANTES_MS[v]) for v in df.loc[idx, "aspecto"]]
    df["rating"] = df["rating"].astype("float")
    idx = df.sample(n=60, random_state=SEED + 2).index
    df.loc[idx, "rating"] = np.nan
    idx = df.sample(n=15, random_state=SEED + 3).index
    df.loc[idx, "rating"] = [rng.choice([0, 6, 10, -1]) for _ in idx]
    idx = df.sample(n=40, random_state=SEED + 4).index
    df.loc[idx, "texto"] = rng.choice([np.nan, "", "  ", "ok", "..."])
    idx = df.sample(n=20, random_state=SEED + 5).index
    df.loc[idx, "precio_clp"] = 0
    df["categoria_producto"] = [rng.choice([c, c.lower(), c.upper()]) if rng.random() < 0.05 else c
                                for c in df["categoria_producto"]]
    dups = df.sample(frac=0.03, random_state=SEED + 6)
    df = pd.concat([df, dups]).sample(frac=1, random_state=SEED + 7).reset_index(drop=True)
    return df


# --------------------------------------------------------------------------
# Bases documentales (RAG)
# --------------------------------------------------------------------------
DOCS_FINTRUST = {
    "FT-POL-01": ("Desconocimiento de compras y contracargos", """
El cliente puede desconocer compras o cargos realizados con su tarjeta de crédito o débito FinTrust dentro de un plazo
de 120 días corridos desde la fecha de la transacción. El desconocimiento se realiza en la app (menú Tarjetas >
Desconocer compra), en la web o llamando al 600 600 1234.

Una vez ingresado el desconocimiento, FinTrust bloquea la tarjeta de forma inmediata y emite una nueva sin costo.
Para montos de hasta 35 UF, FinTrust abona provisoriamente el monto reclamado dentro de 5 días hábiles mientras
investiga. Para montos superiores a 35 UF, el abono provisorio se realiza dentro de 7 días hábiles.

La investigación tiene un plazo máximo de 30 días hábiles. Si se determina que el cliente actuó con dolo o culpa grave
(por ejemplo, entregando voluntariamente su clave dinámica a un tercero), FinTrust podrá revertir el abono provisorio,
informándolo por escrito con los antecedentes.
"""),
    "FT-POL-02": ("Bloqueo de tarjetas y robo o extravío", """
Ante robo o extravío de una tarjeta, el cliente debe bloquearla de inmediato desde la app (Tarjetas > Bloquear),
llamando al 600 600 1234 (disponible 24/7) o en cualquier sucursal. El bloqueo desde la app es instantáneo.

El bloqueo temporal permite reactivar la tarjeta si el cliente la encuentra, durante un máximo de 15 días. Pasado ese
plazo, el bloqueo se vuelve definitivo y se emite una nueva tarjeta.

La reposición de la tarjeta por robo, extravío o fraude no tiene costo. La reposición por deterioro tiene un costo de
0,1 UF. La nueva tarjeta se despacha al domicilio registrado en un plazo de 3 a 5 días hábiles, o puede retirarse en
sucursal al día hábil siguiente.
"""),
    "FT-POL-03": ("Prevención de fraudes y phishing", """
FinTrust nunca solicita claves, coordenadas ni códigos de la clave dinámica por teléfono, correo electrónico, SMS o
WhatsApp. Tampoco envía enlaces por SMS para "validar" o "desbloquear" cuentas.

Si el cliente recibió un mensaje sospechoso, debe reenviarlo a seguridad@fintrust.cl y eliminarlo sin abrir enlaces.
Si ya ingresó sus datos en un sitio falso, debe cambiar su clave de internet desde la app y bloquear sus tarjetas de
inmediato, y luego desconocer las transacciones según la política FT-POL-01.

Las transferencias a destinatarios nuevos superiores a $500.000 quedan retenidas 2 horas como medida de seguridad,
y el cliente recibe una notificación para confirmarlas o anularlas.
"""),
    "FT-POL-04": ("Comisiones y cargos", """
Cuenta Corriente FinTrust Plus: comisión de mantención de 0,15 UF mensual. La comisión queda exenta si el cliente
tiene abono de remuneraciones mensual o un saldo promedio mensual superior a $1.000.000.

Tarjeta de crédito FinTrust Clásica: sin costo de mantención el primer año; desde el segundo año, 0,09 UF mensual.
La tarjeta adicional no tiene costo de mantención. Si el cliente cierra una tarjeta adicional, el cobro asociado (si
existiera) debe detenerse en el siguiente estado de cuenta.

Avance en efectivo: comisión de 2,5% del monto con un mínimo de $2.500. Cuenta Vista: sin costo de mantención; cada
giro en cajero de otro banco tiene un costo de $800.

Si un cliente identifica una comisión cobrada que no corresponde según su contrato, puede solicitar la revisión y
FinTrust debe responder en un plazo de 10 días hábiles y devolver lo cobrado en exceso en el siguiente ciclo.
"""),
    "FT-POL-05": ("Prepago, renegociación y postergación de créditos", """
Los créditos de consumo pueden prepagarse total o parcialmente en cualquier momento. La comisión de prepago equivale
a un mes de intereses pactados sobre el capital que se prepaga, con un tope legal. Los créditos menores a 5.000 UF
pagan como máximo dos meses de intereses.

El cliente puede solicitar la postergación de hasta 2 cuotas por año calendario, siempre que tenga sus pagos al día.
La solicitud se hace en la app (Créditos > Postergar cuota) y se responde en 3 días hábiles. Los intereses del período
postergado se distribuyen en las cuotas restantes.

Para renegociar un crédito, el cliente debe solicitar evaluación con su ejecutivo. FinTrust ofrece un plan de
reprogramación con hasta 12 meses adicionales de plazo para clientes con pérdida de empleo acreditada.

La Carga Anual Equivalente (CAE) informada en la simulación es referencial y se fija al momento de cursar el crédito.
Si la CAE del contrato es distinta a la de la simulación firmada el mismo día, el cliente puede exigir la corrección.
"""),
    "FT-POL-06": ("Canales digitales: acceso, clave y clave dinámica", """
Para recuperar la clave de internet, el cliente debe ingresar a la app o web y seleccionar "Olvidé mi clave"; se
valida identidad con cédula de identidad vigente y una selfie. El proceso toma menos de 10 minutos.

Tras 3 intentos fallidos de inicio de sesión, el acceso se bloquea por 24 horas. El cliente puede desbloquearlo antes
llamando al 600 600 1234.

La clave dinámica se activa en un solo dispositivo. Si el cliente cambia de celular, debe reactivarla desde la web
o en sucursal. Si no recibe el código de activación por SMS, debe verificar que su número esté actualizado.

Si una transferencia muestra error pero se descontó el saldo, FinTrust revierte el monto automáticamente en un
plazo máximo de 48 horas hábiles. Si no ocurre, el cliente debe reclamar indicando el número de operación.
"""),
    "FT-POL-07": ("Plazos de atención de reclamos", """
Todo reclamo ingresado por cualquier canal recibe un número de atención. FinTrust se compromete a dar una respuesta
de fondo en un plazo máximo de 10 días hábiles. Los reclamos por fraude se responden en un plazo máximo de 5 días
hábiles con información del estado de la investigación.

Si el cliente no recibe respuesta en plazo, o no está conforme, puede escalar el reclamo al Defensor del Cliente
FinTrust (defensor@fintrust.cl), que responde en 15 días hábiles. Además, el cliente siempre puede recurrir a la
CMF o al SERNAC.

El tiempo de espera objetivo en el call center es de 5 minutos. Si la llamada se corta, el sistema agenda una
devolución de llamada dentro de las 2 horas siguientes.
"""),
    "FT-POL-08": ("Seguros asociados a productos", """
Los seguros asociados a tarjetas o créditos son siempre voluntarios y requieren la aceptación expresa del cliente.
Si un cliente detecta un seguro que no contrató, puede solicitar su anulación y la devolución de todas las primas
cobradas. FinTrust debe responder en 10 días hábiles.

El cliente puede retractarse de un seguro contratado dentro de los 35 días siguientes a la contratación, con
devolución total de la prima. Pasado ese plazo, puede terminar el seguro en cualquier momento, con efecto desde el
mes siguiente y sin multa.

El seguro de desgravamen de los créditos hipotecarios es obligatorio por ley, pero el cliente puede contratarlo con
otra compañía si cumple las mismas coberturas.
"""),
    "FT-POL-09": ("Certificados y documentos", """
Los certificados de deuda, de saldos, de intereses pagados (para la declaración de renta) y de cuenta pueden
descargarse gratis en la web (Mi perfil > Certificados) y en la app. Se emiten en el momento, con firma electrónica.

Las cartolas de los últimos 24 meses están disponibles en la web. Cartolas más antiguas se solicitan en sucursal y
se entregan en 5 días hábiles.

El certificado de intereses pagados para la Operación Renta se publica cada año a partir del 15 de febrero.
"""),
    "FT-POL-10": ("Cierre de productos y cambios de datos", """
El cliente puede cerrar su cuenta corriente, cuenta vista o tarjeta de crédito en cualquier momento, sin costo, desde
la app (Mi perfil > Cerrar producto) o en sucursal. Para cerrar una cuenta corriente no deben existir deudas ni
cheques pendientes. El cierre se hace efectivo en un plazo de 5 días hábiles.

El cambio de dirección, correo o teléfono se realiza en la app (Mi perfil > Datos personales). El cambio de número de
teléfono requiere validación con la clave dinámica.

La fecha de pago de la tarjeta de crédito puede cambiarse una vez cada 6 meses. Las fechas disponibles son los días
5, 10, 15, 20 y 25 de cada mes.

El aumento de cupo de la tarjeta de crédito se solicita en la app y se evalúa en 48 horas hábiles según comportamiento
de pago y renta acreditada.
"""),
}

PREGUNTAS_FT = [
    ("¿Cuántos días tengo para desconocer una compra con mi tarjeta?", "120 días corridos desde la transacción.", "FT-POL-01"),
    ("Si desconozco una compra de 20 UF, ¿en cuánto tiempo me devuelven el dinero de forma provisoria?", "Dentro de 5 días hábiles (montos hasta 35 UF).", "FT-POL-01"),
    ("¿Tiene costo reponer una tarjeta robada?", "No, la reposición por robo, extravío o fraude no tiene costo.", "FT-POL-02"),
    ("¿Cuánto cuesta reponer una tarjeta deteriorada?", "0,1 UF.", "FT-POL-02"),
    ("¿FinTrust me puede pedir la clave dinámica por teléfono?", "No, nunca la solicita por teléfono, correo, SMS ni WhatsApp.", "FT-POL-03"),
    ("¿Por qué quedó retenida mi transferencia de $800.000 a un destinatario nuevo?", "Transferencias a destinatarios nuevos sobre $500.000 quedan retenidas 2 horas por seguridad.", "FT-POL-03"),
    ("¿Cuándo no pago la mantención de la Cuenta Corriente Plus?", "Si tiene abono de remuneraciones o saldo promedio mensual sobre $1.000.000.", "FT-POL-04"),
    ("¿Cuál es la comisión de un avance en efectivo?", "2,5% del monto con mínimo de $2.500.", "FT-POL-04"),
    ("¿Cuántas cuotas puedo postergar al año?", "Hasta 2 cuotas por año calendario, con pagos al día.", "FT-POL-05"),
    ("¿Cuánto cobran por prepagar un crédito de consumo?", "Un mes de intereses pactados sobre el capital prepagado (máximo dos meses para créditos bajo 5.000 UF).", "FT-POL-05"),
    ("Me equivoqué tres veces la clave y no puedo entrar, ¿qué pasa?", "El acceso se bloquea por 24 horas; se puede desbloquear antes llamando al 600 600 1234.", "FT-POL-06"),
    ("La transferencia dio error pero me descontaron la plata, ¿qué hago?", "Se revierte automáticamente en máximo 48 horas hábiles; si no, reclamar con el número de operación.", "FT-POL-06"),
    ("¿En cuánto tiempo deben responder mi reclamo?", "Máximo 10 días hábiles (5 días hábiles si es fraude).", "FT-POL-07"),
    ("¿Puedo retractarme de un seguro que contraté hace dos semanas?", "Sí, dentro de 35 días con devolución total de la prima.", "FT-POL-08"),
    ("¿Dónde descargo el certificado de intereses para la declaración de renta?", "En la web o app (Mi perfil > Certificados), disponible desde el 15 de febrero.", "FT-POL-09"),
    ("¿Cada cuánto puedo cambiar la fecha de pago de la tarjeta?", "Una vez cada 6 meses; días 5, 10, 15, 20 o 25.", "FT-POL-10"),
    ("¿Cuánto se demora la evaluación de un aumento de cupo?", "48 horas hábiles.", "FT-POL-10"),
    ("¿FinTrust ofrece créditos para comprar autos eléctricos con tasa cero?", "No hay información en la base documental: el asistente debe decir que no lo sabe.", "NINGUNO"),
]

DOCS_MERCASUR = {
    "MS-POL-01": ("Despacho a domicilio", """
MercaSur despacha a todo Chile continental. En la Región Metropolitana el plazo es de 1 a 3 días hábiles; en regiones,
de 3 a 7 días hábiles. Las compras sobre $39.990 tienen despacho gratis en la Región Metropolitana.

El cliente recibe un código de seguimiento por correo. Si el seguimiento indica "entregado" pero el cliente no recibió
el pedido, debe reportarlo dentro de 48 horas en la sección Mis compras > Tengo un problema. MercaSur investiga con el
operador logístico y responde en 5 días hábiles, reenviando el producto o reembolsando el total.

Si el producto llega con la caja dañada, el cliente puede rechazarlo al momento de la entrega o reportarlo dentro de
48 horas con fotografías.
"""),
    "MS-POL-02": ("Retiro en tienda", """
El retiro en tienda es gratis. El pedido está disponible en 24 a 48 horas y se avisa por correo y SMS. El cliente
tiene 10 días corridos para retirar; pasado ese plazo la compra se anula y se reembolsa automáticamente.

Para retirar se debe presentar la cédula de identidad del comprador y el número de pedido. Un tercero puede retirar
con un poder simple y una copia de la cédula del comprador.
"""),
    "MS-POL-03": ("Cambios y devoluciones", """
El cliente tiene 30 días corridos desde la recepción para cambiar o devolver un producto sin uso, con etiquetas y en
su empaque original. Los productos de higiene personal (perfumes abiertos, cremas, afeitadoras usadas) no tienen
cambio por razones sanitarias, salvo falla.

La devolución puede iniciarse online (Mis compras > Devolver) con retiro a domicilio gratuito, o en cualquier tienda.
El reembolso se realiza al mismo medio de pago en un plazo de 5 a 10 días hábiles desde que el producto llega a la
bodega. Los cambios de talla en Moda son gratis y se pueden hacer hasta 2 veces por producto.
"""),
    "MS-POL-04": ("Garantía legal y garantía extendida", """
Todos los productos nuevos tienen garantía legal de 6 meses: si presentan una falla, el cliente puede elegir entre
el cambio, la reparación gratuita o la devolución del dinero. Para hacer efectiva la garantía se necesita la boleta
o el número de pedido.

La garantía extendida MercaSur Protege se puede comprar al momento de la compra para Tecnología y Electrohogar.
Extiende la cobertura a 12, 24 o 36 meses adicionales y cubre fallas de fabricación, no daños por golpes o líquidos.

Los productos de Tecnología enviados a servicio técnico tienen un plazo de reparación máximo de 20 días hábiles;
si se excede, el cliente puede pedir el cambio del producto.
"""),
    "MS-POL-05": ("Medios de pago y cuotas", """
MercaSur acepta tarjetas de crédito y débito, transferencia bancaria y la billetera MercaPay. Las compras sobre
$100.000 con tarjeta de crédito pueden pagarse en hasta 6 cuotas sin interés en bancos adheridos.

Si un pago fue rechazado pero se descontó el dinero, el banco emisor lo revierte en un plazo de 3 a 7 días hábiles.
Si el cobro aparece duplicado, el cliente debe enviar el comprobante a pagos@mercasur.cl y MercaSur reembolsa el
cobro duplicado en 5 días hábiles.

Los cupones de descuento no son acumulables entre sí y deben ingresarse antes de confirmar el pago; no se aplican
de forma retroactiva.
"""),
    "MS-POL-06": ("Precios y ofertas", """
El precio válido es el que aparece en el carro al confirmar el pago. Si un producto baja de precio dentro de los 7
días siguientes a la compra, el cliente con cuenta MercaSur Plus puede solicitar la diferencia como saldo en
MercaPay.

En eventos como CyberDay y Black Friday, los precios de referencia corresponden al precio más bajo de los 30 días
anteriores al evento. Las ofertas son válidas hasta agotar stock.
"""),
    "MS-POL-07": ("Atención al cliente", """
El chat de atención funciona todos los días de 8:00 a 22:00 y es atendido por ejecutivos después de un primer filtro
automático; escribiendo "ejecutivo" se deriva a una persona. El tiempo de respuesta objetivo es de 3 minutos.

Los correos a ayuda@mercasur.cl se responden en un máximo de 48 horas. Los reclamos formales tienen un número de caso
y una respuesta de fondo en 7 días hábiles. Si el cliente no está conforme, puede escalar a SERNAC.
"""),
    "MS-POL-08": ("Programa de puntos MercaSur Plus", """
MercaSur Plus cuesta $2.990 mensuales e incluye despacho gratis en todo Chile sin monto mínimo, 2 puntos por cada
$1.000 de compra y acceso anticipado a ofertas.

Los puntos vencen a los 12 meses y se canjean en el carro de compra: 1 punto equivale a $1. La suscripción puede
cancelarse en cualquier momento sin costo, con efecto desde el siguiente ciclo de facturación.
"""),
}

PREGUNTAS_MS = [
    ("¿Cuánto se demora un despacho a regiones?", "Entre 3 y 7 días hábiles.", "MS-POL-01"),
    ("¿Desde qué monto el despacho es gratis en Santiago?", "Compras sobre $39.990 en la Región Metropolitana.", "MS-POL-01"),
    ("El seguimiento dice entregado pero no me llegó nada, ¿qué hago?", "Reportarlo dentro de 48 horas en Mis compras > Tengo un problema; responden en 5 días hábiles.", "MS-POL-01"),
    ("¿Cuántos días tengo para retirar en tienda?", "10 días corridos; luego la compra se anula y se reembolsa.", "MS-POL-02"),
    ("¿Puede retirar mi pedido otra persona?", "Sí, con poder simple y copia de la cédula del comprador.", "MS-POL-02"),
    ("¿Cuánto plazo tengo para devolver un producto?", "30 días corridos desde la recepción, sin uso y con etiquetas.", "MS-POL-03"),
    ("¿Puedo devolver un perfume abierto?", "No, salvo falla; los productos de higiene personal abiertos no tienen cambio.", "MS-POL-03"),
    ("¿Cuánto se demora el reembolso de una devolución?", "5 a 10 días hábiles desde que el producto llega a bodega.", "MS-POL-03"),
    ("¿Cuánto dura la garantía legal?", "6 meses: cambio, reparación o devolución del dinero.", "MS-POL-04"),
    ("¿La garantía extendida cubre si se me cae el celular?", "No, cubre fallas de fabricación, no golpes ni líquidos.", "MS-POL-04"),
    ("¿Desde qué monto puedo pagar en cuotas sin interés?", "Compras sobre $100.000, hasta 6 cuotas sin interés en bancos adheridos.", "MS-POL-05"),
    ("Me cobraron dos veces, ¿qué hago?", "Enviar el comprobante a pagos@mercasur.cl; reembolsan el duplicado en 5 días hábiles.", "MS-POL-05"),
    ("¿Puedo usar dos cupones en la misma compra?", "No, los cupones no son acumulables.", "MS-POL-05"),
    ("El producto bajó de precio después de comprarlo, ¿me devuelven la diferencia?", "Sí, si es MercaSur Plus y ocurre dentro de 7 días, como saldo en MercaPay.", "MS-POL-06"),
    ("¿Cómo hablo con una persona en el chat?", "Escribiendo \"ejecutivo\"; el chat funciona de 8:00 a 22:00.", "MS-POL-07"),
    ("¿Cuánto cuesta MercaSur Plus?", "$2.990 mensuales.", "MS-POL-08"),
    ("¿Cuándo vencen los puntos?", "A los 12 meses.", "MS-POL-08"),
    ("¿MercaSur vende pasajes de avión?", "No hay información en la base documental: el asistente debe decir que no lo sabe.", "NINGUNO"),
]


def escribir_docs(docs: dict, carpeta: Path, nombre_csv: str, empresa: str) -> None:
    carpeta.mkdir(parents=True, exist_ok=True)
    filas = []
    for doc_id, (titulo, cuerpo) in docs.items():
        cuerpo = cuerpo.strip()
        (carpeta / f"{doc_id}.md").write_text(
            f"# {doc_id} · {titulo}\n\n> Documento ficticio de {empresa}, creado para fines docentes.\n\n{cuerpo}\n",
            encoding="utf-8")
        filas.append({"doc_id": doc_id, "titulo": titulo, "texto": cuerpo})
    pd.DataFrame(filas).to_csv(OUT / nombre_csv, index=False)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    ft = generar_fintrust()
    ft.to_csv(OUT / "reclamos_fintrust.csv", index=False)
    ms = generar_mercasur()
    ms.to_csv(OUT / "resenas_mercasur.csv", index=False)

    escribir_docs(DOCS_FINTRUST, OUT / "docs_fintrust", "politicas_fintrust.csv", "FinTrust")
    escribir_docs(DOCS_MERCASUR, OUT / "docs_mercasur", "politicas_mercasur.csv", "MercaSur")
    pd.DataFrame(PREGUNTAS_FT, columns=["pregunta", "respuesta_esperada", "doc_id"]).to_csv(
        OUT / "preguntas_eval_fintrust.csv", index=False)
    pd.DataFrame(PREGUNTAS_MS, columns=["pregunta", "respuesta_esperada", "doc_id"]).to_csv(
        OUT / "preguntas_eval_mercasur.csv", index=False)

    # Muestras livianas para ejecutar en el navegador (Pyodide)
    ft.sample(1500, random_state=1).to_csv(OUT / "reclamos_fintrust_muestra.csv", index=False)
    ms.sample(1500, random_state=1).to_csv(OUT / "resenas_mercasur_muestra.csv", index=False)

    print("FinTrust:", ft.shape, "| MercaSur:", ms.shape)


if __name__ == "__main__":
    main()
