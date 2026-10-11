"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { IconoCamara, IconoMapa, IconoUbicacion, IconoUsuario } from "../../components/Iconos";
import ReporteCreadoModal from "../../components/ReporteCreadoModal";
import SeleccionUbicacionModal from "../../components/SeleccionUbicacionModal";
import UsuarioModal from "../../components/UsuarioModal";
import { TIPOS_IMAGEN, formatearTamano, validarImagen } from "../../lib/imagen";
import {
  dentroDeBogota,
  formatearCoordenada,
  mensajeErrorGps,
  type Coordenada,
  type Ubicacion,
} from "../../lib/ubicacion";
import {
  elegirCiudadanoAlAzar,
  guardarUsuario,
  leerUsuarioGuardado,
  type Usuario,
} from "../../lib/usuarios";

// Línea entre la opción inicial ("Seleccione...") y las opciones reales.
const SEPARADOR = "──────────────────────";

// Forma de GET /api/v1/Reportes/catalogo (servicio de Reportes).
type TipoReporte = { codigo: string; nombre: string };
type CategoriaReporte = { codigo: string; nombre: string; tipos: TipoReporte[] };

// Errores de la API: {"message"} desde el middleware o ProblemDetails de ASP.NET
// ({"title", "errors"}) cuando el JSON no se puede convertir.
type ErrorApi = { message?: string; title?: string; errors?: Record<string, string[]> };

const FORMULARIO_VACIO = {
  category: "",
  reportType: "",
  description: "",
};

async function leerError(response: Response): Promise<string> {
  if (response.status === 503) {
    return "No fue posible registrar la ubicación del reporte. Intente nuevamente más tarde.";
  }

  const error = (await response.json().catch(() => null)) as ErrorApi | null;
  const detalle = error?.errors ? Object.values(error.errors).flat()[0] : undefined;
  return error?.message ?? detalle ?? error?.title ?? `Error inesperado (HTTP ${response.status}).`;
}

export default function Home() {
  const [form, setForm] = useState(FORMULARIO_VACIO);

  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [location, setLocation] = useState<Ubicacion | null>(null);
  const [locationError, setLocationError] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);

  const [categories, setCategories] = useState<CategoriaReporte[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Quién crea el reporte. Si no se puede obtener, Reportes asigna un usuario genérico.
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [usuarioError, setUsuarioError] = useState("");
  const [usuarioModalOpen, setUsuarioModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/reportes/catalogo")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<CategoriaReporte[]>;
      })
      .then(setCategories)
      .catch(() =>
        setCatalogError(
          "No fue posible cargar las categorías. Verifique que el servicio de Reportes esté disponible."
        )
      )
      .finally(() => setLoadingCatalog(false));
  }, []);

  useEffect(() => {
    fetch("/api/v1/usuarios")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<Usuario[]>;
      })
      .then((lista) => {
        setUsuarios(lista);
        const guardado = lista.find((u) => u.id === leerUsuarioGuardado());
        const elegido = guardado ?? elegirCiudadanoAlAzar(lista);
        if (!elegido) throw new Error("Sin usuarios con rol USER");
        setUsuario(elegido);
      })
      .catch(() =>
        setUsuarioError("No fue posible obtener un usuario: el reporte se creará con un usuario genérico.")
      );
  }, []);

  const selectedCategory = categories.find(
    (category) => category.codigo === form.category
  );

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    // Al cambiar de categoría, el tipo elegido deja de ser válido.
    setForm({ ...form, category: event.target.value, reportType: "" });
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function updateLocation(nueva: Ubicacion) {
    if (dentroDeBogota(nueva)) {
      setLocation(nueva);
      setLocationError("");
    } else {
      setLocationError("La ubicación está fuera de Bogotá. Seleccione el punto en el mapa.");
    }
  }

  function locateWithGps() {
    setLocationError("");

    // La geolocalización solo funciona en HTTPS (o en localhost).
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      setLocationError(
        "Este navegador no permite obtener la ubicación aquí (requiere HTTPS). Seleccione el punto en el mapa."
      );
      return;
    }

    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingGps(false);
        updateLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          origen: "gps",
          precisionMetros: position.coords.accuracy,
        });
      },
      (error) => {
        setLocatingGps(false);
        setLocationError(mensajeErrorGps(error));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  const closeMap = useCallback(() => setMapOpen(false), []);

  function saveMapLocation(coordenada: Coordenada) {
    setMapOpen(false);
    updateLocation({ ...coordenada, origen: "mapa" });
  }

  function setImageFile(archivo: File) {
    setImagePreview((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return URL.createObjectURL(archivo);
    });
    setImage(archivo);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    // Permite volver a elegir el mismo archivo después de quitarlo.
    event.target.value = "";
    if (!archivo) {
      return;
    }

    const error = validarImagen(archivo);
    if (error) {
      setImageError(error);
      return;
    }
    setImageError("");
    setImageFile(archivo);
  }

  function removeImage() {
    setImagePreview((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return null;
    });
    setImage(null);
    setImageError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!image) {
      setImageError("Agregue una imagen del daño: tómela con la cámara o elíjala de la galería.");
      return;
    }

    if (!location) {
      setLocationError("Indique la ubicación del reporte: en el mapa o con su ubicación actual.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    // multipart/form-data con todos los datos del reporte y el archivo. El navegador fija el
    // Content-Type con su boundary, por eso no se indica en los headers.
    const reportData = new FormData();
    reportData.append("categoria", form.category);
    reportData.append("tipo", form.reportType);
    reportData.append("descripcion", form.description);
    reportData.append("latitud", String(location.lat));
    reportData.append("longitud", String(location.lon));
    if (usuario) reportData.append("idUsuario", usuario.id);
    reportData.append("imagen", image);

    try {
      const response = await fetch("/api/v1/reportes", {
        method: "POST",
        body: reportData,
      });

      if (response.ok) {
        const creado = (await response.json()) as { idReporte: string };
        setForm(FORMULARIO_VACIO);
        setLocation(null);
        setLocationError("");
        setImage(null);
        setImageError("");
        setCreatedId(creado.idReporte);
      } else {
        setSubmitError(await leerError(response));
      }
    } catch {
      setSubmitError("No fue posible conectar con el servicio de Reportes.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const closeModal = useCallback(() => setCreatedId(null), []);
  const closeUsuarioModal = useCallback(() => setUsuarioModalOpen(false), []);

  function seleccionarUsuario(elegido: Usuario) {
    setUsuario(elegido);
    setUsuarioError("");
    guardarUsuario(elegido.id);
    setUsuarioModalOpen(false);
  }

  function agregarUsuario(nuevo: Usuario) {
    setUsuarios((lista) => [...lista, nuevo]);
    seleccionarUsuario(nuevo);
  }

  return (
    <main className="relative min-h-screen bg-gray-100 flex items-center justify-center p-6 pt-20 sm:pt-6">
      <button
        type="button"
        onClick={() => setUsuarioModalOpen(true)}
        title="Cambiar o agregar usuario"
        className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white py-2 pl-2 pr-4 text-sm font-medium text-gray-700 shadow hover:bg-gray-50"
      >
        <IconoUsuario className="h-7 w-7 text-gray-600" />
        <span className="max-w-[10rem] truncate">{usuario?.name ?? "Usuario"}</span>
      </button>

      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">
          Crear reporte
        </h1>

        <p className="mt-2 mb-6 text-gray-500">
          Complete la información del daño reportado.
        </p>

        {usuario && (
          <p className="-mt-4 mb-6 text-sm text-gray-500">
            Reportando como <span className="font-medium text-gray-700">{usuario.name}</span>
          </p>
        )}

        {usuarioError && (
          <p className="-mt-4 mb-6 text-sm text-amber-700">{usuarioError}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {catalogError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {catalogError}
            </p>
          )}

          {/* Categoría */}
          <div>
            <label className="mb-1 block font-medium text-gray-700">
              Categoría
            </label>

            <select
              name="category"
              value={form.category}
              onChange={handleCategoryChange}
              required
              disabled={loadingCatalog || categories.length === 0}
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
            >
              <option value="">
                {loadingCatalog ? "Cargando categorías..." : "Seleccione una categoría"}
              </option>

              {categories.length > 0 && <option disabled>{SEPARADOR}</option>}

              {categories.map((category) => (
                <option key={category.codigo} value={category.codigo}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de reporte (depende de la categoría) */}
          <div>
            <label className="mb-1 block font-medium text-gray-700">
              Tipo de reporte
            </label>

            <select
              name="reportType"
              value={form.reportType}
              onChange={handleChange}
              required
              disabled={!selectedCategory}
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
            >
              <option value="">
                {selectedCategory ? "Seleccione un tipo de reporte" : "Primero seleccione una categoría"}
              </option>

              {selectedCategory && <option disabled>{SEPARADOR}</option>}

              {selectedCategory?.tipos.map((type) => (
                <option key={type.codigo} value={type.codigo}>
                  {type.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1 block font-medium text-gray-700">
              Descripción
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describa el daño..."
              className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            />
          </div>

          {/* Ubicación: en el mapa o con el GPS del dispositivo */}
          <div>
            <p className="mb-2 font-medium text-gray-700">
              Ubicación
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-800 hover:bg-gray-50"
              >
                <IconoMapa />
                Seleccionar en el mapa
              </button>

              <button
                type="button"
                onClick={locateWithGps}
                disabled={locatingGps}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-800 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <IconoUbicacion className={`h-5 w-5 ${locatingGps ? "animate-pulse" : ""}`} />
                {locatingGps ? "Obteniendo ubicación..." : "Usar mi ubicación"}
              </button>
            </div>

            {location ? (
              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <span className="font-medium">
                  {location.origen === "gps" ? "Ubicación del dispositivo" : "Punto seleccionado en el mapa"}:
                </span>{" "}
                <span className="font-mono">{formatearCoordenada(location)}</span>
                {location.precisionMetros !== undefined && (
                  <span className="text-gray-500"> (precisión ±{Math.round(location.precisionMetros)} m)</span>
                )}
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Aún no se ha indicado la ubicación.</p>
            )}

            {locationError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {locationError}
              </p>
            )}
          </div>

          {/* Imagen: desde la cámara o la galería del dispositivo */}
          <div>
            <p className="mb-2 font-medium text-gray-700">
              Imagen
            </p>

            <input
              ref={imageInputRef}
              type="file"
              accept={TIPOS_IMAGEN.join(",")}
              onChange={handleImageChange}
              className="hidden"
              aria-label="Imagen del reporte (galería)"
            />
            {/* capture="environment" abre directamente la cámara trasera en móviles compatibles;
                en escritorio, donde no aplica, el navegador la ignora y abre el selector de archivos. */}
            <input
              ref={cameraInputRef}
              type="file"
              accept={TIPOS_IMAGEN.join(",")}
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
              aria-label="Imagen del reporte (cámara)"
            />

            {image && imagePreview ? (
              <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
                <img src={imagePreview} alt="Vista previa de la imagen" className="h-20 w-20 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{image.name}</p>
                  <p className="text-sm text-gray-500">{formatearTamano(image.size)}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="font-medium text-gray-700 hover:underline">
                    Cambiar
                  </button>
                  <button type="button" onClick={removeImage} className="font-medium text-red-600 hover:underline">
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-400 px-4 py-6 font-medium text-gray-700 hover:bg-gray-50"
                >
                  <IconoCamara />
                  Activar cámara
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-400 px-4 py-6 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Elegir de la galería
                </button>
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">JPEG, PNG o WebP, hasta 10 MB.</p>

            {imageError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {imageError}
              </p>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            {submitting ? "Enviando..." : "Enviar reporte"}
          </button>
        </form>

        {submitError && (
          <p role="alert" className="mt-5 font-medium text-red-600">
            {submitError}
          </p>
        )}
      </div>

      {createdId && <ReporteCreadoModal idReporte={createdId} onClose={closeModal} />}

      {usuarioModalOpen && (
        <UsuarioModal
          usuarios={usuarios}
          actual={usuario}
          error={usuarios.length === 0 ? "No fue posible cargar los usuarios." : ""}
          onSeleccionar={seleccionarUsuario}
          onCrear={agregarUsuario}
          onCerrar={closeUsuarioModal}
        />
      )}

      {mapOpen && (
        <SeleccionUbicacionModal inicial={location} onGuardar={saveMapLocation} onCerrar={closeMap} />
      )}
    </main>
  );
}