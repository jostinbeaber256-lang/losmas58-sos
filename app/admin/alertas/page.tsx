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

export default async function AdminAlertsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const status = params?.status ?? "all";
  const type = params?.type ?? "all";
  const alerts = await getAdminAlerts({ status, emergencyType: type });

  return (
    <section className="space-y-5">
      <div className="rounded-[1.85rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,43,0.95),rgba(8,12,22,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-danger">
              Alertas SOS
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink">
              Gestión de incidentes
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Lista completa de alertas, respuestas y acciones manuales.
            </p>
          </div>
          <form className="grid gap-2 sm:grid-cols-3">
            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-ink outline-none"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="resolved">Resueltas</option>
              <option value="cancelled">Canceladas</option>
            </select>
            <select
              name="type"
              defaultValue={type}
              className="rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-ink outline-none"
            >
              <option value="all">Todos los tipos</option>
              {emergencyTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background">
              Filtrar
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {alerts.map((alert) => {
          const meta = getEmergencyMeta(alert.emergency_type);
          const Icon = meta.icon;
          const isActive = alert.status === "active";

          return (
            <article
              key={alert.id}
              className="relative overflow-hidden rounded-[1.85rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(255,77,109,.10),transparent_34%),linear-gradient(180deg,rgba(16,21,34,.97),rgba(7,10,19,.99))] p-5 shadow-[0_26px_62px_rgba(0,0,0,.32)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <div className={`h-fit rounded-2xl p-3 ${meta.iconClasses}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted">
                      {meta.label}
                    </p>
                    <h3 className="mt-1 break-words text-lg font-semibold text-ink">
                      {getAdminDisplayName(alert)}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatAdminDate(alert.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    isActive
                      ? "border-danger/30 bg-danger/12 text-danger"
                      : "border-accent/25 bg-accent/10 text-accent"
                  }`}
                >
                  {alert.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Ciudad" value={alert.city || "Sin ciudad"} />
                <Info label="Contacto" value={formatPhoneNumber(alert.emergency_contact)} />
                <Info
                  label="Ubicación"
                  value={formatCoordinatesCompact(alert.latitude, alert.longitude)}
                />
                <Info
                  label="En camino"
                  value={`${alert.responses.length} motero(s)`}
                />
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                  Descripción
                </p>
                <p className="mt-1 break-words text-sm leading-6 text-ink">
                  {alert.emergency_details || alert.message || "Sin descripción"}
                </p>
              </div>

              <div className="mt-3 rounded-2xl border border-accent/15 bg-accent/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                  Quienes van en camino
                </p>
                <p className="mt-1 break-words text-sm text-ink">
                  {alert.responses.length
                    ? alert.responses
                        .map((response) => response.helper_name || "Motero")
                        .join(" / ")
                    : "Sin respuestas registradas"}
                </p>
              </div>

              {isActive ? (
                <form action={updateAdminAlertStatus} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="alertId" value={alert.id} />
                  <button
                    name="status"
                    value="resolved"
                    className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background"
                  >
                    Marcar resuelta
                  </button>
                  <button
                    name="status"
                    value="cancelled"
                    className="rounded-2xl border border-danger/30 bg-danger/12 px-4 py-3 text-sm font-semibold text-danger"
                  >
                    Cancelar alerta
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>

      {!alerts.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.035] p-8 text-center text-sm text-muted">
          No hay alertas para los filtros seleccionados.
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
