"use client";

import { useMemo, useState } from "react";
import type { SosAlert } from "@/lib/types";
import { SosAlertCard } from "@/components/sos-alert-card";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { BellAlertIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Activas" },
  { id: "resolved", label: "Resueltas" },
  { id: "mine", label: "Mis alertas" }
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function AlertPreview({
  alerts,
  expanded = false,
  filterable = false
}: {
  alerts: SosAlert[];
  expanded?: boolean;
  filterable?: boolean;
}) {
  const { currentUserId } = useRoutePresence();
  const [selectedFilter, setSelectedFilter] = useState<FilterId>("all");

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === "active"),
    [alerts]
  );
  const resolvedAlerts = useMemo(
    () => alerts.filter((alert) => alert.status !== "active"),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (!filterable) {
      return expanded ? activeAlerts : activeAlerts.slice(0, 2);
    }

    switch (selectedFilter) {
      case "active":
        return activeAlerts;
      case "resolved":
        return resolvedAlerts;
      case "mine":
        return alerts.filter((alert) => alert.user_id === currentUserId);
      default:
        return alerts;
    }
  }, [
    activeAlerts,
    alerts,
    currentUserId,
    expanded,
    filterable,
    resolvedAlerts,
    selectedFilter
  ]);
  const filterCounts: Record<FilterId, number> = {
    all: alerts.length,
    active: activeAlerts.length,
    resolved: resolvedAlerts.length,
    mine: alerts.filter((alert) => alert.user_id === currentUserId).length
  };

  return (
    <section className="los-card md:p-6">
      <div className="pointer-events-none absolute -right-24 -top-16 h-52 w-52 rounded-full bg-danger/12 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-danger/80">
            Actividad
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">Alertas SOS</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {activeAlerts.length
              ? `${activeAlerts.length} activas en este momento`
              : "Sin emergencias activas ahora mismo"}
          </p>
        </div>
        <span className="los-chip los-chip-danger">
          <BellAlertIcon className="h-4 w-4" />
          {alerts.length} total
        </span>
      </div>

      {filterable ? (
        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FILTERS.map((filter) => {
            const isActive = selectedFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter.id)}
                className={`rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "border border-accent/35 bg-accent/12 text-accent shadow-[0_0_22px_rgba(32,211,238,0.12)]"
                    : "border border-white/10 bg-white/[0.045] text-muted hover:border-accent/25 hover:bg-white/[0.065] hover:text-ink"
                }`}
              >
                <span className="block text-xs uppercase tracking-[0.18em]">
                  {filter.label}
                </span>
                <span className="mt-1 block text-lg font-semibold text-ink">
                  {filterCounts[filter.id]}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative mt-5 grid gap-4 xl:grid-cols-2">
        {filteredAlerts.map((alert) => (
          <SosAlertCard key={alert.id} alert={alert} compact={!expanded && !filterable} />
        ))}

        {!filteredAlerts.length ? (
          <div className="los-empty xl:col-span-2">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/20 bg-accent/10 shadow-[0_0_30px_rgba(32,211,238,0.12)]">
              <ShieldCheckIcon className="h-6 w-6 text-accent" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">
              Todo tranquilo
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-muted">
              No hay alertas para este filtro. Si entra un SOS, aparecera aqui
              y tambien en el centro de notificaciones.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
