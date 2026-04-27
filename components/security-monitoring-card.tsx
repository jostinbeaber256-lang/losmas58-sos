"use client";

import dynamic from "next/dynamic";
import {
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  NoSymbolIcon,
  SignalIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import type { RideParticipant } from "@/lib/types";

// Importar el componente con actualización amortiguada
const RideMapCanvasBuffered = dynamic(
  () => import("@/components/ride-map-canvas-buffered").then((module) => module.RideMapCanvasBuffered),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-72 w-full place-items-center bg-surface text-sm text-muted md:h-80">
        Inicializando mapa de rodada...
      </div>
    )
  }
);

function formatTime(value: string | null | undefined) {
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

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isInactive(value: string | null) {
  if (!value) {
    return false;
  }

  return Date.now() - new Date(value).getTime() > 15 * 60 * 1000;
}

function getStatusLabel(participant: RideParticipant | null) {
  if (!participant || participant.attendance_status === "pending") {
    return "Asistencia pendiente";
  }

  if (participant.attendance_status === "declined") {
    return "No asistiré";
  }

  if (participant.live_route_enabled) {
    return "En ruta";
  }

  return "Confirmado";
}

function getParticipantStatus(participant: RideParticipant) {
  if (participant.attendance_status === "declined") {
    return "No asistirá";
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
      classes: "border-warning/35 bg-warning/12 text-warning"
    };
  }

  if (participant.attendance_status === "declined") {
    return {
      label: "No asistirá",
      classes: "border-muted/30 bg-muted/15 text-muted"
    };
  }

  if (participant.live_route_enabled) {
    return {
      label: "En ruta",
      classes: "border-accent/35 bg-accent/12 text-accent"
    };
  }

  if (participant.attendance_status === "confirmed") {
    return {
      label: participant.user_id === currentUserId ? "Tu ruta" : "Confirmado",
      classes: "[border-color:rgba(96,165,250,.35)] [background-color:rgba(96,165,250,.12)] text-blue-200"
    };
  }

  return {
    label: "Pendiente",
    classes: "border-white/10 bg-white/[0.035] text-muted"
  };
}

function getStatusClasses(status: string) {
  if (status === "En ruta") {
    return "border-accent/30 bg-accent/12 text-accent";
  }

  if (status === "Detenido") {
    return "border-warning/30 bg-warning/12 text-warning";
  }

  if (status === "No asistiré" || status === "No asistirá") {
    return "border-muted/30 bg-muted/15 text-muted";
  }

  if (status === "Confirmado") {
    return "border-white/10 bg-white/[0.045] text-ink";
  }

  return "border-white/10 bg-white/[0.035] text-muted";
}

function MapPreview({
  participants,
  currentUserId
}: {
  participants: RideParticipant[];
  currentUserId: string | null;
}) {
  // Mostrar todos los participantes con ubicación válida y live_route_enabled activo
  const liveParticipants = participants.filter(
    (participant) =>
      participant.live_route_enabled &&
      typeof participant.current_lat === "number" &&
      typeof participant.current_lng === "number"
  );

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[linear-gradient(145deg,rgba(10,18,31,.96),rgba(5,8,16,.98))]">
      <div className="relative flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accent">
            Mapa grupal
          </p>
          <p className="mt-1 text-sm text-muted">
            {liveParticipants.length
              ? `${liveParticipants.length} motero(s) compartiendo ubicación`
              : "Sin ubicaciones compartidas todavía"}
          </p>
        </div>
        <span className="los-chip los-chip-accent">
          En vivo
        </span>
      </div>

      <div className="relative overflow-hidden border-t border-white/10">
        {liveParticipants.length ? (
          <RideMapCanvasBuffered participants={participants} currentUserId={currentUserId} />
        ) : (
          <div className="grid h-72 w-full place-items-center bg-surface text-sm text-muted md:h-80">
            <div className="text-center">
              <p className="text-muted">
                Esperando que los moteros compartan su ubicación...
              </p>
              <p className="mt-1 text-xs text-muted">
                Los participantes aparecerán aquí al activar su ruta en vivo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SecurityMonitoringCard() {
  const {
    activeRideEvent,
    rideParticipants,
    currentRideParticipant,
    currentUserId,
    loading,
    error,
    confirmRideAttendance,
    declineRideAttendance,
    toggleRideLiveRoute
  } = useRoutePresence();

  const confirmed = rideParticipants.filter(
    (participant) => participant.attendance_status === "confirmed"
  );
  const live = rideParticipants.filter((participant) => participant.live_route_enabled);
  const declined = rideParticipants.filter(
    (participant) => participant.attendance_status === "declined"
  );
  const pending = Math.max(rideParticipants.length - confirmed.length - declined.length, 0);
  const statusLabel = getStatusLabel(currentRideParticipant);
  const lastUpdate =
    currentRideParticipant?.last_seen_at ||
    currentRideParticipant?.updated_at ||
    activeRideEvent?.starts_at ||
    null;

  if (!activeRideEvent) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(32,211,238,0.12),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.96),rgba(7,11,20,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:p-6">
        <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl border border-accent/20 bg-accent/10 text-accent">
            <UserGroupIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-ink">
            No hay una rodada activa en este momento.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Cuando se cree o active una salida grupal, podrás confirmar tu asistencia aquí.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(32,211,238,0.14),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.96),rgba(7,11,20,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:p-6 xl:col-span-2">
      <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-[0.4em] text-accent font-black">
            RODADA GRUPAL
          </p>
          <h2 className="mt-3 text-3xl font-black text-ink sm:text-4xl">
            {activeRideEvent.name}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Confirma tu asistencia y comparte tu ubicación en tiempo real durante la rodada, viaje o evento.
          </p>
          {activeRideEvent.meeting_point || activeRideEvent.starts_at ? (
            <p className="mt-2 text-xs leading-5 text-muted">
              {activeRideEvent.meeting_point ? `Punto: ${activeRideEvent.meeting_point}` : null}
              {activeRideEvent.meeting_point && activeRideEvent.starts_at ? " / " : null}
              {activeRideEvent.starts_at ? `Salida: ${formatTime(activeRideEvent.starts_at)}` : null}
            </p>
          ) : null}
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusClasses(statusLabel)}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={UserGroupIcon} label="Asistentes" value={confirmed.length} />
        <SummaryCard icon={SignalIcon} label="En ruta" value={live.length} tone="accent" />
        <SummaryCard icon={NoSymbolIcon} label="No asistirán" value={declined.length} tone="muted" />
        <SummaryCard icon={ClockIcon} label="Pendientes" value={pending} tone="warning" />
      </div>

      {error ? (
        <p className="relative mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => void confirmRideAttendance()}
          disabled={loading}
          className="los-action-primary"
        >
          <CheckCircleIcon className="h-4 w-4" />
          Confirmar asistencia
        </button>
        <button
          type="button"
          onClick={() => void declineRideAttendance()}
          disabled={loading}
          className="los-action-ghost"
        >
          <NoSymbolIcon className="h-4 w-4" />
          No asistiré
        </button>
        <button
          type="button"
          onClick={() => void toggleRideLiveRoute()}
          disabled={loading || !currentRideParticipant?.live_route_enabled}
          className="los-action-danger"
        >
          Salir de la rodada
        </button>
      </div>

      <div className="relative mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <MapPreview participants={rideParticipants} currentUserId={currentUserId} />
        <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Participantes
              </p>
              <p className="mt-1 text-sm text-muted">
                Confirmados, en ruta y respuestas del grupo.
              </p>
            </div>
            <span className="los-chip los-chip-muted">{rideParticipants.length}</span>
          </div>

          <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
            {rideParticipants.length ? (
              rideParticipants.map((participant) => {
                const name = getParticipantName(participant);
                const status = getParticipantStatus(participant);
                const tone = getParticipantTone(participant, currentUserId);

                return (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-3 py-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-xs font-black text-accent">
                      {getInitials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {participant.city || "Sin ciudad"} / {formatTime(participant.last_seen_at || participant.updated_at)}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.classes}`}>
                        {tone.label}
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClasses(status)}`}>
                      {status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="los-empty py-6">
                <p className="text-sm font-semibold text-ink">
                  Sin participantes todavía
                </p>
                <p className="mt-1 text-xs text-muted">
                  Sé el primero en confirmar asistencia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = "muted",
  compact = false
}: {
  icon: typeof UserGroupIcon;
  label: string;
  value: string | number;
  tone?: "accent" | "warning" | "muted";
  compact?: boolean;
}) {
  const iconClass = tone === "accent" ? "text-accent" : tone === "warning" ? "text-warning" : "text-muted";

  return (
    <div className="los-info-panel p-4">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
        {label}
      </p>
      <p className={`mt-1 font-semibold text-ink ${compact ? "text-xs leading-5" : "text-lg"}`}>
        {value}
      </p>
    </div>
  );
}
