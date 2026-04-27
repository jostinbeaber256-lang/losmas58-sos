import Link from "next/link";
import type { Route } from "next";
import {
  BellAlertIcon,
  HeartIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { updateUserAdminRole } from "@/app/admin/usuarios/actions";
import {
  formatAdminDate,
  getAdminDisplayName,
  getAdminUsers,
  type AdminProfile
} from "@/lib/admin/data";

const filters = [
  { value: "all", label: "Todos" },
  { value: "admins", label: "Admins" },
  { value: "route", label: "En ruta" },
  { value: "medical", label: "Con ficha medica" },
  { value: "push", label: "Con push" },
  { value: "incomplete", label: "Perfil incompleto" }
];

function isProfileIncomplete(user: AdminProfile) {
  return !(
    user.full_name &&
    user.username &&
    user.bike_model &&
    user.city &&
    user.emergency_contact
  );
}

function filterUsers(users: AdminProfile[], filter: string) {
  switch (filter) {
    case "admins":
      return users.filter((user) => user.is_admin);
    case "route":
      return users.filter((user) => user.is_on_route);
    case "medical":
      return users.filter((user) => user.has_medical_profile);
    case "push":
      return users.filter((user) => user.has_push_enabled);
    case "incomplete":
      return users.filter(isProfileIncomplete);
    default:
      return users;
  }
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

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const selectedFilter = params?.filter ?? "all";
  const allUsers = await getAdminUsers();
  const searchedUsers = allUsers.filter((user) => matchesSearch(user, query));
  const users = filterUsers(searchedUsers, selectedFilter);
  const adminCount = allUsers.filter((user) => user.is_admin).length;
  const routeCount = allUsers.filter((user) => user.is_on_route).length;
  const pushCount = allUsers.filter((user) => user.has_push_enabled).length;

  return (
    <section className="space-y-5">
      <div className="los-card md:p-6">
        <div className="pointer-events-none absolute -right-24 -top-16 h-52 w-52 rounded-full bg-accent/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">
              Usuarios
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Control de moteros
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Gestiona identidad, estado de ruta, permisos y datos de seguridad
              sin saturar la vista principal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            <Metric label="Usuarios" value={allUsers.length} tone="accent" />
            <Metric label="Admins" value={adminCount} tone="warning" />
            <Metric label="En ruta" value={routeCount} tone="accent" />
            <Metric label="Push" value={pushCount} tone="danger" />
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
              usuarios registrados.
            </p>
          </div>
          <Link
            href={"/admin/usuarios" as Route}
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
              Filtro
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

          <button className="los-action-primary self-end px-5">
            Aplicar
          </button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {!users.length ? (
        <div className="los-empty p-8">
          <UserGroupIcon className="mx-auto h-10 w-10 text-accent" />
          <p className="mt-3 text-sm font-semibold text-ink">
            Sin usuarios para estos filtros
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
            Ajusta la busqueda o el filtro para revisar otros usuarios.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function UserCard({ user }: { user: AdminProfile }) {
  const incomplete = isProfileIncomplete(user);
  const medicalProfile = user.medical_profile;

  return (
    <article className="los-card">
      <div
        className={`pointer-events-none absolute inset-y-5 left-0 w-1 rounded-r-full ${
          user.is_admin ? "bg-accent shadow-[0_0_24px_rgba(32,211,238,.45)]" : "bg-white/20"
        }`}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3 sm:max-w-[62%]">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
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
          <CompactStatus active={user.is_admin} label="Admin" inactiveLabel="Usuario" />
          <CompactStatus active={Boolean(user.has_push_enabled)} label="Push" inactiveLabel="Sin push" />
          <CompactStatus
            active={Boolean(user.has_medical_profile)}
            label="Ficha medica"
            inactiveLabel="Ficha incompleta"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/8 pt-4 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPinIcon className="h-4 w-4 text-accent" />
          {user.city || "Sin ciudad"}
        </span>
        <span>
          Perfil:{" "}
          <strong className={incomplete ? "text-warning" : "text-accent"}>
            {incomplete ? "incompleto" : "completo"}
          </strong>
        </span>
      </div>

      <details className="group mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
          <span>
            Ver detalle administrativo
            <span className="ml-2 text-xs font-medium text-muted">
              contacto, seguridad y rol
            </span>
          </span>
          <ShieldCheckIcon className="h-4 w-4 text-accent transition group-open:rotate-45" />
        </summary>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Contacto SOS" value={user.emergency_contact || "Sin contacto"} />
            <Info
              label="Ultima actividad"
              value={formatAdminDate(user.location_updated_at || user.updated_at)}
            />
            <Info
              label="Push"
              value={user.has_push_enabled ? "Activada" : "Sin push"}
              icon={<BellAlertIcon className="h-3.5 w-3.5 text-accent" />}
            />
            <Info
              label="Ficha medica"
              value={user.has_medical_profile ? "Completada" : "Incompleta"}
              icon={<HeartIcon className="h-3.5 w-3.5 text-danger" />}
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              Perfil
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-ink">
              Nombre: {user.full_name || "Sin nombre"} / Username:{" "}
              {user.username || "Sin username"} / Estado:{" "}
              {user.emergency_state === "emergency" ? "Emergencia" : "Normal"}
            </p>
          </div>

          <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-danger">
              Ficha medica
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-ink">
              {medicalProfile
                ? [
                    medicalProfile.blood_type ? `Sangre ${medicalProfile.blood_type}` : null,
                    medicalProfile.allergies ? `Alergias: ${medicalProfile.allergies}` : null,
                    medicalProfile.medical_conditions
                      ? `Condiciones: ${medicalProfile.medical_conditions}`
                      : null,
                    medicalProfile.medications
                      ? `Medicamentos: ${medicalProfile.medications}`
                      : null
                  ]
                    .filter(Boolean)
                    .join(" / ") || "Ficha creada sin datos importantes"
                : "Sin ficha medica registrada"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/18 p-3">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Acciones administrativas
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled
              className="los-action-ghost text-muted/70"
            >
              Ver perfil: pendiente
            </button>
            <button
              type="button"
              disabled
              className="los-action-ghost text-muted/70"
            >
              Ver ficha medica: pendiente
            </button>
            <form action={updateUserAdminRole} className="contents">
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="isAdmin"
                value={user.is_admin ? "false" : "true"}
              />
              <button
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  user.is_admin
                    ? "border border-danger/30 bg-danger/12 text-danger"
                    : "border border-accent/30 bg-accent/10 text-accent"
                }`}
              >
                {user.is_admin ? "Quitar admin" : "Convertir en admin"}
              </button>
            </form>
            <button
              type="button"
              disabled
              className="los-action-ghost text-muted/60 opacity-70"
            >
              Activar/desactivar: pendiente
            </button>
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
    <div className={`los-card-compact border p-3 ${toneClasses}`}>
      <p className="text-xl font-semibold text-ink">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
    </div>
  );
}

function CompactStatus({
  active,
  label,
  inactiveLabel
}: {
  active: boolean;
  label: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`los-chip ${active ? "los-chip-accent" : "los-chip-muted"}`}
    >
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
  icon?: React.ReactNode;
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
