"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, ClockIcon, SignalIcon, UserGroupIcon } from "@heroicons/react/24/solid";
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
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

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

  useEffect(() => {
    const element = messageRef.current;

    if (!element) {
      return;
    }

    setCanExpand(element.scrollHeight > element.clientHeight + 1);
  }, [description, expanded]);

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
      className={`relative overflow-hidden rounded-[1.7rem] border ${
        isActive
          ? "border-white/10 bg-[linear-gradient(180deg,rgba(16,21,34,.96),rgba(11,12,21,.98))] shadow-[0_24px_50px_rgba(0,0,0,.32)]"
          : "border-line/70 bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(11,18,32,.92))]"
      } ${compact ? "p-4" : "p-5"}`}
    >
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

      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-3 ${emergencyMeta.iconClasses}`}>
          <EmergencyIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.26em] text-muted">
                {heroCopy}
              </p>
              <h3 className="mt-1 break-words text-base font-semibold leading-6 text-ink">
                {formatAlertName(alert)}
              </h3>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${statusMeta.classes} ${
                  isActive && !isResponding ? "animate-pulse" : ""
                }`}
              >
                {statusMeta.label}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${emergencyMeta.chipClasses}`}
              >
                {emergencyMeta.label}
              </span>
            </div>
          </div>

          {alertTime ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <ClockIcon className="h-4 w-4" />
              <span>{alertTime}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className={`rounded-2xl border px-4 py-3 ${emergencyMeta.panelClasses}`}>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            Tipo de emergencia
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-ink">
            {emergencyMeta.label}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            Moto / modelo
          </p>
          <p className="mt-1 break-words text-sm font-medium text-ink">
            {alert.bike_model || "Sin moto registrada"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            Ciudad
          </p>
          <p className="mt-1 break-words text-sm font-medium text-ink">
            {alert.city || "Sin ciudad registrada"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            Contacto
          </p>
          <p className="mt-1 text-sm font-medium tracking-[0.08em] text-ink">
            {formatPhoneNumber(alert.emergency_contact)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-accent/15 bg-accent/8 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-xl bg-accent/12 p-2 text-accent">
              <UserGroupIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
                Apoyo en camino
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {responseCount} {responseCount === 1 ? "motero va" : "moteros van"} en camino
              </p>
            </div>
          </div>
          {isResponding ? (
            <span className="rounded-full border border-accent/25 bg-accent/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Tu respuesta
            </span>
          ) : null}
        </div>
        {alert.helper_names?.length ? (
          <p className="mt-2 break-words text-sm text-muted">
            {alert.helper_names.slice(0, 3).join(" - ")}
            {alert.helper_names.length > 3 ? ` +${alert.helper_names.length - 3}` : ""}
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3">
        <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            Ubicacion
          </p>
          <p className="mt-1 text-sm font-medium tracking-[0.08em] text-ink">
            {formatCoordinatesCompact(alert.latitude, alert.longitude)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
            {detailLabel}
          </p>
          <p
            ref={messageRef}
            className={`mt-1 break-words text-sm leading-6 text-ink ${
              expanded ? "" : "line-clamp-4"
            }`}
          >
            {description}
          </p>
          {canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-2 text-sm font-medium text-accent"
            >
              {expanded ? "Ver menos" : "Ver mas"}
            </button>
          ) : null}
        </div>

        {alert.medical_summary ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-danger">
              Ficha medica compartida
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-ink">
              {alert.medical_summary}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/mapa?alerta=${alert.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-line/80 bg-white/5 px-3 py-2 text-sm font-medium text-ink transition hover:border-accent/30 hover:bg-accent/10"
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
              className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-70"
            >
              {isUpdating ? "Actualizando..." : "Marcar resuelta"}
            </button>
            <button
              type="button"
              onClick={() => updateAlertStatus(alert.id, "cancelled")}
              disabled={isUpdating}
              className="rounded-xl border border-danger/30 bg-danger/12 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/18 disabled:opacity-70"
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
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              isResponding
                ? "border border-accent/30 bg-accent/12 text-accent"
                : "border border-accent/30 bg-accent/10 text-accent hover:bg-accent/16"
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
    </article>
  );
}
