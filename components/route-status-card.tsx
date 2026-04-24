"use client";

import Link from "next/link";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

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

  return (
    <section className="panel-blur overflow-hidden rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted">
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
        <div className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {profile?.emergency_state === "emergency"
            ? "SOS activo"
            : isOnRoute
              ? "Compartiendo"
              : "Privado hasta salir"}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line/70 bg-surface/90 px-4 py-3 text-sm text-muted">
        {latestPosition ? (
          <span>
            Posicion actual: {latestPosition.latitude.toFixed(5)},{" "}
            {latestPosition.longitude.toFixed(5)}
          </span>
        ) : (
          <span>Sin ubicacion publicada todavia.</span>
        )}
        <span className="ml-2 text-accent">{tracking ? "Sync 10s" : ""}</span>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={toggleRoute}
          disabled={loading}
          className="rounded-2xl bg-accent px-4 py-3 font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Actualizando..." : isOnRoute ? "Detener ruta" : "Iniciar ruta"}
        </button>
        <Link
          href="/mapa"
          className="rounded-2xl border border-line bg-surface px-4 py-3 text-center font-semibold text-ink transition hover:border-accent/40"
        >
          Ver mapa
        </Link>
      </div>
    </section>
  );
}
