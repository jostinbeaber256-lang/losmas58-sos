"use client";

import { AlertPreview } from "@/components/alert-preview";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { BellAlertIcon, ShieldCheckIcon, SignalIcon } from "@heroicons/react/24/solid";

export default function AlertsPage() {
  const { alerts } = useRoutePresence();
  const activeCount = alerts.filter((alert) => alert.status === "active").length;
  const resolvedCount = alerts.filter((alert) => alert.status !== "active").length;

  return (
    <main className="space-y-5 md:space-y-6">
      <section className="los-hero-danger">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-danger/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="los-section-head los-section-head-center max-w-xl lg:items-start lg:text-left">
            <div className="los-chip los-chip-danger">
              <BellAlertIcon className="h-4 w-4" />
              Panel SOS
            </div>
            <h1 className="los-section-title max-w-2xl">
              Alertas abiertas de la comunidad.
            </h1>
            <p className="los-section-copy max-w-xl">
              Prioriza emergencias activas, revisa quien va en camino y coordina
              apoyo rapido entre moteros.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <div className="los-card-compact text-center">
              <BellAlertIcon className="mx-auto h-5 w-5 text-danger" />
              <p className="mt-2 text-lg font-semibold text-ink">{activeCount}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Activas
              </p>
            </div>
            <div className="los-card-compact text-center">
              <ShieldCheckIcon className="mx-auto h-5 w-5 text-accent" />
              <p className="mt-2 text-lg font-semibold text-ink">{resolvedCount}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Cerradas
              </p>
            </div>
            <div className="los-card-compact text-center">
              <SignalIcon className="mx-auto h-5 w-5 text-warning" />
              <p className="mt-2 text-lg font-semibold text-ink">{alerts.length}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Total
              </p>
            </div>
          </div>
        </div>
      </section>
      <AlertPreview alerts={alerts} expanded filterable />
    </main>
  );
}
