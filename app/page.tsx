"use client";

import { AlertPreview } from "@/components/alert-preview";
import { RouteStatusCard } from "@/components/route-status-card";
import { SosButton } from "@/components/sos-button";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import {
  formatDistanceKm,
  formatRiderName,
  getDistanceKm,
  isRiderVisible
} from "@/lib/map";
import {
  BellAlertIcon,
  BoltIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SignalIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";

export default function HomePage() {
  const { alerts, activeRiders, activeSosAlert, latestPosition, profile, sosFeedback } =
    useRoutePresence();
  const visibleRiders = activeRiders
    .filter((rider) => rider.id !== profile?.id)
    .filter(isRiderVisible);
  const activeAlerts = alerts.filter((alert) => alert.status === "active");
  const routeStatusLabel =
    profile?.emergency_state === "emergency"
      ? "SOS activo"
      : profile?.is_on_route
        ? "En ruta"
        : "Privado";
  const routeStatusTone =
    profile?.emergency_state === "emergency"
      ? "border-danger/35 bg-danger/15 text-danger"
      : profile?.is_on_route
        ? "border-accent/35 bg-accent/12 text-accent"
        : "border-white/10 bg-white/5 text-muted";
  const heroStats = [
    {
      label: "Moteros visibles",
      value: visibleRiders.length,
      icon: UserGroupIcon,
      tone: "text-accent"
    },
    {
      label: "SOS activos",
      value: activeAlerts.length,
      icon: BellAlertIcon,
      tone: "text-danger"
    },
    {
      label: "Estado",
      value: routeStatusLabel,
      icon: ShieldCheckIcon,
      tone: profile?.emergency_state === "emergency" ? "text-danger" : "text-accent"
    }
  ];

  return (
    <main className="space-y-5 md:space-y-6">
      <section className="los-hero">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-danger/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div className="max-w-xl">
              <div className="los-chip los-chip-accent mx-auto sm:mx-0">
                <SignalIcon className="h-4 w-4" />
                Ruta segura
              </div>
              <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight text-ink sm:mx-0 md:text-4xl">
                Dashboard de seguridad para rodar conectado.
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted sm:mx-0 md:text-base">
                Activa tu ruta, mantente visible para tu grupo y dispara un SOS
                con ubicacion en vivo cuando cada segundo cuenta.
              </p>
            </div>

            <div className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_0_28px_rgba(32,211,238,0.08)] ${routeStatusTone}`}>
              {routeStatusLabel}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="los-card-compact backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-background/60">
                      <Icon className={`h-5 w-5 ${stat.tone}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted">
                        {stat.label}
                      </p>
                      <p className="mt-1 truncate text-lg font-semibold text-ink">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.03fr_0.97fr] lg:items-stretch">
        <RouteStatusCard />

        <div className="relative overflow-hidden rounded-[2rem] border border-danger/20 bg-[radial-gradient(circle_at_50%_8%,rgba(239,68,68,0.24),transparent_34%),linear-gradient(180deg,rgba(18,27,43,0.94),rgba(8,12,22,0.98))] px-5 py-6 text-center shadow-[0_24px_70px_rgba(127,29,29,0.16)] md:px-6">
          <div className="pointer-events-none absolute inset-x-10 top-10 h-32 rounded-full bg-danger/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.34em] text-danger/80">
                  Emergencia
                </p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  Respuesta inmediata
                </h2>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-danger/25 bg-danger/12">
                <BoltIcon className="h-5 w-5 text-danger" />
              </span>
            </div>

            <div className="mt-5 flex justify-center">
              <SosButton />
            </div>

            <div
              className={`mx-auto mt-5 max-w-md rounded-[1.5rem] border p-4 text-left shadow-[0_0_30px_rgba(239,68,68,0.10)] ${
                activeSosAlert || sosFeedback
                  ? "border-danger/30 bg-danger/12"
                  : "border-white/10 bg-white/[0.045]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-[11px] uppercase tracking-[0.22em] ${
                      activeSosAlert || sosFeedback ? "text-danger" : "text-muted"
                    }`}
                  >
                    Estado SOS
                  </p>
                  <p className="mt-2 break-words text-base font-semibold text-ink">
                    {profile?.full_name || profile?.username || "Tu perfil"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    activeSosAlert || sosFeedback
                      ? "border-danger/30 bg-danger/15 text-danger"
                      : "border-white/10 bg-white/[0.045] text-muted"
                  }`}
                >
                  {activeSosAlert || sosFeedback ? "En vivo" : "Listo"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {activeSosAlert || sosFeedback
                  ? "Tu ubicacion ya fue compartida y la alerta esta visible para la comunidad."
                  : "Pulsa el boton solo si necesitas ayuda inmediata en ruta."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="los-card">
          <div className="pointer-events-none absolute -right-20 top-0 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent/80">
                Grupo
              </p>
              <h2 className="mt-2 text-lg font-semibold text-ink">
                Companeros en ruta
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Moteros activos visibles cerca de tu trayecto.
              </p>
            </div>
            <span className="los-chip los-chip-accent">
              {visibleRiders.length}
            </span>
          </div>
          <div className="relative mt-4 space-y-3">
            {visibleRiders.length ? (
              visibleRiders.slice(0, 3).map((rider) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {formatRiderName(rider)}
                    </p>
                    <p className="text-sm text-muted">
                      {rider.bike_model || "Moto no registrada"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                    {rider.latitude !== null && rider.longitude !== null
                      ? formatDistanceKm(
                          getDistanceKm(latestPosition, {
                            latitude: rider.latitude,
                            longitude: rider.longitude
                          })
                        )
                      : "Sin referencia"}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.035] px-4 py-5 text-sm leading-6 text-muted">
                No hay companeros activos visibles todavia. Cuando alguien
                inicie ruta, aparecera aqui sin que tengas que recargar.
              </div>
            )}
          </div>
        </div>

        <AlertPreview alerts={alerts} />
      </section>
    </main>
  );
}
