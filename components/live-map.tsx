"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ExclamationTriangleIcon, MapPinIcon, SignalIcon } from "@heroicons/react/24/solid";
import { SosAlertCard } from "@/components/sos-alert-card";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import {
  formatCoordinatesCompact,
  formatDistanceKm,
  formatRiderName,
  getDistanceKm,
  isRiderVisible
} from "@/lib/map";

const LeafletMapCanvas = dynamic(
  () =>
    import("@/components/leaflet-map-canvas").then((module) => module.LeafletMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center bg-surface text-sm text-muted">
        Inicializando mapa...
      </div>
    )
  }
);

export function LiveMap() {
  const { profile, activeRiders, alerts, latestPosition, isOnRoute, tracking, error } =
    useRoutePresence();
  const searchParams = useSearchParams();
  const focusedAlertId = searchParams.get("alerta");

  const visibleRiders = useMemo(
    () =>
      activeRiders.filter((rider) => rider.id !== profile?.id).filter(isRiderVisible),
    [activeRiders, profile?.id]
  );
  const emergencyAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === "active"),
    [alerts]
  );
  const focusedAlertPosition = useMemo(() => {
    if (!focusedAlertId) {
      return null;
    }

    const alert = emergencyAlerts.find((item) => item.id === focusedAlertId);

    return alert
      ? {
          latitude: alert.latitude,
          longitude: alert.longitude
        }
      : null;
  }, [emergencyAlerts, focusedAlertId]);
  const nearestRiderDistance = useMemo(() => {
    if (!latestPosition || !visibleRiders.length) {
      return null;
    }

    const distances = visibleRiders
      .map((rider) =>
        rider.latitude !== null && rider.longitude !== null
          ? getDistanceKm(latestPosition, {
              latitude: rider.latitude,
              longitude: rider.longitude
            })
          : null
      )
      .filter((distance): distance is number => distance !== null);

    return distances.length ? Math.min(...distances) : null;
  }, [latestPosition, visibleRiders]);
  const nearestAlertDistance = useMemo(() => {
    if (!latestPosition || !emergencyAlerts.length) {
      return null;
    }

    const distances = emergencyAlerts
      .map((alert) =>
        getDistanceKm(latestPosition, {
          latitude: alert.latitude,
          longitude: alert.longitude
        })
      )
      .filter((distance): distance is number => distance !== null);

    return distances.length ? Math.min(...distances) : null;
  }, [emergencyAlerts, latestPosition]);

  return (
    <section className="space-y-4">
      <div className="panel-blur overflow-hidden rounded-[2rem]">
        <LeafletMapCanvas
          latestPosition={latestPosition}
          focusedPosition={focusedAlertPosition}
          focusedAlertId={focusedAlertId}
          visibleRiders={visibleRiders}
          emergencyAlerts={emergencyAlerts}
        />
        <div className="grid grid-cols-3 gap-2 border-t border-white/8 bg-black/25 px-4 py-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-accent shadow-[0_0_12px_rgba(0,229,168,.6)]" />
            Tu posicion
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-warning shadow-[0_0_12px_rgba(255,181,71,.6)]" />
            Companeros
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-danger shadow-[0_0_12px_rgba(255,77,109,.65)]" />
            SOS
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="panel-blur rounded-[1.5rem] p-4">
          <div className="flex items-center gap-2 text-muted">
            <SignalIcon className="h-5 w-5 text-accent" />
            <span className="text-sm">Estado de ruta</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-ink">
            {isOnRoute ? "Compartiendo" : "Inactivo"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {tracking ? "Actualizando cada 10s" : "Activa tu ruta para publicar posicion"}
          </p>
        </div>

        <div className="panel-blur rounded-[1.5rem] p-4">
          <div className="flex items-center gap-2 text-muted">
            <MapPinIcon className="h-5 w-5 text-warning" />
            <span className="text-sm">Companeros</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-ink">{visibleRiders.length}</p>
          <p className="mt-1 text-sm text-muted">
            {nearestRiderDistance !== null
              ? `Mas cercano a ${formatDistanceKm(nearestRiderDistance)}`
              : "Activos y visibles en este momento"}
          </p>
        </div>

        <div className="panel-blur rounded-[1.5rem] p-4">
          <div className="flex items-center gap-2 text-muted">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger" />
            <span className="text-sm">SOS activos</span>
          </div>
          <p className="mt-3 text-lg font-semibold text-danger">{emergencyAlerts.length}</p>
          <p className="mt-1 text-sm text-muted">
            {nearestAlertDistance !== null
              ? `Mas cercano a ${formatDistanceKm(nearestAlertDistance)}`
              : "Marcados en rojo en el mapa"}
          </p>
        </div>

        <div className="panel-blur rounded-[1.5rem] p-4">
          <p className="text-sm text-muted">Mi posicion</p>
          <p className="mt-3 text-sm font-medium text-ink">
            {latestPosition
              ? formatCoordinatesCompact(latestPosition.latitude, latestPosition.longitude)
              : "Sin coordenadas publicadas"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {profile?.location_updated_at
              ? `Actualizada ${new Date(profile.location_updated_at).toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}`
              : "Esperando geolocalizacion"}
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section className="panel-blur rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Activos ahora</h2>
          <span className="text-sm text-muted">Visible solo en ruta</span>
        </div>
        <div className="mt-4 space-y-3">
          {visibleRiders.length ? (
            visibleRiders.map((rider) => (
              <div
                key={rider.id}
                className="flex items-center justify-between rounded-2xl border border-line/70 bg-surface/90 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{formatRiderName(rider)}</p>
                  <p className="text-sm text-muted">
                    {rider.bike_model || "Moto no registrada"} · {rider.city || "Ciudad sin registrar"} ·{" "}
                    {rider.latitude !== null && rider.longitude !== null
                      ? formatDistanceKm(
                          getDistanceKm(latestPosition, {
                            latitude: rider.latitude,
                            longitude: rider.longitude
                          })
                        )
                      : "Sin referencia"}
                  </p>
                </div>
                <span
                  className={`text-xs uppercase tracking-[0.24em] ${
                    rider.emergency_state === "emergency" ? "text-danger" : "text-accent"
                  }`}
                >
                  {rider.emergency_state === "emergency" ? "SOS" : "Activo"}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-4 text-sm text-muted">
              Aun no hay companeros activos con ubicacion publicada.
            </div>
          )}
        </div>
      </section>

      <section className="panel-blur rounded-[1.75rem] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Emergencias activas</h2>
          <span className="text-sm text-danger">{emergencyAlerts.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {emergencyAlerts.length ? (
            emergencyAlerts.map((alert) => (
              <div key={alert.id} className="space-y-2">
                <SosAlertCard alert={alert} />
                <p className="px-1 text-xs text-muted">
                  Distancia desde ti:{" "}
                  {formatDistanceKm(
                    getDistanceKm(latestPosition, {
                      latitude: alert.latitude,
                      longitude: alert.longitude
                    })
                  )}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-4 text-sm text-muted">
              No hay emergencias activas visibles.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
