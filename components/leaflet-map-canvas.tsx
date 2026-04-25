"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { ActiveRider, Coordinates, SosAlert } from "@/lib/types";
import { getEmergencyMeta } from "@/lib/alert-ui";
import {
  DEFAULT_CENTER,
  formatAlertName,
  formatCoordinatesCompact,
  formatDistanceKm,
  formatPhoneNumber,
  formatRiderName,
  getDistanceKm
} from "@/lib/map";

type FocusedMarker = {
  openPopup: () => void;
};

function formatPopupTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function RecenterMap({ position }: { position: Coordinates | null }) {
  const map = useMap();

  useEffect(() => {
    if (!position) {
      return;
    }

    map.flyTo([position.latitude, position.longitude], 13, {
      animate: true,
      duration: 0.8
    });
  }, [map, position]);

  return null;
}

function createDotIcon({
  size,
  color,
  glow,
  border = "#ffffff",
  innerHtml
}: {
  size: number;
  color: string;
  glow: string;
  border?: string;
  innerHtml?: string;
}) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2px solid ${border};box-shadow:${glow};">${innerHtml || ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function createAlertIcon(type: string | null, isFocused = false) {
  const meta = getEmergencyMeta(type);
  const size = isFocused ? 34 : 28;
  const radius = size / 2;
  const ringInset = isFocused ? -8 : -5;
  const ringRadius = isFocused ? 22 : 18;
  const ringColor = isFocused ? "rgba(255,255,255,.45)" : meta.mapRing;
  const textSize = isFocused ? "11px" : "10px";
  const textColor = isFocused ? "#ffffff" : "#08101f";
  const ringAnimation = isFocused ? "animation:map-alert-focus 1.6s ease-in-out infinite;" : "";

  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:${radius}px;background:${meta.mapColor};border:2px solid #ffffff;box-shadow:${meta.mapGlow};position:relative;${isFocused ? "transform:scale(1.04);" : ""}"><div style="position:absolute;inset:${ringInset}px;border-radius:${ringRadius}px;border:1px solid ${ringColor};${ringAnimation}"></div><span style="position:relative;color:${textColor};font-size:${textSize};font-weight:800;letter-spacing:.08em;">${meta.shortCode}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [radius, radius],
    popupAnchor: [0, -radius]
  });
}

function buildAlertPopup(alert: SosAlert, distance: number | null) {
  const meta = getEmergencyMeta(alert.emergency_type);
  const timeLabel = formatPopupTime(alert.created_at);
  const detail = alert.emergency_details || alert.message || "SOS activo";
  const contact = alert.emergency_contact
    ? formatPhoneNumber(alert.emergency_contact)
    : "No disponible";
  const city = alert.city || "Ciudad no registrada";
  const coordinates = formatCoordinatesCompact(alert.latitude, alert.longitude);
  const statusLabel = alert.status === "resolved" ? "Resuelta" : "Activa";
  const respondersLabel =
    alert.response_count && alert.response_count > 0
      ? `${alert.response_count} ${alert.response_count === 1 ? "motero en camino" : "moteros en camino"}`
      : "Sin respuestas aun";

  return `
    <div class="alert-popup">
      <div class="alert-popup__header">
        <span class="alert-popup__type">${meta.label}</span>
        <span class="alert-popup__status">${statusLabel}</span>
      </div>
      <div class="alert-popup__name">${formatAlertName(alert)}</div>
      ${timeLabel ? `<div class="alert-popup__time">${timeLabel}</div>` : ""}
      <div class="alert-popup__body">
        <div class="alert-popup__panel">
          <p class="alert-popup__description">${detail}</p>
        </div>
        <div class="alert-popup__stack">
          <div class="alert-popup__row">
            <span class="alert-popup__label">Ciudad</span>
            <p>${city}</p>
          </div>
          <div class="alert-popup__row">
            <span class="alert-popup__label">Contacto</span>
            <p>${contact}</p>
          </div>
          <div class="alert-popup__row">
            <span class="alert-popup__label">Ubicacion</span>
            <p class="alert-popup__mono">${coordinates}</p>
          </div>
          <div class="alert-popup__row">
            <span class="alert-popup__label">Apoyo</span>
            <p>${respondersLabel}</p>
          </div>
        </div>
        ${
          alert.medical_summary
            ? `<div class="alert-popup__panel"><div class="alert-popup__label">Ficha medica</div><p class="alert-popup__description">${alert.medical_summary}</p></div>`
            : ""
        }
      </div>
      <div class="alert-popup__footer">
        <div class="alert-popup__distance">Distancia: ${formatDistanceKm(distance)}</div>
        <div class="alert-popup__actions">
          <a class="alert-popup__action alert-popup__action--primary" href="/alertas?alerta=${alert.id}">Ver alerta</a>
          <button class="alert-popup__action alert-popup__action--ghost" type="button" disabled>${alert.current_user_response_status === "on_the_way" ? "En camino" : "Voy en camino"}</button>
        </div>
      </div>
    </div>
  `;
}

function MarkerLayer({
  latestPosition,
  visibleRiders,
  emergencyAlerts,
  focusedAlertId
}: {
  latestPosition: Coordinates | null;
  visibleRiders: ActiveRider[];
  emergencyAlerts: SosAlert[];
  focusedAlertId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    let focusedMarker: FocusedMarker | null = null;
    const markerLayer = L.layerGroup();

    for (const rider of visibleRiders) {
      if (rider.latitude === null || rider.longitude === null) {
        continue;
      }

      const distance = getDistanceKm(latestPosition, {
        latitude: rider.latitude,
        longitude: rider.longitude
      });
      const icon =
        rider.emergency_state === "emergency" ? emergencyRiderIcon : riderIcon;

      const marker = L.marker([rider.latitude, rider.longitude], { icon }).bindPopup(
        `<div class="alert-popup"><div class="alert-popup__header"><span class="alert-popup__type">Companero</span><span class="alert-popup__status">${rider.emergency_state === "emergency" ? "SOS" : "Activo"}</span></div><div class="alert-popup__name">${formatRiderName(rider)}</div><div class="alert-popup__body"><p>${rider.bike_model || "Moto no registrada"}</p><p><strong>Ciudad:</strong> ${rider.city || "Ciudad no registrada"}</p></div><div class="alert-popup__distance">${formatDistanceKm(distance)}</div></div>`
      );

      markerLayer.addLayer(marker);
    }

    for (const alert of emergencyAlerts) {
      const distance = getDistanceKm(latestPosition, {
        latitude: alert.latitude,
        longitude: alert.longitude
      });
      const isFocused = focusedAlertId === alert.id;

      const marker = L.marker([alert.latitude, alert.longitude], {
        icon: createAlertIcon(alert.emergency_type, isFocused)
      }).bindPopup(buildAlertPopup(alert, distance));

      if (isFocused) {
        focusedMarker = marker;
      }

      markerLayer.addLayer(marker);
    }

    map.addLayer(markerLayer);

    const markerToOpen: FocusedMarker | null = focusedMarker;

    if (markerToOpen) {
      ;(markerToOpen as any).openPopup();
    }

    return () => {
      map.removeLayer(markerLayer);
    };
  }, [emergencyAlerts, focusedAlertId, latestPosition, map, visibleRiders]);

  return null;
}

const userIcon = createDotIcon({
  size: 22,
  color: "#00e5a8",
  glow: "0 0 28px rgba(0,229,168,.9)",
  innerHtml:
    '<div style="width:8px;height:8px;border-radius:999px;background:#ffffff;box-shadow:0 0 10px rgba(255,255,255,.8);"></div>'
});

const riderIcon = createDotIcon({
  size: 16,
  color: "#ffb547",
  glow: "0 0 18px rgba(255,181,71,.8)",
  innerHtml:
    '<div style="width:5px;height:5px;border-radius:999px;background:#0b1220;"></div>'
});

const emergencyRiderIcon = createDotIcon({
  size: 18,
  color: "#ff4d6d",
  glow: "0 0 20px rgba(255,77,109,.95)",
  innerHtml:
    '<div style="width:6px;height:6px;border-radius:999px;background:#ffffff;"></div>'
});

export function LeafletMapCanvas({
  latestPosition,
  focusedPosition,
  focusedAlertId,
  visibleRiders,
  emergencyAlerts
}: {
  latestPosition: Coordinates | null;
  focusedPosition: Coordinates | null;
  focusedAlertId: string | null;
  visibleRiders: ActiveRider[];
  emergencyAlerts: SosAlert[];
}) {
  const center = useMemo<[number, number]>(
    () =>
      focusedPosition
        ? [focusedPosition.latitude, focusedPosition.longitude]
        : latestPosition
          ? [latestPosition.latitude, latestPosition.longitude]
          : [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude],
    [focusedPosition, latestPosition]
  );

  return (
    <MapContainer
      center={center}
      zoom={focusedPosition || latestPosition ? 13 : 10}
      scrollWheelZoom
      className="h-[420px] w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap position={focusedPosition || latestPosition} />
      <MarkerLayer
        latestPosition={latestPosition}
        visibleRiders={visibleRiders}
        emergencyAlerts={emergencyAlerts}
        focusedAlertId={focusedAlertId}
      />

      {latestPosition ? (
        <Marker position={[latestPosition.latitude, latestPosition.longitude]} icon={userIcon}>
          <Popup>
            <div className="alert-popup">
              <div className="alert-popup__header">
                <span className="alert-popup__type">Tu posicion</span>
                <span className="alert-popup__status">En ruta</span>
              </div>
              <div className="alert-popup__name">Ubicacion compartida</div>
              <div className="alert-popup__body">
                <p>{formatCoordinatesCompact(latestPosition.latitude, latestPosition.longitude)}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
