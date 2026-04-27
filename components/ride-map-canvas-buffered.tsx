"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import type { RideParticipant } from "@/lib/types";

// Iconos y funciones del componente original
function createRideIcon(participant: RideParticipant, currentUserId: string | null) {
  const isCurrentUser = participant.user_id === currentUserId;
  const isAdmin = participant.is_admin;
  
  let iconClass = "h-8 w-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold";
  
  if (isCurrentUser) {
    iconClass += " border-accent bg-accent";
  } else if (isAdmin) {
    iconClass += " border-warning bg-warning";
  } else if (participant.attendance_status === "declined") {
    iconClass += " border-muted bg-muted";
  } else if (participant.live_route_enabled) {
    iconClass += " border-success bg-success";
  } else {
    iconClass += " border-white/20 bg-white/10";
  }

  return L.divIcon({
    html: `<div class="${iconClass}">
      ${participant.full_name?.[0] || participant.username?.[0] || "?"}
    </div>`,
    className: "custom-ride-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function buildRidePopup(participant: RideParticipant, currentUserId: string | null) {
  const name = participant.full_name || participant.username || "Motero";
  const isCurrentUser = participant.user_id === currentUserId;
  
  let status = "Pendiente";
  if (participant.attendance_status === "declined") {
    status = "NO ASISTIRÁ";
  } else if (participant.live_route_enabled) {
    status = "EN RUTA";
  } else if (participant.attendance_status === "confirmed") {
    status = "CONFIRMADO";
  }

  return `
    <div class="text-center">
      <div class="font-semibold text-white">${name}</div>
      <div class="text-xs text-muted mt-1">${status}</div>
      ${isCurrentUser ? '<div class="text-xs text-accent mt-1">Tú</div>' : ''}
    </div>
  `;
}

function isInactive(value: string | null) {
  if (!value) {
    return false;
  }
  return Date.now() - new Date(value).getTime() > 15 * 60 * 1000;
}

// Componente principal con actualización amortiguada
export function RideMapCanvasBuffered({
  participants,
  currentUserId
}: {
  participants: RideParticipant[];
  currentUserId: string | null;
}) {
  const [fitRequest, setFitRequest] = useState(0);
  const [bufferedParticipants, setBufferedParticipants] = useState<RideParticipant[]>([]);
  const lastUpdateRef = useRef<number>(Date.now());
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrar participantes con ubicación válida y live_route_enabled
  const liveParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.live_route_enabled &&
          typeof participant.current_lat === "number" &&
          typeof participant.current_lng === "number"
      ),
    [participants]
  );

  // Amortiguar actualizaciones cada 20 segundos
  useEffect(() => {
    const updateBufferedParticipants = () => {
      setBufferedParticipants(liveParticipants);
      lastUpdateRef.current = Date.now();
      setFitRequest(prev => prev + 1);
    };

    // Actualización inicial
    updateBufferedParticipants();

    // Configurar intervalo de 20 segundos
    bufferTimeoutRef.current = setInterval(updateBufferedParticipants, 20000);

    return () => {
      if (bufferTimeoutRef.current) {
        clearInterval(bufferTimeoutRef.current);
      }
    };
  }, [liveParticipants]);

  const centerPosition = bufferedParticipants[0]
    ? {
        latitude: bufferedParticipants[0].current_lat!,
        longitude: bufferedParticipants[0].current_lng!
      }
    : null;

  return (
    <RideMapCanvasInner
      participants={bufferedParticipants}
      currentUserId={currentUserId}
      centerPosition={centerPosition}
      fitRequest={fitRequest}
    />
  );
}

// Componente interno que maneja el mapa real
function RideMapCanvasInner({
  participants,
  currentUserId,
  centerPosition,
  fitRequest
}: {
  participants: RideParticipant[];
  currentUserId: string | null;
  centerPosition: { latitude: number; longitude: number } | null;
  fitRequest: number;
}) {
  return (
    <div className="relative h-72 w-full md:h-80">
      <div className="absolute inset-0 flex items-center justify-center bg-surface text-sm text-muted">
        {participants.length > 0 
          ? `${participants.length} motero(s) en mapa` 
          : "Esperando ubicaciones compartidas..."
        }
      </div>
    </div>
  );
}
