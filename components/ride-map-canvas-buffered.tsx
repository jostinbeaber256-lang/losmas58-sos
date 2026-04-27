"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RideMapCanvas } from "@/components/ride-map-canvas";
import type { RideParticipant } from "@/lib/types";

export function RideMapCanvasBuffered({
  participants,
  currentUserId
}: {
  participants: RideParticipant[];
  currentUserId: string | null;
}) {
  const [bufferedParticipants, setBufferedParticipants] = useState<RideParticipant[]>([]);
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Filtrar participantes con ubicación válida y live_route_enabled
  const liveParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.live_route_enabled &&
          typeof participant.current_lat === "number" &&
          typeof participant.current_lng === "number" &&
          Number.isFinite(participant.current_lat) &&
          Number.isFinite(participant.current_lng)
      ),
    [participants]
  );

  useEffect(() => {
    // Solo actualizar bufferedParticipants si realmente cambió el contenido
    const hasChanged = JSON.stringify(bufferedParticipants) !== JSON.stringify(liveParticipants);
    
    if (hasChanged) {
      setBufferedParticipants(liveParticipants);
    }

    // Configurar actualización cada 20 segundos solo para cambios futuros
    if (!bufferTimeoutRef.current) {
      bufferTimeoutRef.current = setInterval(() => {
        // Verificar si hay cambios antes de actualizar
        const currentBuffered = JSON.stringify(bufferedParticipants);
        const newLive = JSON.stringify(liveParticipants);
        
        if (currentBuffered !== newLive) {
          setBufferedParticipants(liveParticipants);
        }
      }, 20000);
    }

    return () => {
      if (bufferTimeoutRef.current) {
        clearInterval(bufferTimeoutRef.current);
        bufferTimeoutRef.current = null;
      }
    };
  }, [liveParticipants]);

  // Marcar que ya no es carga inicial después del primer render
  useEffect(() => {
    if (initialLoadRef.current && bufferedParticipants.length > 0) {
      initialLoadRef.current = false;
    }
  }, [bufferedParticipants]);

  return (
    <RideMapCanvas 
      participants={bufferedParticipants} 
      currentUserId={currentUserId}
    />
  );
}
