"use client";

import { AlertPreview } from "@/components/alert-preview";
import { RouteToggleButton } from "@/components/route-toggle-button";
import { SosButton } from "@/components/sos-button";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import {
  BoltIcon,
  SignalIcon
} from "@heroicons/react/24/solid";

export default function HomePage() {
  const { alerts, activeSosAlert, profile, sosFeedback } = useRoutePresence();
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

  return (
    <main className="space-y-6 md:space-y-7">
      <section className="los-hero">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-danger/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-accent/8 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div className="los-section-head los-section-head-center sm:items-start sm:text-left">
              <div className="los-chip los-chip-accent mx-auto sm:mx-0">
                <SignalIcon className="h-4 w-4" />
                Ruta segura
              </div>
              <h1 className="los-section-title mx-auto max-w-2xl sm:mx-0">
                Dashboard de seguridad para rodar conectado.
              </h1>
              <p className="los-section-copy mx-auto max-w-xl sm:mx-0">
                Activa tu ruta, mantente visible para tu grupo y dispara un SOS
                con ubicacion en vivo cuando cada segundo cuenta.
              </p>
            </div>

            <div className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_0_24px_rgba(32,211,238,0.06)] ${routeStatusTone}`}>
              {routeStatusLabel}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-danger/18 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,77,109,0.28),transparent_34%),radial-gradient(circle_at_15%_85%,rgba(136,19,55,0.18),transparent_36%),linear-gradient(155deg,rgba(21,13,25,0.98),rgba(8,12,22,0.98)_52%,rgba(18,7,14,0.98))] px-6 py-7 text-center shadow-[0_28px_80px_rgba(127,29,29,0.16),inset_0_1px_0_rgba(255,255,255,0.04)] md:px-8 md:py-8">
          <div className="pointer-events-none absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full bg-danger/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/8 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-danger/25 to-transparent" />

          <div className="relative">
            <div className="los-section-head los-section-head-center mx-auto max-w-xl">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-danger/25 bg-danger/10 shadow-[0_0_36px_rgba(255,77,109,0.14)]">
                <BoltIcon className="h-5 w-5 text-danger" />
              </div>
              <p className="los-section-kicker text-danger/80">
                Emergencia
              </p>
              <h2 className="los-section-title text-[1.9rem] sm:text-[2.15rem] md:text-[2.35rem]">
                Respuesta inmediata
              </h2>
              <p className="los-section-copy mx-auto max-w-md">
                Un solo gesto para compartir tu ubicacion y alertar a la comunidad cuando necesitas apoyo real.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <SosButton />
            </div>

            <div
              className={`mx-auto mt-6 max-w-md rounded-[1.6rem] border p-4 text-left shadow-[0_16px_44px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] ${
                activeSosAlert || sosFeedback
                  ? "border-danger/25 bg-[rgba(255,77,109,0.10)]"
                  : "border-white/8 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`text-[11px] uppercase tracking-[0.18em] ${
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
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    activeSosAlert || sosFeedback
                      ? "border-danger/25 bg-danger/12 text-danger"
                      : "border-white/8 bg-white/[0.04] text-muted"
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

            <div className="mx-auto mt-6 max-w-md">
              <div className="rounded-[1.6rem] border border-accent/18 bg-[rgba(32,211,238,0.05)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_16px_rgba(32,211,238,0.06)]">
                <RouteToggleButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="los-card">
        <AlertPreview alerts={alerts} />
      </section>
    </main>
  );
}
