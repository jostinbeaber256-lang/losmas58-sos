"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ left: 16, top: 76, width: 304 });
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const notifications = useMemo(
    () =>
      notificationEvents
        .filter((item) => item.kind !== "new_sos" || item.actor_user_id !== currentUserId)
        .slice(0, 12),
    [currentUserId, notificationEvents]
  );

  const unreadCount = notifications.filter((item) => !seenIds.has(item.id)).length;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    function updatePanelPosition() {
      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const margin = 16;
      const width = Math.min(304, window.innerWidth - margin * 2);
      const left = Math.min(
        Math.max(margin, rect.right - width),
        window.innerWidth - width - margin
      );

      setPanelPosition({
        left,
        top: rect.bottom + 6,
        width
      });
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !buttonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

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

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            className="notification-panel-enter fixed z-[2147483647] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,32,.98),rgba(5,8,22,.98))] shadow-[0_22px_64px_rgba(0,0,0,.52),0_0_28px_rgba(32,211,238,.08)] backdrop-blur-xl"
            style={{
              left: panelPosition.left,
              top: panelPosition.top,
              width: panelPosition.width
            }}
          >
            <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-white/10 bg-[rgba(11,18,32,.98)]" />

            <div className="relative flex items-center justify-between border-b border-white/8 px-3 py-2.5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-accent">
                  Centro
                </p>
                <h2 className="text-sm font-semibold text-ink">Notificaciones</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/8 bg-white/5 p-1.5 text-muted transition hover:border-danger/25 hover:bg-danger/10 hover:text-ink"
                aria-label="Cerrar notificaciones"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(56vh,17.5rem)] space-y-1.5 overflow-y-auto p-2">
              {notifications.length ? (
                notifications.map((item) => {
                  const emergencyMeta = getEmergencyMeta(item.emergency_type);
                  const Icon =
                    item.kind === "new_sos" ? emergencyMeta.icon : getNotificationIcon(item.kind);

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-white/6 bg-white/[0.03] p-2"
                    >
                      <div className="flex gap-2">
                        <div className={`h-fit rounded-xl p-1.5 ${emergencyMeta.iconClasses}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-1 break-words text-sm font-semibold leading-5 text-ink">
                                {item.title}
                              </p>
                              <p className="mt-0.5 line-clamp-2 break-words text-xs leading-4 text-muted">
                                {item.subtitle}
                              </p>
                            </div>
                            {!seenIds.has(item.id) ? (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-danger shadow-[0_0_12px_rgba(255,77,109,.75)]" />
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                            {formatNotificationTime(item.timestamp)}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            <Link
                              href={`/alertas?alerta=${item.alert_id}` as Route}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:border-accent/25 hover:bg-accent/10"
                            >
                              Ver alerta
                            </Link>
                            <Link
                              href={`/mapa?alerta=${item.alert_id}` as Route}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center justify-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent"
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
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-center text-sm text-muted">
                  Sin actividad importante por ahora.
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative z-[9999]">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-ink shadow-[0_14px_30px_rgba(0,0,0,.22)] transition ${
          open
            ? "border-accent/30 bg-accent/10"
            : "border-white/10 bg-white/5 hover:border-accent/25 hover:bg-accent/10"
        }`}
        aria-label="Abrir notificaciones"
        aria-expanded={open}
      >
        <BellAlertIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full border border-background bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_0_18px_rgba(255,77,109,.55)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {panel}
    </div>
  );
}
