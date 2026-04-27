import Link from "next/link";
import type { Route } from "next";
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  MapPinIcon,
  SignalIcon,
  UserCircleIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import {
  formatAdminDate,
  getAdminDisplayName,
  getAdminUsers,
  type AdminProfile
} from "@/lib/admin/data";
import { formatCoordinatesCompact } from "@/lib/map";

const filters = [
  { value: "all", label: "Todos" },
  { value: "route", label: "En ruta" },
  { value: "off_route", label: "Fuera de ruta" },
  { value: "sharing", label: "Compartiendo" },
  { value: "monitoring", label: "Monitoreo" },
  { value: "emergency_tracking", label: "Robo/emergencia" },
  { value: "inactive", label: "Inactivos" }
];

function hasLocation(user: AdminProfile) {
  return typeof user.latitude === "number" && typeof user.longitude === "number";
}

function isRecentActivity(value: string | null) {
  if (!value) {
    return false;
  }

  const diffMs = Date.now() - new Date(value).getTime();
  return diffMs <= 15 * 60 * 1000;
}

function matchesSearch(user: AdminProfile, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [user.full_name, user.username, user.city]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery));
}

function filterRoutes(users: AdminProfile[], filter: string) {
  switch (filter) {
    case "route":
      return users.filter((user) => user.is_on_route);
    case "off_route":
      return users.filter((user) => !user.is_on_route);
    case "sharing":
      return users.filter((user) => user.is_on_route && hasLocation(user));
    case "monitoring":
      return users.filter((user) => user.continuous_monitoring_enabled);
    case "emergency_tracking":
      return users.filter((user) => user.emergency_tracking_active);
    case "inactive":
      return users.filter(
        (user) => !isRecentActivity(user.location_updated_at || user.updated_at)
      );
    default:
      return users;
  }
}

export default async function AdminRoutesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const selectedFilter = params?.filter ?? "all";
  const allUsers = await getAdminUsers();
  const searchedUsers = allUsers.filter((user) => matchesSearch(user, query));
  const users = filterRoutes(searchedUsers, selectedFilter);
  const routeCount = allUsers.filter((user) => user.is_on_route).length;
  const sharingCount = allUsers.filter(
    (user) => user.is_on_route && hasLocation(user)
  ).length;
  const monitoringCount = allUsers.filter(
    (user) => user.continuous_monitoring_enabled
  ).length;
  const emergencyTrackingCount = allUsers.filter(
    (user) => user.emergency_tracking_active
  ).length;
  const offRouteCount = allUsers.filter((user) => !user.is_on_route).length;
  const recentCount = allUsers.filter((user) =>
    isRecentActivity(user.location_updated_at || user.updated_at)
  ).length;

  return (
    <section className="space-y-5">
      <div className="los-card md:p-6">
        <div className="pointer-events-none absolute -right-24 -top-16 h-52 w-52 rounded-full bg-warning/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 text-center xl:flex-row xl:items-end xl:justify-between xl:text-left">
          <div className="los-section-head los-section-head-center max-w-xl xl:items-start xl:text-left">
            <p className="los-section-kicker text-warning">
              Rutas
            </p>
            <h2 className="text-[1.85rem] font-semibold leading-tight text-ink sm:text-[2.1rem]">
              Consola de presencia
            </h2>
            <p className="los-section-copy max-w-xl text-sm">
              Monitorea estado de ruta, ubicacion compartida y ultima
              sincronizacion operativa de cada motero.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:min-w-[620px]">
            <Metric label="En ruta" value={routeCount} tone="warning" />
            <Metric label="Compartiendo" value={sharingCount} tone="accent" />
            <Metric label="Monitoreo" value={monitoringCount} tone="accent" />
            <Metric label="Robo/emerg." value={emergencyTrackingCount} tone="danger" />
            <Metric label="Fuera" value={offRouteCount} tone="muted" />
            <Metric label="Recientes" value={recentCount} tone="accent" />
          </div>
        </div>
      </div>

      <div className="los-card-compact">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              Busqueda y filtros
            </p>
            <p className="mt-1 text-sm text-muted">
              Mostrando{" "}
              <span className="font-semibold text-ink">{users.length}</span> de{" "}
              <span className="font-semibold text-ink">{allUsers.length}</span>{" "}
              moteros registrados.
            </p>
          </div>
          <Link
            href={"/admin/rutas" as Route}
            className="los-chip los-chip-muted w-fit transition hover:border-accent/30 hover:text-accent"
          >
            Limpiar filtros
          </Link>
        </div>

        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-muted">
              Buscar
            </label>
            <input
              name="q"
              defaultValue={query}
              placeholder="Nombre, username o ciudad..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/40"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.22em] text-muted">
              Estado operativo
            </label>
            <select
              name="filter"
              defaultValue={selectedFilter}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-accent/40"
            >
              {filters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <button className="los-action-primary self-end px-5">Aplicar</button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <RouteCard key={user.id} user={user} />
        ))}
      </div>

      {!users.length ? (
        <div className="los-empty p-8">
          <UserGroupIcon className="mx-auto h-10 w-10 text-accent" />
          <p className="mt-3 text-sm font-semibold text-ink">
            Sin rutas para estos filtros
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
            Ajusta la busqueda o el estado operativo para revisar otros moteros.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function RouteCard({ user }: { user: AdminProfile }) {
  const sharing = user.is_on_route && hasLocation(user);
  const recent = isRecentActivity(user.location_updated_at || user.updated_at);
  const monitored = user.continuous_monitoring_enabled;
  const emergencyTracking = user.emergency_tracking_active;
  const coordinates =
    user.latitude !== null && user.longitude !== null
      ? formatCoordinatesCompact(user.latitude, user.longitude)
      : "Sin coordenadas";
  const locationUrl =
    user.latitude !== null && user.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${user.latitude}&mlon=${user.longitude}#map=17/${user.latitude}/${user.longitude}`
      : null;

  return (
    <article className="los-card">
      <div
        className={`pointer-events-none absolute inset-y-5 left-0 w-1 rounded-r-full ${
          emergencyTracking
            ? "bg-danger shadow-[0_0_28px_rgba(255,77,109,.45)]"
            : monitored
              ? "bg-accent shadow-[0_0_24px_rgba(32,211,238,.32)]"
              : user.is_on_route
            ? "bg-warning shadow-[0_0_24px_rgba(255,181,71,.35)]"
            : "bg-white/20"
        }`}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3 sm:max-w-[62%]">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-warning/20 bg-warning/10 text-warning">
            <UserCircleIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold text-ink">
              {getAdminDisplayName(user)}
            </h3>
            <p className="mt-1 break-words text-sm text-muted">
              @{user.username || "sin-username"} / {user.city || "Sin ciudad"}
            </p>
            <p className="mt-2 break-words text-sm font-medium text-ink">
              {user.bike_model || "Sin moto registrada"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <CompactStatus active={user.is_on_route} label="En ruta" inactiveLabel="Fuera" />
          <CompactStatus active={sharing} label="Compartiendo" inactiveLabel="Sin ubicacion" />
          <CompactStatus active={monitored} label="Monitoreo" inactiveLabel="Monitor off" />
          <CompactStatus
            active={emergencyTracking}
            label="Robo/emergencia"
            inactiveLabel="Sin rastreo"
            tone={emergencyTracking ? "danger" : "muted"}
          />
          <CompactStatus active={recent} label="Reciente" inactiveLabel="Inactivo" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info
          icon={<MapPinIcon className="h-3.5 w-3.5 text-accent" />}
          label="Ultima ubicacion"
          value={coordinates}
        />
        <Info
          icon={<ClockIcon className="h-3.5 w-3.5 text-accent" />}
          label="Ultima sincronizacion"
          value={formatAdminDate(user.location_updated_at || user.updated_at)}
        />
      </div>

      <details className="group mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
          <span>
            Revisar actividad reciente
            <span className="ml-2 text-xs font-medium text-muted">
              presencia, monitoreo y contacto
            </span>
          </span>
          <SignalIcon className="h-4 w-4 text-accent transition group-open:rotate-45" />
        </summary>

        <div className="mt-4 grid gap-3">
          <div className="los-info-panel bg-black/18">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              Estado operativo
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-ink">
              Ruta: {user.is_on_route ? "activa" : "inactiva"} / Ubicacion:{" "}
              {sharing || monitored || emergencyTracking ? "reportada" : "no disponible"} /
              Monitoreo: {monitored ? "continuo activo" : "apagado"} / Robo-emergencia:{" "}
              {emergencyTracking ? "activo" : "apagado"}
            </p>
          </div>

          <div className="los-info-panel bg-black/18">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              Monitoreo administrativo
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-ink">
              Ultimo monitoreo:{" "}
              {formatAdminDate(user.monitoring_updated_at || user.location_updated_at)} /
              Rastreo iniciado: {formatAdminDate(user.emergency_tracking_started_at)}
            </p>
          </div>

          <div className="los-info-panel bg-black/18">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              Contacto y push
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-ink">
              Contacto SOS: {user.emergency_contact || "Sin contacto"} / Push:{" "}
              {user.has_push_enabled ? "activada" : "sin push"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 p-3">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Acciones administrativas
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={"/mapa" as Route}
              className="los-action-primary"
            >
              Abrir mapa
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
            <button type="button" disabled className="los-action-ghost text-muted/70">
              Ver perfil: pendiente
            </button>
            {locationUrl ? (
              <a
                href={locationUrl}
                target="_blank"
                rel="noreferrer"
                className="los-action-ghost text-muted"
              >
                Ver ubicacion
              </a>
            ) : (
              <button type="button" disabled className="los-action-ghost text-muted opacity-60">
                Sin ubicacion
              </button>
            )}
          </div>
        </div>
      </details>
    </article>
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
    <div className={`los-card-compact border p-3 text-center ${toneClasses}`}>
      <p className="text-xl font-semibold text-ink">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
    </div>
  );
}

function CompactStatus({
  active,
  label,
  inactiveLabel,
  tone = "accent"
}: {
  active: boolean;
  label: string;
  inactiveLabel: string;
  tone?: "accent" | "danger" | "muted";
}) {
  const activeClass = tone === "danger" ? "los-chip-danger" : "los-chip-accent";

  return (
    <span className={`los-chip ${active ? activeClass : "los-chip-muted"}`}>
      {active ? label : inactiveLabel}
    </span>
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
