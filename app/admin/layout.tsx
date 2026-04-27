import Link from "next/link";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { AdminNav } from "@/components/admin-nav";
import { getAdminContext } from "@/lib/admin/data";

function AdminAccessDenied() {
  return (
    <main className="space-y-5">
      <section className="los-hero-danger p-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-danger/25 bg-danger/12 text-danger">
          <ShieldExclamationIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold leading-tight text-ink sm:text-[2.2rem]">
          Acceso administrativo restringido
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Tu usuario no tiene permisos de administrador. Para entrar a este panel,
          tu registro en `profiles` debe tener `is_admin = true`.
        </p>
        <Link
          href="/"
          className="los-action-ghost mt-5"
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
      <section className="los-hero">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="los-section-head los-section-head-center max-w-xl lg:items-start lg:text-left">
            <div className="los-chip los-chip-accent">
              <ShieldExclamationIcon className="h-4 w-4" />
              Admin V1
            </div>
            <h1 className="los-section-title">
              Centro de control Los+58
            </h1>
            <p className="los-section-copy max-w-xl">
              Usuarios, alertas SOS, rutas activas y actividad operativa en un
              panel interno seguro.
            </p>
          </div>
          <div className="los-info-panel mx-auto text-sm text-muted lg:mx-0">
            Admin:{" "}
            <span className="font-semibold text-ink">
              {context.profile?.full_name || context.profile?.username || "Los+58"}
            </span>
          </div>
        </div>
      </section>

      <AdminNav />

      {children}
    </main>
  );
}
