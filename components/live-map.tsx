"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ExclamationTriangleIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SignalIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { SosAlertCard } from "@/components/sos-alert-card";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import {
  formatCoordinatesCompact,
  formatDistanceKm,
  formatRiderName,
  getDistanceKm,
  isRiderVisible
} from "@/lib/map";
import {
  getDevicePosition,
  getGeolocationPermissionState,
  type GeolocationPermissionState
} from "@/lib/geolocation";

const LeafletMapCanvas = dynamic(
  () =>
    import("@/components/leaflet-map-canvas").then((module) => module.LeafletMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[430px] w-full items-center justify-center bg-surface text-sm text-muted md:h-[560px]">
        Inicializando mapa...
      </div>
    )
  }
);

export function LiveMap() {
  const { profile, activeRiders, alerts, latestPosition, isOnRoute, tracking, error } =
    useRoutePresence();
  const [locationPermission, setLocationPermission] =
    useState<GeolocationPermissionState>("unknown");
  const [locationPermissionMessage, setLocationPermissionMessage] = useState<string | null>(null);
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

  const mapStats = [
    {
      label: "Ruta",
      value: isOnRoute ? "Compartiendo" : "Inactiva",
      detail: tracking ? "Sync cada 10s" : "Activa ruta para publicar",
      icon: SignalIcon,
      tone: isOnRoute ? "text-accent" : "text-muted"
    },
    {
      label: "Companeros",
      value: visibleRiders.length,
      detail:
        nearestRiderDistance !== null
          ? `Mas cercano a ${formatDistanceKm(nearestRiderDistance)}`
          : "Visibles en ruta",
      icon: UserGroupIcon,
      tone: "text-warning"
    },
    {
      label: "SOS activos",
      value: emergencyAlerts.length,
      detail:
        nearestAlertDistance !== null
          ? `Mas cercano a ${formatDistanceKm(nearestAlertDistance)}`
          : "Alertas en el mapa",
      icon: ExclamationTriangleIcon,
      tone: "text-danger"
    },
    {
      label: "Mi posicion",
      value: latestPosition
        ? formatCoordinatesCompact(latestPosition.latitude, latestPosition.longitude)
        : "Sin coordenadas",
      detail: profile?.location_updated_at
        ? `Actualizada ${new Date(profile.location_updated_at).toLocaleTimeString("es-VE", {
            hour: "2-digit",
            minute: "2-digit"
          })}`
        : latestPosition
          ? "GPS sin timestamp"
          : locationPermission === "granted"
            ? "GPS sin señal"
            : "Esperando GPS",
      icon: MapPinIcon,
      tone: "text-accent"
    }
  ];
  const legendItems = [
    {
      label: "Mi ubicacion",
      dot: "bg-accent shadow-[0_0_14px_rgba(0,229,168,.7)]"
    },
    {
      label: "Companeros",
      dot: "bg-warning shadow-[0_0_14px_rgba(255,181,71,.65)]"
    },
    {
      label: "SOS activos",
      dot: "bg-danger shadow-[0_0_14px_rgba(255,77,109,.7)]"
    }
  ];

  useEffect(() => {
    let cancelled = false;

    async function requestMapLocationPermission() {
      console.log("🗺️ MAP: Checking location permissions for map");
      const state = await getGeolocationPermissionState();
      
      console.log("🗺️ MAP: Permission state result", { state });

      if (cancelled) {
        return;
      }

      setLocationPermission(state);

      if (state === "granted") {
        console.log("✅ MAP: Location permission already granted");
        return;
      }

      if (state === "denied" || state === "unsupported") {
        console.log("🚫 MAP: Location permission denied or unsupported");
        return;
      }

      // Solo solicitar permiso si es "prompt" o "unknown"
      console.log("🙏 MAP: Requesting location permission for map");
      try {
        await getDevicePosition();

        if (!cancelled) {
          console.log("✅ MAP: Location permission granted after request");
          setLocationPermission("granted");
          setLocationPermissionMessage("Permiso de ubicacion concedido para el mapa.");
        }
      } catch (permissionError) {
        if (!cancelled) {
          console.log("❌ MAP: Location permission request failed", permissionError);
          setLocationPermission("denied");
          setLocationPermissionMessage(
            permissionError instanceof Error
              ? permissionError.message
              : "No se pudo solicitar permiso de ubicacion."
          );
        }
      }
    }

    requestMapLocationPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {mapStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="los-card-compact"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.045]">
                  <Icon className={`h-5 w-5 ${stat.tone}`} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">
                    {stat.label}
                  </p>
                  <p className="mt-1 truncate text-base font-semibold text-ink">
                    {stat.value}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-5 text-muted">{stat.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(32,211,238,0.12),transparent_34%),linear-gradient(180deg,rgba(18,27,43,0.94),rgba(5,8,18,0.98))] p-2 shadow-[0_28px_80px_rgba(0,0,0,0.36)]">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-[1.55rem] border border-white/10">
          <LeafletMapCanvas
            latestPosition={latestPosition}
            focusedPosition={focusedAlertPosition}
            focusedAlertId={focusedAlertId}
            visibleRiders={visibleRiders}
            emergencyAlerts={emergencyAlerts}
          />
        </div>
        <div className="relative grid gap-2 px-2 pb-2 pt-3 text-xs text-muted sm:grid-cols-3">
          {legendItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2"
            >
              <span className={`h-3 w-3 rounded-full ${item.dot}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {locationPermission !== "granted" || locationPermissionMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            locationPermission === "denied"
              ? "border-danger/25 bg-danger/10 text-danger"
              : locationPermission === "unsupported"
                ? "border-warning/25 bg-warning/10 text-warning"
                : "border-warning/25 bg-warning/10 text-warning"
          }`}
        >
          <p className="font-semibold">
            Ubicacion:{" "}
            {locationPermission === "denied"
              ? "permiso denegado"
              : locationPermission === "unsupported"
                ? "no soportada"
                : locationPermission === "prompt"
                  ? "permiso pendiente"
                  : locationPermission === "unknown"
                    ? "verificando"
                    : "estado desconocido"}
          </p>
          <p className="mt-1 leading-5">
            {locationPermissionMessage ||
              (locationPermission === "prompt"
                ? "Se necesita permiso de ubicacion. Toca 'Iniciar ruta' o 'Ver mapa' para solicitarlo."
                : locationPermission === "unknown"
                  ? "Verificando permisos de ubicacion..."
                  : "Android requiere permiso para mostrar tu posicion en el mapa.")}
          </p>
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="los-card">
          <div className="pointer-events-none absolute -right-20 top-0 h-44 w-44 rounded-full bg-warning/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-warning/80">
                En ruta
              </p>
              <h2 className="mt-2 text-lg font-semibold text-ink">
                Activos ahora
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Companeros visibles mientras mantienen su ruta activa.
              </p>
            </div>
            <span className="los-chip los-chip-warning">
              {visibleRiders.length}
            </span>
          </div>

          <div className="relative mt-4 space-y-3">
            {visibleRiders.length ? (
              visibleRiders.map((rider) => (
                <div
                  key={rider.id}
                  className="los-info-panel flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {formatRiderName(rider)}
                    </p>
                    <p className="mt-1 break-words text-sm leading-5 text-muted">
                      {rider.bike_model || "Moto no registrada"} /{" "}
                      {rider.city || "Ciudad sin registrar"} /{" "}
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
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      rider.emergency_state === "emergency"
                        ? "border-danger/25 bg-danger/10 text-danger"
                        : "border-accent/25 bg-accent/10 text-accent"
                    }`}
                  >
                    {rider.emergency_state === "emergency" ? "SOS" : "Activo"}
                  </span>
                </div>
              ))
            ) : (
              <div className="los-empty py-5 text-sm leading-6 text-muted">
                Aun no hay companeros activos con ubicacion publicada.
              </div>
            )}
          </div>
        </div>

        <div className="los-card">
          <div className="pointer-events-none absolute -right-20 top-0 h-44 w-44 rounded-full bg-danger/12 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-danger/80">
                Emergencias
              </p>
              <h2 className="mt-2 text-lg font-semibold text-ink">
                SOS activos
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Alertas abiertas reflejadas tambien en el mapa.
              </p>
            </div>
            <span className="los-chip los-chip-danger">
              {emergencyAlerts.length}
            </span>
          </div>

          <div className="relative mt-4 space-y-3">
            {emergencyAlerts.length ? (
              emergencyAlerts.map((alert) => (
                <div key={alert.id} className="space-y-2">
                  <SosAlertCard alert={alert} />
                  <p className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-muted">
                    Distancia desde ti:{" "}
                    <span className="font-semibold text-accent">
                      {formatDistanceKm(
                        getDistanceKm(latestPosition, {
                          latitude: alert.latitude,
                          longitude: alert.longitude
                        })
                      )}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <div className="los-empty py-6">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-accent/20 bg-accent/10">
                  <ShieldCheckIcon className="h-6 w-6 text-accent" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">
                  Sin emergencias activas
                </p>
                <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-muted">
                  Si entra un SOS, aparecera aqui y el mapa lo resaltara.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
