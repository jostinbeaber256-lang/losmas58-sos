"use client";

import {
  ExclamationTriangleIcon,
  EyeIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SignalIcon
} from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "Sin registro";
  }

  return new Date(value).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function SecurityMonitoringCard() {
  const {
    profile,
    latestPosition,
    loading,
    tracking,
    error,
    toggleContinuousMonitoring,
    toggleEmergencyTracking
  } = useRoutePresence();
  const monitoringActive = Boolean(profile?.continuous_monitoring_enabled);
  const emergencyTrackingActive = Boolean(profile?.emergency_tracking_active);
  const isReporting =
    monitoringActive ||
    emergencyTrackingActive ||
    Boolean(profile?.is_on_route) ||
    profile?.emergency_state === "emergency";
  const coordinates = latestPosition
    ? `${latestPosition.latitude.toFixed(5)}, ${latestPosition.longitude.toFixed(5)}`
    : "Sin ubicacion publicada";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(255,181,71,0.14),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.96),rgba(7,11,20,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:p-6">
      <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-warning/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-warning">
            Seguridad privada
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            Monitoreo continuo
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Controla si tu ubicacion se reporta al panel administrativo incluso
            cuando no estas en ruta comunitaria.
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            emergencyTrackingActive
              ? "border-danger/35 bg-danger/15 text-danger"
              : monitoringActive
                ? "border-warning/30 bg-warning/12 text-warning"
                : "border-white/10 bg-white/[0.045] text-muted"
          }`}
        >
          {emergencyTrackingActive
            ? "Robo/emergencia"
            : monitoringActive
              ? "Monitoreo activo"
              : "Monitoreo off"}
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
        <div className="los-info-panel p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
            <SignalIcon className="h-3.5 w-3.5 text-accent" />
            Reporte
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {isReporting ? "Activo para admin" : "Solo funciones puntuales"}
          </p>
        </div>
        <div className="los-info-panel p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
            <MapPinIcon className="h-3.5 w-3.5 text-accent" />
            Ubicacion
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-ink">
            {coordinates}
          </p>
        </div>
        <div className="los-info-panel p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
            <EyeIcon className="h-3.5 w-3.5 text-accent" />
            Ultimo monitoreo
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {formatTime(profile?.monitoring_updated_at || profile?.location_updated_at)}
          </p>
        </div>
      </div>

      {error ? (
        <p className="relative mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="relative mt-5 grid gap-3">
        <button
          type="button"
          onClick={() => void toggleContinuousMonitoring()}
          disabled={loading}
          className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
            monitoringActive
              ? "border-warning/30 bg-warning/12 text-warning shadow-[0_0_30px_rgba(255,181,71,0.12)]"
              : "border-white/10 bg-white/[0.045] text-ink hover:border-warning/25"
          }`}
        >
          <span>
            <span className="block text-sm font-semibold">
              {monitoringActive ? "Desactivar monitoreo continuo" : "Activar monitoreo continuo"}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              {monitoringActive
                ? "El admin esta recibiendo tu ubicacion periodicamente."
                : "Visible solo para administradores, no para el mapa comunitario."}
            </span>
          </span>
          <span
            className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
              monitoringActive
                ? "border-warning/40 bg-warning/25"
                : "border-white/10 bg-white/10"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                monitoringActive ? "left-6" : "left-1"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={() => void toggleEmergencyTracking()}
          disabled={loading}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
            emergencyTrackingActive
              ? "border border-danger/30 bg-danger/15 text-danger shadow-[0_0_34px_rgba(255,77,109,0.18)]"
              : "border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15"
          }`}
        >
          {emergencyTrackingActive ? (
            <ShieldCheckIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          {emergencyTrackingActive
            ? "Desactivar rastreo robo/emergencia"
            : "Activar modo robo/emergencia"}
        </button>
      </div>

      <p className="relative mt-4 text-xs leading-5 text-muted">
        {tracking
          ? "Reporte en vivo activo. En modo robo/emergencia la app prioriza actualizaciones mas frecuentes mientras permanece abierta o activa."
          : "Cuando este apagado, tu ubicacion solo se reportara al iniciar ruta, enviar SOS o usar funciones que la pidan."}
      </p>
    </section>
  );
}
