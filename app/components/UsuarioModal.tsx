"use client";

import { useEffect, useState } from "react";

import { crearUsuario, type Usuario } from "../lib/usuarios";
import { IconoAgregarUsuario } from "./Iconos";

type Props = {
  usuarios: Usuario[];
  actual: Usuario | null;
  error: string;
  onSeleccionar: (usuario: Usuario) => void;
  onCrear: (usuario: Usuario) => void;
  onCerrar: () => void;
};

// Elegir quién crea el reporte o registrar un usuario nuevo (mientras no haya inicio de sesión).
// Se cierra con Escape, con un clic fuera del cuadro o al elegir un usuario.
export default function UsuarioModal({ usuarios, actual, error, onSeleccionar, onCrear, onCerrar }: Props) {
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorCrear, setErrorCrear] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCerrar();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCerrar]);

  async function handleCrear(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setErrorCrear("");

    try {
      onCrear(await crearUsuario(nombre.trim(), correo.trim()));
    } catch (e) {
      setErrorCrear(e instanceof Error ? e.message : "No fue posible crear el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="usuario-titulo"
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-200 p-5">
          <h2 id="usuario-titulo" className="text-lg font-bold text-gray-900">
            ¿Quién reporta?
          </h2>
          <p className="text-sm text-gray-500">
            Elija el usuario con el que se crearán los reportes.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <ul className="space-y-1">
            {usuarios.map((usuario) => {
              const elegido = usuario.id === actual?.id;
              return (
                <li key={usuario.id}>
                  <button
                    type="button"
                    onClick={() => onSeleccionar(usuario)}
                    aria-current={elegido}
                    className={`flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-100 ${
                      elegido ? "bg-gray-100 ring-1 ring-gray-900" : ""
                    }`}
                  >
                    <span>
                      <span className="block font-medium text-gray-900">{usuario.name}</span>
                      <span className="block text-sm text-gray-500">{usuario.email}</span>
                    </span>
                    {usuario.role === "ADMIN" && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                        Admin
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-gray-200 p-5">
          {agregando ? (
            <form onSubmit={handleCrear} className="space-y-3">
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Nombre"
                aria-label="Nombre"
                required
                maxLength={200}
                autoFocus
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              />
              <input
                type="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                placeholder="Correo"
                aria-label="Correo"
                required
                maxLength={300}
                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              />

              {errorCrear && <p className="text-sm text-red-600">{errorCrear}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAgregando(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {guardando ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAgregando(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              <IconoAgregarUsuario />
              Agregar usuario
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
