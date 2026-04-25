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
import { getEmergencyMeta } from "@/lib/alert-ui";
import {
  formatAdminDate,
  getAdminAlerts,
  getAdminDisplayName
} from "@/lib/admin/data";
import { formatCoordinatesCompact, formatPhoneNumber } from "@/lib/map";
import { updateAdminAlertStatus } from "@/app/admin/alertas/actions";

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

export default async function AdminAlertsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const status = params?.status ?? "all";
  const type = params?.type ?? "all";
  const alerts = await getAdminAlerts({ status, emergencyType: type });
  const activeCount = alerts.filter((alert) => alert.status === "active").length;
  const resolvedCount = alerts.filter((alert) => alert.status === "resolved").length;
  const cancelledCount = alerts.filter((alert) => alert.status === "cancelled").length;
  const responseCount = alerts.reduce(
    (total, alert) => total + alert.responses.length,
    0
  );

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(255,77,109,0.12),transparent_30%),linear-gradient(145deg,rgba(18,27,43,0.95),rgba(8,12,22,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-6">
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

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
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

          <button className="self-end rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-background shadow-[0_0_28px_rgba(32,211,238,0.16)] transition hover:brightness-110">
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

          return (
            <article
              key={alert.id}
              className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(255,77,109,.10),transparent_34%),linear-gradient(180deg,rgba(16,21,34,.97),rgba(7,10,19,.99))] p-5 shadow-[0_26px_62px_rgba(0,0,0,.32)]"
            >
              <div
                className="pointer-events-none absolute inset-y-5 left-0 w-1 rounded-r-full"
                style={{
                  backgroundColor: meta.mapColor,
                  boxShadow: isActive ? meta.mapGlow : "none",
                  opacity: isActive ? 0.9 : 0.35
                }}
              />
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
                  {alert.status}
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
                  label="Ubicación"
                  value={formatCoordinatesCompact(alert.latitude, alert.longitude)}
                />
                <Info
                  icon={<UserGroupIcon className="h-3.5 w-3.5 text-accent" />}
                  label="En camino"
                  value={`${alert.responses.length} motero(s)`}
                />
              </div>

              <details className="group mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
                  Ver detalle operativo
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-accent transition group-open:rotate-45" />
                </summary>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                      Descripción
                    </p>
                    <p className="mt-1 break-words text-sm leading-6 text-ink">
                      {alert.emergency_details || alert.message || "Sin descripción"}
                    </p>
                  </div>

                  {alert.medical_summary ? (
                    <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-danger">
                        Ficha médica compartida
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-ink">
                        {alert.medical_summary}
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-accent/15 bg-accent/8 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                      Quién va en camino
                    </p>
                    <p className="mt-1 break-words text-sm text-ink">
                      {alert.responses.length
                        ? alert.responses
                            .map((response) => response.helper_name || "Motero")
                            .join(" / ")
                        : "Sin respuestas registradas"}
                    </p>
                  </div>
                </div>
              </details>

              <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 p-3">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  Acciones administrativas
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/mapa?alerta=${alert.id}` as Route}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent/15"
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
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background shadow-[0_0_24px_rgba(32,211,238,0.16)]"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Marcar resuelta
                      </button>
                      <button
                        name="status"
                        value="cancelled"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/12 px-4 py-3 text-sm font-semibold text-danger"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Cancelar alerta
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!alerts.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.035] p-8 text-center">
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
    <div className={`rounded-[1.25rem] border p-3 ${toneClasses}`}>
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
    <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
