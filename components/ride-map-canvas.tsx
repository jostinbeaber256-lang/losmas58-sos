"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { Coordinates, RideParticipant } from "@/lib/types";
import { DEFAULT_CENTER, formatCoordinatesCompact } from "@/lib/map";

function formatRideTime(value: string | null) {
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

function getParticipantName(participant: RideParticipant) {
  return participant.full_name || participant.username || "Motero Los+58";
}

function isInactive(value: string | null) {
  if (!value) {
    return false;
  }

  return Date.now() - new Date(value).getTime() > 15 * 60 * 1000;
}

function getParticipantStatus(participant: RideParticipant) {
  if (participant.attendance_status === "declined") {
    return "No asistira";
  }

  if (participant.live_route_enabled) {
    return isInactive(participant.last_seen_at) ? "Detenido" : "En ruta";
  }

  if (participant.attendance_status === "confirmed") {
    return "Confirmado";
  }

  return "Pendiente";
}

function getParticipantTone(participant: RideParticipant, currentUserId: string | null) {
  if (participant.is_admin) {
    return {
      label: "Admin",
      color: "#ff8a3d",
      glow: "0 0 24px rgba(255,138,61,.7)",
      border: participant.user_id === currentUserId ? "#ffffff" : "#ffd0ad"
    };
  }

  if (participant.attendance_status === "confirmed") {
    return {
      label: "Confirmado",
      color: "#2f80ff",
      glow: "0 0 24px rgba(47,128,255,.7)",
      border: participant.user_id === currentUserId ? "#ffffff" : "#9cc4ff"
    };
  }

  return {
    label: "Usuario",
    color: "#00e5a8",
    glow: "0 0 22px rgba(0,229,168,.62)",
    border: participant.user_id === currentUserId ? "#ffffff" : "#9bffe5"
  };
}

function createRideIcon(participant: RideParticipant, currentUserId: string | null) {
  const status = getParticipantStatus(participant);
  const tone = getParticipantTone(participant, currentUserId);
  const stale = status === "Detenido";
  const isCurrentUser = participant.user_id === currentUserId;
  const size = isCurrentUser ? 34 : 28;
  const innerSize = isCurrentUser ? 12 : 8;
  const color = stale ? "#ffb547" : tone.color;
  const glow = stale ? "0 0 24px rgba(255,181,71,.75)" : tone.glow;

  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:${isCurrentUser ? 3 : 2}px solid ${tone.border};box-shadow:${glow};position:relative;"><div style="width:${innerSize}px;height:${innerSize}px;border-radius:999px;background:#07101d;border:1px solid rgba(255,255,255,.45);"></div>${isCurrentUser ? '<div style="position:absolute;inset:-7px;border:1px solid rgba(255,255,255,.42);border-radius:999px;"></div>' : ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function buildRidePopup(participant: RideParticipant, currentUserId: string | null) {
  const status = getParticipantStatus(participant);
  const tone = getParticipantTone(participant, currentUserId);
  const coordinates =
    participant.current_lat !== null && participant.current_lng !== null
      ? formatCoordinatesCompact(participant.current_lat, participant.current_lng)
      : "Sin coordenadas";

  return `
    <div class="alert-popup">
      <div class="alert-popup__header">
        <span class="alert-popup__type">Rodada grupal</span>
        <span class="alert-popup__status">${status}</span>
      </div>
      <div class="alert-popup__name">${getParticipantName(participant)}</div>
      <div class="alert-popup__time">${formatRideTime(participant.last_seen_at || participant.updated_at)}</div>
      <div class="alert-popup__body">
        <div class="alert-popup__panel">
          <span class="alert-popup__label">Tipo</span>
          <p class="alert-popup__description">${participant.user_id === currentUserId ? "Tu marcador" : tone.label}</p>
        </div>
        <div class="alert-popup__stack">
          <div class="alert-popup__row">
            <span class="alert-popup__label">Ciudad</span>
            <p>${participant.city || "Sin ciudad"}</p>
          </div>
          <div class="alert-popup__row">
            <span class="alert-popup__label">Estado</span>
            <p>${status}</p>
          </div>
          <div class="alert-popup__row">
            <span class="alert-popup__label">Ubicacion</span>
            <p class="alert-popup__mono">${coordinates}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function FitBounds({
  participants,
  request,
  initialLoad,
  setInitialLoad
}: {
  participants: RideParticipant[];
  request: number;
  initialLoad: boolean;
  setInitialLoad: (value: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    // Solo recentrar si es carga inicial o solicitud manual del usuario
    if (!initialLoad && request === 0) {
      return;
    }

    const points = participants
      .filter(
        (participant) =>
          typeof participant.current_lat === "number" &&
          typeof participant.current_lng === "number"
      )
      .map((participant) => [participant.current_lat!, participant.current_lng!] as [number, number]);

    if (!points.length) {
      return;
    }

    if (points.length === 1) {
      map.flyTo(points[0], 14, { animate: true, duration: 0.7 });
    } else {
      map.fitBounds(L.latLngBounds(points), {
        padding: [34, 34],
        animate: true,
        duration: 0.7
      });
    }

    // Marcar que ya no es carga inicial después del primer centrado
    if (initialLoad) {
      setInitialLoad(false);
    }
  }, [map, participants, request, initialLoad, setInitialLoad]);

  return null;
}

function RideMarkers({
  participants,
  currentUserId
}: {
  participants: RideParticipant[];
  currentUserId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    const markerLayer = L.layerGroup();

    for (const participant of participants) {
      if (
        participant.current_lat === null ||
        participant.current_lng === null ||
        participant.attendance_status !== "confirmed" ||
        !participant.live_route_enabled
      ) {
        continue;
      }

      const marker = L.marker([participant.current_lat, participant.current_lng], {
        icon: createRideIcon(participant, currentUserId)
      }).bindPopup(buildRidePopup(participant, currentUserId));

      markerLayer.addLayer(marker);
    }

    map.addLayer(markerLayer);

    return () => {
      map.removeLayer(markerLayer);
    };
  }, [currentUserId, map, participants]);

  return null;
}

export function RideMapCanvas({
  participants,
  currentUserId
}: {
  participants: RideParticipant[];
  currentUserId: string | null;
}) {
  const [fitRequest, setFitRequest] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const liveParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.attendance_status === "confirmed" &&
          participant.live_route_enabled &&
          typeof participant.current_lat === "number" &&
          typeof participant.current_lng === "number"
      ),
    [participants]
  );
  const centerPosition = liveParticipants[0]
    ? {
        latitude: liveParticipants[0].current_lat!,
        longitude: liveParticipants[0].current_lng!
      }
    : null;
  const center: [number, number] = centerPosition
    ? [centerPosition.latitude, centerPosition.longitude]
    : [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setFitRequest((value) => value + 1)}
        disabled={!liveParticipants.length}
        className="absolute right-3 top-3 z-[500] rounded-full border border-white/10 bg-[#07101d]/90 px-3 py-2 text-xs font-semibold text-ink shadow-[0_12px_28px_rgba(0,0,0,.28)] backdrop-blur transition hover:border-accent/30 hover:text-accent disabled:opacity-50"
      >
        Centrar grupo
      </button>
      <MapContainer
        center={center}
        zoom={centerPosition ? 13 : 10}
        scrollWheelZoom
        className="h-72 w-full md:h-80"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds participants={liveParticipants} request={fitRequest} initialLoad={initialLoad} setInitialLoad={setInitialLoad} />
        <RideMarkers participants={liveParticipants} currentUserId={currentUserId} />
      </MapContainer>
    </div>
  );
}
