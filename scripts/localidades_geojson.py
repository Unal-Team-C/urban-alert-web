"""Convierte el shapefile de localidades de Bogotá en public/localidades.geojson para el mapa.

Fuente: "Localidad. Bogotá D.C.", Secretaría Distrital de Planeación (Datos Abiertos Bogotá),
licencia CC BY 4.0:
https://datosabiertos.bogota.gov.co/dataset/856cb657-8ca3-4ee8-857f-37211173b1f8

Uso (solo biblioteca estándar):
    python3 scripts/localidades_geojson.py <carpeta con Loca.shp y Loca.dbf> public/localidades.geojson

El shapefile viene en MAGNA-SIRGAS geográficas (equivalente a WGS84 para el mapa). Los polígonos
se simplifican (Douglas-Peucker, ~5 m) y las coordenadas se redondean a 6 decimales, así el
archivo pasa de ~0,9 MB a unos pocos cientos de KB. Cada localidad lleva su recuadro y un punto
interior para la burbuja (polo de inaccesibilidad).
"""

import heapq
import json
import math
import struct
import sys
from pathlib import Path

TOLERANCIA_GRADOS = 0.00005  # ~5,5 m
DECIMALES = 6

# Nombres con tildes para mostrar; el shapefile los trae en mayúsculas sin tildes.
NOMBRES = {
    "01": "Usaquén", "02": "Chapinero", "03": "Santa Fe", "04": "San Cristóbal", "05": "Usme",
    "06": "Tunjuelito", "07": "Bosa", "08": "Kennedy", "09": "Fontibón", "10": "Engativá",
    "11": "Suba", "12": "Barrios Unidos", "13": "Teusaquillo", "14": "Los Mártires",
    "15": "Antonio Nariño", "16": "Puente Aranda", "17": "La Candelaria", "18": "Rafael Uribe Uribe",
    "19": "Ciudad Bolívar", "20": "Sumapaz",
}


def leer_dbf(ruta: Path) -> list[dict[str, str]]:
    datos = ruta.read_bytes()
    registros, largo_cabecera, largo_registro = struct.unpack("<IHH", datos[4:12])
    campos, i = [], 32
    while datos[i] != 0x0D:
        campos.append((datos[i : i + 11].split(b"\0")[0].decode(), datos[i + 16]))
        i += 32
    filas = []
    for r in range(registros):
        inicio = largo_cabecera + r * largo_registro + 1
        fila, o = {}, inicio
        for nombre, largo in campos:
            fila[nombre] = datos[o : o + largo].decode("utf-8").strip()
            o += largo
        filas.append(fila)
    return filas


def leer_shp(ruta: Path) -> list[list[list[tuple[float, float]]]]:
    """Anillos (lon, lat) de cada polígono, en el orden de los registros."""
    datos = ruta.read_bytes()
    poligonos, o = [], 100
    while o < len(datos):
        _, largo = struct.unpack(">2i", datos[o : o + 8])
        contenido = datos[o + 8 : o + 8 + largo * 2]
        tipo, partes, puntos = struct.unpack("<i32x2i", contenido[:44])
        if tipo != 5:
            raise ValueError(f"se esperaba un polígono (tipo 5), llegó {tipo}")
        indices = list(struct.unpack(f"<{partes}i", contenido[44 : 44 + 4 * partes])) + [puntos]
        base = 44 + 4 * partes
        xy = struct.unpack(f"<{2 * puntos}d", contenido[base : base + 16 * puntos])
        vertices = list(zip(xy[0::2], xy[1::2]))
        poligonos.append([vertices[indices[k] : indices[k + 1]] for k in range(partes)])
        o += 8 + largo * 2
    return poligonos


def area_con_signo(anillo):
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(anillo, anillo[1:])) / 2


def distancia_a_segmento(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def simplificar(anillo, tolerancia):
    """Douglas-Peucker iterativo; conserva el cierre del anillo."""
    conservar = [False] * len(anillo)
    conservar[0] = conservar[-1] = True
    pila = [(0, len(anillo) - 1)]
    while pila:
        inicio, fin = pila.pop()
        maxima, indice = 0.0, -1
        for k in range(inicio + 1, fin):
            d = distancia_a_segmento(anillo[k], anillo[inicio], anillo[fin])
            if d > maxima:
                maxima, indice = d, k
        if maxima > tolerancia:
            conservar[indice] = True
            pila += [(inicio, indice), (indice, fin)]
    resultado = [p for p, c in zip(anillo, conservar) if c]
    return resultado if len(resultado) >= 4 else anillo


def dentro(p, anillos):
    """Regla par-impar sobre todos los anillos (sirve con huecos y con varias partes)."""
    x, y = p
    adentro = False
    for anillo in anillos:
        for (x1, y1), (x2, y2) in zip(anillo, anillo[1:]):
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                adentro = not adentro
    return adentro


def distancia_al_borde(p, anillos):
    d = min(distancia_a_segmento(p, a, b) for anillo in anillos for a, b in zip(anillo, anillo[1:]))
    return d if dentro(p, anillos) else -d


def polo_de_inaccesibilidad(anillos, precision=0.0005):
    """Punto interior más alejado del borde (algoritmo polylabel), para ubicar la burbuja."""
    xs = [x for anillo in anillos for x, _ in anillo]
    ys = [y for anillo in anillos for _, y in anillo]
    lado = min(max(xs) - min(xs), max(ys) - min(ys))
    h = lado / 2
    cola = []

    def agregar(x, y, h):
        d = distancia_al_borde((x, y), anillos)
        heapq.heappush(cola, (-(d + h * math.sqrt(2)), d, x, y, h))

    x = min(xs)
    while x < max(xs):
        y = min(ys)
        while y < max(ys):
            agregar(x + h, y + h, h)
            y += lado
        x += lado
    externo = max(anillos, key=lambda a: abs(area_con_signo(a)))
    cx = sum(x for x, _ in externo) / len(externo)
    cy = sum(y for _, y in externo) / len(externo)
    mejor = (distancia_al_borde((cx, cy), anillos), cx, cy)
    while cola:
        _, d, x, y, h = heapq.heappop(cola)
        if d > mejor[0]:
            mejor = (d, x, y)
        if d + h * math.sqrt(2) - mejor[0] <= precision:
            continue
        h /= 2
        for dx in (-h, h):
            for dy in (-h, h):
                agregar(x + dx, y + dy, h)
    return mejor[1], mejor[2]


def a_multipoligono(anillos):
    """En el shapefile los anillos externos van en sentido horario y los huecos al revés."""
    externos = [[a] for a in anillos if area_con_signo(a) < 0]
    for hueco in (a for a in anillos if area_con_signo(a) >= 0):
        contenedor = next(p for p in externos if dentro(hueco[0], [p[0]]))
        contenedor.append(hueco)
    return externos


def redondear(anillo):
    return [[round(x, DECIMALES), round(y, DECIMALES)] for x, y in anillo]


def main(carpeta: str, salida: str) -> None:
    carpeta_shp = Path(carpeta)
    filas = leer_dbf(carpeta_shp / "Loca.dbf")
    poligonos = leer_shp(carpeta_shp / "Loca.shp")
    entidades = []
    for fila, anillos in sorted(zip(filas, poligonos), key=lambda par: par[0]["LocCodigo"]):
        simplificados = [simplificar(a, TOLERANCIA_GRADOS) for a in anillos]
        lon, lat = polo_de_inaccesibilidad(simplificados)
        xs = [x for a in simplificados for x, _ in a]
        ys = [y for a in simplificados for _, y in a]
        codigo = fila["LocCodigo"]
        entidades.append(
            {
                "type": "Feature",
                "properties": {
                    "codigo": codigo,
                    "nombre": NOMBRES.get(codigo, fila["LocNombre"].title()),
                    "etiqueta": [round(lat, DECIMALES), round(lon, DECIMALES)],
                    "limites": {
                        "latMin": round(min(ys), DECIMALES),
                        "latMax": round(max(ys), DECIMALES),
                        "lonMin": round(min(xs), DECIMALES),
                        "lonMax": round(max(xs), DECIMALES),
                    },
                },
                "geometry": {
                    "type": "MultiPolygon",
                    "coordinates": [[redondear(a) for a in p] for p in a_multipoligono(simplificados)],
                },
            }
        )
    coleccion = {
        "type": "FeatureCollection",
        "fuente": "Localidad. Bogotá D.C. — Secretaría Distrital de Planeación, Datos Abiertos Bogotá (CC BY 4.0)",
        "features": entidades,
    }
    Path(salida).write_text(json.dumps(coleccion, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    vertices = sum(len(a) for e in entidades for p in e["geometry"]["coordinates"] for a in p)
    print(f"{len(entidades)} localidades, {vertices} vértices, {Path(salida).stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
