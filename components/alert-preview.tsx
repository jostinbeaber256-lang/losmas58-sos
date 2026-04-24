"use client";

import { useMemo, useState } from "react";
import type { SosAlert } from "@/lib/types";
import { SosAlertCard } from "@/components/sos-alert-card";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

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

  return (
    <section className="panel-blur rounded-[1.75rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Alertas SOS</h2>
          <p className="mt-1 text-sm text-muted">
            {activeAlerts.length} activas en este momento
          </p>
        </div>
        <span className="rounded-full border border-danger/25 bg-danger/10 px-3 py-1 text-sm font-semibold text-danger">
          {alerts.length}
        </span>
      </div>

      {filterable ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = selectedFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border border-accent/30 bg-accent/12 text-accent"
                    : "border border-line/80 bg-white/5 text-muted"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {filteredAlerts.map((alert) => (
          <SosAlertCard key={alert.id} alert={alert} compact={!expanded && !filterable} />
        ))}

        {!filteredAlerts.length ? (
          <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-4 text-sm text-muted">
            No hay alertas para este filtro ahora mismo.
          </div>
        ) : null}
      </div>
    </section>
  );
}
