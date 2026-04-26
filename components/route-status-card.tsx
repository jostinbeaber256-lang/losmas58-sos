"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { ClockIcon, MapPinIcon, SignalIcon } from "@heroicons/react/24/solid";
import {
  getGeolocationPermissionState,
  type GeolocationPermissionState
} from "@/lib/geolocation";

export function RouteStatusCard() {
  const {
    profile,
    isOnRoute,
    latestPosition,
    loading,
    tracking,
    error,
    toggleRoute
  } = useRoutePresence();
  const [permissionState, setPermissionState] =
    useState<GeolocationPermissionState>("unknown");

  useEffect(() => {
    getGeolocationPermissionState().then(setPermissionState);
  }, [isOnRoute, latestPosition]);

  const syncLabel = profile?.location_updated_at
    ? new Date(profile.location_updated_at).toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Sin sync";
  const statusLabel =
    profile?.emergency_state === "emergency"
      ? "SOS activo"
      : isOnRoute
        ? "Compartiendo"
        : "Privado";
  const statusClass =
    profile?.emergency_state === "emergency"
      ? "border-danger/35 bg-danger/15 text-danger"
      : isOnRoute
        ? "border-accent/35 bg-accent/12 text-accent"
        : "border-white/10 bg-white/5 text-muted";
  const permissionLabel = {
    granted: "Permiso concedido",
    prompt: "Permiso pendiente",
    denied: "Permiso denegado",
    unsupported: "No soportado",
    unknown: "Por confirmar"
  }[permissionState];
  const permissionClass =
    permissionState === "granted"
      ? "border-accent/25 bg-accent/10 text-accent"
      : permissionState === "denied"
        ? "border-danger/25 bg-danger/10 text-danger"
        : "border-warning/25 bg-warning/10 text-warning";

  return (
    <section className="los-card md:p-6">
      <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-accent/80">
            Estado de ruta
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {isOnRoute ? "Modo ruta activo" : "Modo ruta inactivo"}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            {isOnRoute
              ? "Tu ubicacion se comparte en vivo y se actualiza en Supabase cada 10 segundos."
              : "Cuando actives el modo ruta, tu ubicacion se compartira en vivo solo durante el trayecto."}
          </p>
        </div>
        <div className={`los-chip shrink-0 ${statusClass}`}>
          {statusLabel}
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <div className="los-info-panel p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted">
            <MapPinIcon className="h-4 w-4 text-accent" />
            Ubicacion
          </div>
          <p className="mt-2 break-words text-sm font-semibold text-ink">
            {latestPosition
              ? `${latestPosition.latitude.toFixed(5)}, ${latestPosition.longitude.toFixed(5)}`
              : "Sin ubicacion publicada"}
          </p>
        </div>

        <div className="los-info-panel p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted">
            <ClockIcon className="h-4 w-4 text-accent" />
            Sincronizacion
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">
            {tracking ? "Cada 10 segundos" : syncLabel}
          </p>
          {tracking ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent">
              <SignalIcon className="h-3.5 w-3.5" />
              En vivo
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="relative mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              Permiso de ubicacion
            </p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {permissionState === "denied"
                ? "Android bloqueo la ubicacion. Abre ajustes de la app y permite ubicacion."
                : "Se pedira al activar ruta, entrar al mapa o enviar un SOS."}
            </p>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${permissionClass}`}>
            {permissionLabel}
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={toggleRoute}
          disabled={loading}
          className="los-action-primary"
        >
          {loading ? "Actualizando..." : isOnRoute ? "Detener ruta" : "Iniciar ruta"}
        </button>
        <Link
          href="/mapa"
          className="los-action-ghost"
        >
          Ver mapa
        </Link>
      </div>
    </section>
  );
}
