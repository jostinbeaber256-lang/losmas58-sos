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
    setBufferedParticipants(liveParticipants);

    bufferTimeoutRef.current = setInterval(() => {
      setBufferedParticipants(liveParticipants);
    }, 20000);

    return () => {
      if (bufferTimeoutRef.current) {
        clearInterval(bufferTimeoutRef.current);
        bufferTimeoutRef.current = null;
      }
    };
  }, [liveParticipants]);

  return <RideMapCanvas participants={bufferedParticipants} currentUserId={currentUserId} />;
}
