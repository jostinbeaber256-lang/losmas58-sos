import Link from "next/link";
import type { Route } from "next";
import {
  BellAlertIcon,
  ChartBarIcon,
  MapIcon,
  ShieldExclamationIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { getAdminContext } from "@/lib/admin/data";

const adminLinks: Array<{
  href: Route;
  label: string;
  icon: typeof ChartBarIcon;
}> = [
  { href: "/admin" as Route, label: "Dashboard", icon: ChartBarIcon },
  { href: "/admin/usuarios" as Route, label: "Usuarios", icon: UserGroupIcon },
  { href: "/admin/alertas" as Route, label: "Alertas", icon: BellAlertIcon },
  { href: "/admin/rutas" as Route, label: "Rutas", icon: MapIcon }
];

function AdminAccessDenied() {
  return (
    <main className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-danger/25 bg-[radial-gradient(circle_at_18%_0%,rgba(255,77,109,0.18),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.98),rgba(6,10,20,0.96))] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-danger/25 bg-danger/12 text-danger">
          <ShieldExclamationIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-ink">
          Acceso administrativo restringido
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Tu usuario no tiene permisos de administrador. Para entrar a este panel,
          tu registro en `profiles` debe tener `is_admin = true`.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 font-semibold text-accent transition hover:bg-accent/15"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const context = await getAdminContext();

  if (!context.isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <main className="space-y-5 md:space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(32,211,238,0.18),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.98),rgba(6,10,20,0.96))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)] md:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              <ShieldExclamationIcon className="h-4 w-4" />
              Admin V1
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink md:text-4xl">
              Centro de control Los+58
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted md:text-base">
              Usuarios, alertas SOS, rutas activas y actividad operativa en un
              panel interno seguro.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-muted">
            Admin:{" "}
            <span className="font-semibold text-ink">
              {context.profile?.full_name || context.profile?.username || "Los+58"}
            </span>
          </div>
        </div>
      </section>

      <nav className="grid gap-2 sm:grid-cols-4">
        {adminLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-muted transition hover:border-accent/30 hover:bg-accent/10 hover:text-accent"
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </main>
  );
}
