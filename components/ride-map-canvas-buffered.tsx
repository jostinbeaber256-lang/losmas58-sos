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
  const liveParticipantsRef = useRef<RideParticipant[]>([]);
  const bufferedParticipantsRef = useRef<RideParticipant[]>([]);
  const initialLoadRef = useRef(true);

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
    liveParticipantsRef.current = liveParticipants;

    if (initialLoadRef.current) {
      setBufferedParticipants(liveParticipants);
      initialLoadRef.current = false;
    }
  }, [liveParticipants]);

  useEffect(() => {
    bufferedParticipantsRef.current = bufferedParticipants;
  }, [bufferedParticipants]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentBuffered = JSON.stringify(bufferedParticipantsRef.current);
      const nextLive = JSON.stringify(liveParticipantsRef.current);

      if (currentBuffered !== nextLive) {
        setBufferedParticipants(liveParticipantsRef.current);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <RideMapCanvas
      participants={bufferedParticipants}
      currentUserId={currentUserId}
    />
  );
}
