import { getAdminDisplayName, getAdminUsers, formatAdminDate } from "@/lib/admin/data";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q ?? "";
  const users = await getAdminUsers(query);

  return (
    <section className="space-y-5">
      <div className="rounded-[1.85rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,43,0.95),rgba(8,12,22,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">
              Usuarios
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink">
              Gestión de moteros
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Busca por nombre, username, moto o ciudad.
            </p>
          </div>
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar usuario..."
              className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/40"
            />
            <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-background">
              Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-ink">
                  {getAdminDisplayName(user)}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  @{user.username || "sin-username"} / {user.city || "Sin ciudad"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  user.is_admin
                    ? "border-accent/30 bg-accent/12 text-accent"
                    : "border-white/10 bg-white/[0.045] text-muted"
                }`}
              >
                {user.is_admin ? "Admin" : "Usuario"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Moto" value={user.bike_model || "Sin moto"} />
              <Info label="Contacto SOS" value={user.emergency_contact || "Sin contacto"} />
              <Info label="Ficha médica" value={user.has_medical_profile ? "Creada" : "Incompleta"} />
              <Info label="Push" value={user.has_push_enabled ? "Activada" : "Sin push"} />
              <Info label="Ruta" value={user.is_on_route ? "En ruta" : "Fuera de ruta"} />
              <Info label="Última actividad" value={formatAdminDate(user.location_updated_at || user.updated_at)} />
            </div>
          </article>
        ))}
      </div>

      {!users.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.035] p-8 text-center text-sm text-muted">
          No hay usuarios que coincidan con la búsqueda.
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
