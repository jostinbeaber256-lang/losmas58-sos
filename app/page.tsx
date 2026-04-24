"use client";

import { AlertPreview } from "@/components/alert-preview";
import { RouteStatusCard } from "@/components/route-status-card";
import { SosButton } from "@/components/sos-button";
import { ScreenHeader } from "@/components/screen-header";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import {
  formatDistanceKm,
  formatRiderName,
  getDistanceKm,
  isRiderVisible
} from "@/lib/map";

export default function HomePage() {
  const { alerts, activeRiders, activeSosAlert, latestPosition, profile } =
    useRoutePresence();
  const visibleRiders = activeRiders
    .filter((rider) => rider.id !== profile?.id)
    .filter(isRiderVisible);

  return (
    <main className="space-y-6">
      <ScreenHeader
        eyebrow="Ruta segura"
        title="Siempre visibles. Siempre conectados."
        description="Activa tu modo ruta, comparte ubicacion solo mientras ruedas y dispara una alerta SOS con un toque."
      />

      <RouteStatusCard />

      <section className="panel-blur rounded-[2rem] px-5 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-muted">
          Emergencia
        </p>
        <div className="mt-6 flex justify-center">
          <SosButton />
        </div>
        <p className="mx-auto mt-6 max-w-xs text-sm leading-6 text-muted">
          El boton SOS enviara tu ubicacion actual, cambiara tu estado a
          emergencia y reflejara la alerta en el mapa comunitario.
        </p>
        {activeSosAlert ? (
          <div className="mt-6 rounded-[1.5rem] border border-danger/25 bg-danger/10 p-4 text-left">
            <p className="text-xs uppercase tracking-[0.28em] text-danger">
              Estado actual
            </p>
            <p className="mt-2 text-base font-semibold text-ink">
              {profile?.full_name || profile?.username || "Tu perfil"} esta en emergencia activa
            </p>
            <p className="mt-2 text-sm text-muted">
              Los companeros veran tu SOS en el mapa y en la vista de alertas.
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel-blur rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">
              Companeros en ruta
            </h2>
            <span className="text-sm text-accent">{visibleRiders.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {visibleRiders.length ? (
              visibleRiders.slice(0, 3).map((rider) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between rounded-2xl border border-line/70 bg-surface/90 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">{formatRiderName(rider)}</p>
                    <p className="text-sm text-muted">
                      {rider.bike_model || "Moto no registrada"}
                    </p>
                  </div>
                  <span className="text-sm text-accent">
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
              <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-4 text-sm text-muted">
                No hay companeros activos visibles todavia.
              </div>
            )}
          </div>
        </div>

        <AlertPreview alerts={alerts} />
      </section>
    </main>
  );
}
