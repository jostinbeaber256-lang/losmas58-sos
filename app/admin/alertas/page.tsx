import Link from "next/link";
import type { Route } from "next";
import {
  ArrowTopRightOnSquareIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  UserGroupIcon,
  XCircleIcon
} from "@heroicons/react/24/solid";
import { updateAdminAlertStatus } from "@/app/admin/alertas/actions";
import { getEmergencyMeta } from "@/lib/alert-ui";
import {
  formatAdminDate,
  getAdminAlerts,
  getAdminDisplayName,
  type AdminAlert
} from "@/lib/admin/data";
import { formatCoordinatesCompact, formatPhoneNumber } from "@/lib/map";
import {
  ExpandableCard,
  CompactView,
  ExpandedView,
  ExpandTrigger,
  CompactInfo,
  CompactInfoGrid,
  CardDivider
} from "@/components/ui/expandable-card";

const emergencyTypes = [
  "Llanta pinchada",
  "Sin combustible",
  "Accidente",
  "Averia",
  "Robo",
  "Emergencia medica",
  "Otros"
];

const statusFilters = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "resolved", label: "Resueltas" },
  { value: "cancelled", label: "Canceladas" }
];

function getStatusLabel(status: AdminAlert["status"]) {
  if (status === "active") {
    return "Activa";
  }

  if (status === "resolved") {
    return "Resuelta";
  }

  return "Cancelada";
}

export default async function AdminAlertsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const status = params?.status ?? "all";
  const type = params?.type ?? "all";
  const [allAlerts, alerts] = await Promise.all([
    getAdminAlerts({}),
    getAdminAlerts({ status, emergencyType: type })
  ]);
  const activeCount = allAlerts.filter((alert) => alert.status === "active").length;
  const resolvedCount = allAlerts.filter((alert) => alert.status === "resolved").length;
  const cancelledCount = allAlerts.filter((alert) => alert.status === "cancelled").length;
  const responseCount = allAlerts.reduce(
    (total, alert) => total + alert.responses.length,
    0
  );

  return (
    <section className="space-y-5">
      <div className="los-card md:p-6">
        <div className="pointer-events-none absolute -right-24 -top-16 h-52 w-52 rounded-full bg-danger/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-danger">
              Alertas SOS
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Consola de incidentes
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Vista operativa para revisar emergencias, apoyos en camino,
              ubicaciones y acciones administrativas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            <Metric label="Activas" value={activeCount} tone="danger" />
            <Metric label="Resueltas" value={resolvedCount} tone="accent" />
            <Metric label="Canceladas" value={cancelledCount} tone="muted" />
            <Metric label="En camino" value={responseCount} tone="warning" />
          </div>
        </div>
      </div>

      <div className="los-card-compact">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Filtros operativos
            </p>
            <p className="mt-1 text-sm text-muted">
              Mostrando{" "}
              <span className="font-semibold text-ink">{alerts.length}</span> de{" "}
              <span className="font-semibold text-ink">{allAlerts.length}</span>{" "}
              alertas registradas.
            </p>
          </div>
          <Link
            href={"/admin/alertas" as Route}
            className="los-chip los-chip-muted w-fit transition hover:border-accent/30 hover:text-accent"
          >
            Limpiar filtros
          </Link>
        </div>

        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-muted">
              Estado
            </label>
            <select
              name="status"
              defaultValue={status}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-accent/40"
            >
              {statusFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-muted">
              Tipo de emergencia
            </label>
            <select
              name="type"
              defaultValue={type}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-accent/40"
            >
              <option value="all">Todos los tipos</option>
              {emergencyTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button className="los-action-primary self-end px-5">
            Aplicar filtros
          </button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {alerts.map((alert) => {
          const meta = getEmergencyMeta(alert.emergency_type);
          const Icon = meta.icon;
          const isActive = alert.status === "active";
          const statusTone =
            alert.status === "active"
              ? "border-danger/30 bg-danger/12 text-danger"
              : alert.status === "resolved"
                ? "border-accent/25 bg-accent/10 text-accent"
                : "border-white/10 bg-white/[0.045] text-muted";
          const responders = alert.responses
            .map((response) => response.helper_name || "Motero")
            .join(" / ");

          return (
            <ExpandableCard key={alert.id} cardId={`alert-${alert.id}`} defaultExpanded={false}>
              {({ isExpanded, setIsExpanded }) => (
                <article className="relative">
                  <div
                    className="pointer-events-none absolute inset-y-5 left-0 w-1 rounded-r-full"
                    style={{
                      backgroundColor: meta.mapColor,
                      boxShadow: isActive ? meta.mapGlow : "none",
                      opacity: isActive ? 0.9 : 0.35
                    }}
                  />

                  {/* Vista Compacta */}
                  <CompactView>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div className={`h-fit rounded-2xl p-3 ${meta.iconClasses}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${meta.chipClasses}`}
                            >
                              {meta.label}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] font-medium text-muted">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {formatAdminDate(alert.created_at)}
                            </span>
                          </div>
                          <h3 className="mt-3 break-words text-lg font-semibold text-ink">
                            {getAdminDisplayName(alert)}
                          </h3>
                          <p className="mt-1 break-words text-sm text-muted">
                            {alert.bike_model || "Moto no registrada"} /{" "}
                            {alert.city || "Sin ciudad"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusTone}`}
                      >
                        {getStatusLabel(alert.status)}
                      </span>
                    </div>

                    <CardDivider />

                    <CompactInfoGrid maxItems={4}>
                      <CompactInfo
                        icon={<MapPinIcon className="h-3.5 w-3.5" />}
                        label="Ciudad"
                        value={alert.city || "Sin ciudad"}
                        tone="accent"
                      />
                      <CompactInfo
                        icon={<PhoneIcon className="h-3.5 w-3.5" />}
                        label="Contacto"
                        value={formatPhoneNumber(alert.emergency_contact)}
                        tone="accent"
                      />
                      <CompactInfo
                        icon={<MapPinIcon className="h-3.5 w-3.5" />}
                        label="Ubicacion"
                        value={formatCoordinatesCompact(alert.latitude, alert.longitude)}
                        tone="accent"
                      />
                      <CompactInfo
                        icon={<UserGroupIcon className="h-3.5 w-3.5" />}
                        label="En camino"
                        value={`${alert.responses.length} motero(s)`}
                        tone={alert.responses.length > 0 ? "accent" : "muted"}
                      />
                    </CompactInfoGrid>

                    <div className="mt-3">
                      <ExpandTrigger 
                        isExpanded={isExpanded}
                        onToggle={() => setIsExpanded((prev) => !prev)}
                        collapsedLabel="Ver detalles completos" 
                        expandedLabel="Ocultar detalles"
                        className="text-accent/80 hover:text-accent"
                      >
                        <span className="text-sm font-medium">
                          {isExpanded ? "Ocultar detalles" : "Ver detalles completos"}
                        </span>
                      </ExpandTrigger>
                    </div>
                  </CompactView>

                  {/* Vista Expandida */}
                  {isExpanded ? (
                    <ExpandedView>
                      <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <div className={`h-fit rounded-2xl p-3 ${meta.iconClasses}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${meta.chipClasses}`}
                          >
                            {meta.label}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] font-medium text-muted">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {formatAdminDate(alert.created_at)}
                          </span>
                        </div>
                        <h3 className="mt-3 break-words text-lg font-semibold text-ink">
                          {getAdminDisplayName(alert)}
                        </h3>
                        <p className="mt-1 break-words text-sm text-muted">
                          {alert.bike_model || "Moto no registrada"} /{" "}
                          {alert.city || "Sin ciudad"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusTone}`}
                    >
                      {getStatusLabel(alert.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Info
                      icon={<MapPinIcon className="h-3.5 w-3.5 text-accent" />}
                      label="Ciudad"
                      value={alert.city || "Sin ciudad"}
                    />
                    <Info
                      icon={<PhoneIcon className="h-3.5 w-3.5 text-accent" />}
                      label="Contacto"
                      value={formatPhoneNumber(alert.emergency_contact)}
                    />
                    <Info
                      icon={<MapPinIcon className="h-3.5 w-3.5 text-accent" />}
                      label="Ubicacion"
                      value={formatCoordinatesCompact(alert.latitude, alert.longitude)}
                    />
                    <Info
                      icon={<UserGroupIcon className="h-3.5 w-3.5 text-accent" />}
                      label="En camino"
                      value={`${alert.responses.length} motero(s)`}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                        Descripcion
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-ink">
                        {alert.emergency_details || alert.message || "Sin descripcion"}
                      </p>
                    </div>

                    {alert.medical_summary ? (
                      <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-danger">
                          Ficha medica compartida
                        </p>
                        <p className="mt-1 break-words text-sm leading-6 text-ink">
                          {alert.medical_summary}
                        </p>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-accent/15 bg-accent/8 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                        Quien va en camino
                      </p>
                      <p className="mt-1 break-words text-sm text-ink">
                        {responders || "Sin respuestas registradas"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 p-3">
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                      Acciones administrativas
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Link
                        href={`/mapa?alerta=${alert.id}` as Route}
                        className="los-action-primary"
                      >
                        Ver en mapa
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </Link>

                      {isActive ? (
                        <form action={updateAdminAlertStatus} className="contents">
                          <input type="hidden" name="alertId" value={alert.id} />
                          <button
                            name="status"
                            value="resolved"
                            className="los-action-primary"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Marcar resuelta
                          </button>
                          <button
                            name="status"
                            value="cancelled"
                            className="los-action-danger"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Cancelar alerta
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                    </ExpandedView>
                  ) : null}
                </article>
              )}
            </ExpandableCard>
          );
        })}
      </div>

      {!alerts.length ? (
        <div className="los-empty p-8">
          <BellAlertIcon className="mx-auto h-10 w-10 text-accent" />
          <p className="mt-3 text-sm font-semibold text-ink">
            Sin alertas para estos filtros
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
            Ajusta el estado o tipo de emergencia para revisar otros incidentes.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "danger" | "accent" | "warning" | "muted";
}) {
  const toneClasses = {
    danger: "text-danger border-danger/25 bg-danger/10",
    accent: "text-accent border-accent/25 bg-accent/10",
    warning: "text-warning border-warning/25 bg-warning/10",
    muted: "text-muted border-white/10 bg-white/[0.045]"
  }[tone];

  return (
    <div className={`los-card-compact border p-3 ${toneClasses}`}>
      <p className="text-xl font-semibold text-ink">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
    </div>
  );
}

function Info({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="los-info-panel bg-black/18">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
