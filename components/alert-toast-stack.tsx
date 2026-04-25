"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useRef, useState } from "react";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { getEmergencyMeta } from "@/lib/alert-ui";
import type { NotificationEvent } from "@/lib/types";

type ToastAlert = {
  id: string;
  alertId: string;
  title: string;
  type: string | null;
  city: string | null;
};

function buildToast(event: NotificationEvent): ToastAlert {
  return {
    id: event.id,
    alertId: event.alert_id,
    title: event.title,
    type: event.emergency_type,
    city: event.subtitle.includes(" - ") ? event.subtitle.split(" - ").slice(1).join(" - ") : null
  };
}

export function AlertToastStack() {
  const { notificationEvents, currentUserId } = useRoutePresence();
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const seenIdsRef = useRef<Set<string>>(new Set());

  const dismissToast = useCallback((id: string) => {
    setExitingIds((current) => new Set(current).add(id));

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      setExitingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 180);
  }, []);

  useEffect(() => {
    const nextToasts = notificationEvents
      .filter((event) => event.kind === "new_sos")
      .filter((event) => !seenIdsRef.current.has(event.id))
      .filter((event) => event.actor_user_id !== currentUserId)
      .map(buildToast);

    notificationEvents.forEach((event) => {
      if (event.kind === "new_sos") {
        seenIdsRef.current.add(event.id);
      }
    });

    if (!nextToasts.length) {
      return;
    }

    setToasts((current) => [...nextToasts, ...current].slice(0, 3));
  }, [currentUserId, notificationEvents]);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const oldestToast = toasts[toasts.length - 1];

      if (oldestToast) {
        dismissToast(oldestToast.id);
      }
    }, 5200);

    return () => window.clearTimeout(timeout);
  }, [dismissToast, toasts]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] mx-auto flex w-full max-w-md flex-col gap-2 px-4">
      {toasts.map((toast) => {
        const meta = getEmergencyMeta(toast.type);
        const Icon = meta.icon;
        const isExiting = exitingIds.has(toast.id);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,32,.98),rgba(8,11,21,.97))] p-4 shadow-[0_20px_50px_rgba(0,0,0,.38)] backdrop-blur-xl ${
              isExiting ? "toast-exit" : "toast-enter"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl p-2.5 ${meta.iconClasses}`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-danger">
                  <BellAlertIcon className="h-4 w-4" />
                  Nueva alerta SOS
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">{toast.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {meta.label}
                  {toast.city ? ` - ${toast.city}` : ""}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/alertas?alerta=${toast.alertId}` as Route}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-ink transition hover:border-white/20 hover:bg-white/8"
                    onClick={() => dismissToast(toast.id)}
                  >
                    Ver alerta
                  </Link>
                  <Link
                    href={`/mapa?alerta=${toast.alertId}` as Route}
                    className="inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold transition hover:brightness-110"
                    style={{
                      borderColor: meta.mapRing,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
                      color: meta.mapColor
                    }}
                    onClick={() => dismissToast(toast.id)}
                  >
                    Ver en mapa
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-full border border-white/8 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-white/16 hover:text-ink"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
