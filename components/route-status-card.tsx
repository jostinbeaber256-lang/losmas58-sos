"use client";

import Link from "next/link";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { ClockIcon, MapPinIcon, SignalIcon } from "@heroicons/react/24/solid";

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

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,43,0.96),rgba(7,11,20,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:p-6">
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
        <div className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {statusLabel}
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={toggleRoute}
          disabled={loading}
          className="rounded-2xl bg-accent px-4 py-3 font-semibold text-background shadow-[0_0_28px_rgba(32,211,238,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Actualizando..." : isOnRoute ? "Detener ruta" : "Iniciar ruta"}
        </button>
        <Link
          href="/mapa"
          className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-center font-semibold text-ink transition hover:border-accent/40 hover:bg-accent/10"
        >
          Ver mapa
        </Link>
      </div>
    </section>
  );
}
