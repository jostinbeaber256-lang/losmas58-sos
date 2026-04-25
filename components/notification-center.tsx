"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import {
  BellAlertIcon,
  CheckCircleIcon,
  MapPinIcon,
  UserGroupIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { getEmergencyMeta } from "@/lib/alert-ui";
import type { NotificationEvent } from "@/lib/types";

type NotificationKind = NotificationEvent["kind"];

function formatNotificationTime(value: string) {
  return new Date(value).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getNotificationIcon(kind: NotificationKind) {
  if (kind === "response") {
    return UserGroupIcon;
  }

  if (kind === "resolved") {
    return CheckCircleIcon;
  }

  return BellAlertIcon;
}

export function NotificationCenter() {
  const { notificationEvents, currentUserId, isAuthenticated } = useRoutePresence();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(
    () =>
      notificationEvents
        .filter((item) => item.kind !== "new_sos" || item.actor_user_id !== currentUserId)
        .slice(0, 12),
    [currentUserId, notificationEvents]
  );

  const unreadCount = notifications.filter((item) => !seenIds.has(item.id)).length;

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem("los58-seen-notifications");
    const storedIds = storedValue ? JSON.parse(storedValue) : [];

    if (Array.isArray(storedIds)) {
      setSeenIds(new Set(storedIds.filter((item) => typeof item === "string")));
    }
  }, [isAuthenticated]);

  function markAllSeen() {
    const next = new Set([...seenIds, ...notifications.map((item) => item.id)]);
    setSeenIds(next);
    window.localStorage.setItem("los58-seen-notifications", JSON.stringify([...next].slice(-80)));
  }

  function toggleOpen() {
    setOpen((current) => {
      const next = !current;

      if (next) {
        window.setTimeout(markAllSeen, 0);
      }

      return next;
    });
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-ink shadow-[0_14px_30px_rgba(0,0,0,.22)] transition hover:border-accent/25 hover:bg-accent/10"
        aria-label="Abrir notificaciones"
      >
        <BellAlertIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full border border-background bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_0_18px_rgba(255,77,109,.55)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="notification-panel-enter fixed inset-x-4 top-20 z-[80] mx-auto w-auto max-w-[22rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,32,.98),rgba(5,8,22,.98))] shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-xl md:absolute md:inset-x-auto md:right-0 md:top-[3.25rem] md:mx-0 md:w-[22rem]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-accent">
                Centro
              </p>
              <h2 className="text-sm font-semibold text-ink">Notificaciones</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/8 bg-white/5 p-2 text-muted transition hover:text-ink"
              aria-label="Cerrar notificaciones"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[26rem] space-y-2 overflow-y-auto p-3">
            {notifications.length ? (
              notifications.map((item) => {
                const emergencyMeta = getEmergencyMeta(item.emergency_type);
                const Icon =
                  item.kind === "new_sos" ? emergencyMeta.icon : getNotificationIcon(item.kind);

                return (
                  <article
                    key={item.id}
                    className="rounded-[1.2rem] border border-white/8 bg-white/[0.035] p-3"
                  >
                    <div className="flex gap-3">
                      <div className={`h-fit rounded-2xl p-2 ${emergencyMeta.iconClasses}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-semibold text-ink">
                              {item.title}
                            </p>
                            <p className="mt-1 break-words text-xs leading-5 text-muted">
                              {item.subtitle}
                            </p>
                          </div>
                          {!seenIds.has(item.id) ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-danger shadow-[0_0_12px_rgba(255,77,109,.75)]" />
                          ) : null}
                        </div>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                          {formatNotificationTime(item.timestamp)}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Link
                            href={`/alertas?alerta=${item.alert_id}` as Route}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-ink"
                          >
                            Ver alerta
                          </Link>
                          <Link
                            href={`/mapa?alerta=${item.alert_id}` as Route}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center justify-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent"
                          >
                            <MapPinIcon className="h-3.5 w-3.5" />
                            Mapa
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.2rem] border border-white/8 bg-white/[0.035] px-4 py-5 text-sm text-muted">
                Sin actividad importante por ahora.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
