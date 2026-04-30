"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRightIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  PhoneIcon,
  SignalIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import type { SosAlert } from "@/lib/types";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import {
  getAlertStatusMeta,
  getEmergencyMeta
} from "@/lib/alert-ui";
import {
  formatAlertName,
  formatCoordinatesCompact,
  formatPhoneNumber
} from "@/lib/map";

function formatAlertTime(value: string | null) {
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

function getAlertDescription(alert: SosAlert) {
  return alert.emergency_details || alert.message || "SOS activado desde la comunidad.";
}

function getAlertDetailLabel(alert: SosAlert) {
  if (alert.emergency_type === "Otros" && alert.emergency_details) {
    return "Detalle personalizado";
  }

  return "Descripcion";
}

export function SosAlertCard({
  alert,
  compact = false
}: {
  alert: SosAlert;
  compact?: boolean;
}) {
  const {
    currentUserId,
    alertUpdatingId,
    responseSubmittingAlertId,
    updateAlertStatus,
    respondToAlert
  } = useRoutePresence();

  const isOwner = currentUserId === alert.user_id;
  const isActive = alert.status === "active";
  const isUpdating = alertUpdatingId === alert.id;
  const isResponding = alert.current_user_response_status === "on_the_way";
  const isSubmittingResponse = responseSubmittingAlertId === alert.id;
  const responseCount = alert.response_count ?? 0;
  const alertTime = formatAlertTime(alert.resolved_at || alert.created_at);
  const description = getAlertDescription(alert);
  const detailLabel = getAlertDetailLabel(alert);
  const emergencyMeta = getEmergencyMeta(alert.emergency_type);
  const statusMeta = getAlertStatusMeta(alert.status, isResponding);
  const EmergencyIcon = emergencyMeta.icon;
  const incidentCode = `SOS-${alert.id.slice(0, 6).toUpperCase()}`;
  const priorityLabel = !isActive
    ? "Incidente cerrado"
    : emergencyMeta.key === "accidente" || emergencyMeta.key === "emergencia medica"
      ? "Prioridad critica"
      : "Prioridad alta";
  const priorityClasses = !isActive
    ? "border-white/10 bg-white/[0.045] text-muted"
    : emergencyMeta.key === "accidente" || emergencyMeta.key === "emergencia medica"
      ? "border-danger/35 bg-danger/15 text-danger"
      : "border-warning/30 bg-warning/12 text-warning";

  const heroCopy = useMemo(() => {
    if (isResponding && isActive) {
      return "Respuesta en curso";
    }

    if (!isActive) {
      return "Cierre registrado";
    }

    return "Atencion prioritaria";
  }, [isActive, isResponding]);

  async function handleResponding() {
    await respondToAlert(alert.id);
  }

  return (
    <article
      className={`relative w-full min-w-0 overflow-hidden rounded-[1.85rem] border ${
        isActive
          ? "border-white/8 bg-[radial-gradient(circle_at_100%_0%,rgba(255,77,109,.10),transparent_36%),linear-gradient(180deg,rgba(16,21,34,.97),rgba(7,10,19,.99))] shadow-[0_28px_68px_rgba(0,0,0,.32),inset_0_1px_0_rgba(255,255,255,0.03)]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(11,18,32,.92))] shadow-[0_20px_48px_rgba(0,0,0,.20),inset_0_1px_0_rgba(255,255,255,0.03)]"
      } ${compact ? "p-4" : "p-5 md:p-6"}`}
    >
      <div
        className="pointer-events-none absolute inset-y-5 left-0 w-1 rounded-r-full"
        style={{
          backgroundColor: emergencyMeta.mapColor,
          boxShadow: isActive ? emergencyMeta.mapGlow : "none",
          opacity: isActive ? 0.9 : 0.35
        }}
      />
      <div
        className="pointer-events-none absolute -right-12 top-12 h-28 w-28 rounded-full blur-3xl"
        style={{
          backgroundColor: emergencyMeta.mapColor,
          opacity: isActive ? 0.16 : 0.07
        }}
      />

      {isActive ? (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
            emergencyMeta.panelClasses
          }`}
        />
      ) : null}

      <div className="relative mb-4 flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-center">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          <ClipboardDocumentListIcon className="h-4 w-4 text-accent" />
          {incidentCode}
        </div>
        <span
          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${priorityClasses}`}
        >
          {priorityLabel}
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-3 text-center">
        <div className={`w-fit shrink-0 rounded-2xl p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_12px_rgba(0,0,0,0.06)] ${emergencyMeta.iconClasses}`}>
          <EmergencyIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                {heroCopy}
              </p>
              <h3 className="mx-auto mt-1 max-w-xl text-xl font-semibold leading-7 text-ink [overflow-wrap:normal] [word-break:normal]">
                {formatAlertName(alert)}
              </h3>
              <div className="mt-3 flex min-w-0 flex-wrap items-center justify-center gap-2">
                <span
                  className={`max-w-full rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${emergencyMeta.chipClasses}`}
                >
                  {emergencyMeta.label}
                </span>
                {alertTime ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-muted">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {alertTime}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <span
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusMeta.classes} ${
                  isActive && !isResponding ? "animate-pulse" : ""
                }`}
              >
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-white/8 pt-4">
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted">
          Datos operativos
        </p>
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={`rounded-xl border px-3 py-2 ${emergencyMeta.panelClasses}`}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted/70">Tipo</p>
            <p className="text-sm font-medium text-ink">{emergencyMeta.label}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted/70">Moto</p>
            <p className="text-sm font-medium text-ink">{alert.bike_model || "Sin moto registrada"}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted/70">
              <MapPinIcon className="h-3 w-3 text-accent" />
              Ciudad
            </p>
            <p className="text-sm font-medium text-ink">{alert.city || "Sin ciudad registrada"}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted/70">
              <PhoneIcon className="h-3 w-3 text-accent" />
              Contacto
            </p>
            <p className="text-sm font-medium tracking-[0.02em] text-ink">{formatPhoneNumber(alert.emergency_contact)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">
            <MapPinIcon className="h-3.5 w-3.5 text-accent" />
            Ubicacion
          </p>
          <p className="mt-1 text-sm font-medium tracking-[0.02em] text-ink">
            {formatCoordinatesCompact(alert.latitude, alert.longitude)}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">
            <UserGroupIcon className="h-3.5 w-3.5 text-accent" />
            Apoyo en camino
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {responseCount} {responseCount === 1 ? "motero" : "moteros"}
            {alert.helper_names?.length ? ` (${alert.helper_names.slice(0, 3).join(", ")}${alert.helper_names.length > 3 ? ` +${alert.helper_names.length - 3}` : ""})` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{detailLabel}</p>
          <p className="mt-1 break-words text-sm leading-6 text-ink">{description}</p>
        </div>

        {alert.medical_summary ? (
          <div className="rounded-xl border border-danger/20 bg-danger/8 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-danger">Ficha medica compartida</p>
            <p className="mt-1 break-words text-sm leading-6 text-ink">{alert.medical_summary}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-black/16 p-3">
        <div className="mb-3 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Acciones de respuesta</p>
          {responseCount > 0 ? (
            <span className="w-fit rounded-full border border-accent/22 bg-accent/8 px-3 py-1 text-[11px] font-semibold text-accent">
              {responseCount} en camino
            </span>
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/mapa?alerta=${alert.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/22 bg-accent/8 px-4 py-2.5 text-sm font-semibold text-accent transition hover:border-accent/32 hover:bg-accent/12"
          >
            Ver en mapa
            <ArrowRightIcon className="h-4 w-4" />
          </Link>

          {isActive && isOwner ? (
            <>
              <button
                type="button"
                onClick={() => updateAlertStatus(alert.id, "resolved")}
                disabled={isUpdating}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-70"
              >
                {isUpdating ? "Actualizando..." : "Marcar resuelta"}
              </button>
              <button
                type="button"
                onClick={() => updateAlertStatus(alert.id, "cancelled")}
                disabled={isUpdating}
                className="rounded-xl border border-danger/25 bg-danger/8 px-4 py-2.5 text-sm font-semibold text-danger transition hover:border-danger/35 hover:bg-danger/12 disabled:opacity-70"
              >
                Cancelar SOS
              </button>
            </>
          ) : null}

          {isActive && !isOwner ? (
            <button
              type="button"
              onClick={handleResponding}
              disabled={isSubmittingResponse || isResponding}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isResponding
                  ? "border border-accent/25 bg-accent/10 text-accent"
                  : "border border-accent/25 bg-accent/8 text-accent hover:bg-accent/12"
              }`}
            >
              {isSubmittingResponse ? (
                <span className="inline-flex items-center gap-2">
                  <SignalIcon className="h-4 w-4 animate-pulse" />
                  Guardando...
                </span>
              ) : isResponding ? (
                "En camino"
              ) : (
                "Voy en camino"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
