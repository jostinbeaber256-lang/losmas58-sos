import Link from "next/link";
import type { Route } from "next";
import {
  BellAlertIcon,
  CheckCircleIcon,
  MapIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { getAdminDashboardData } from "@/lib/admin/data";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardData();
  const cards = [
    {
      label: "Usuarios registrados",
      value: stats.users,
      icon: UserGroupIcon,
      tone: "text-accent"
    },
    {
      label: "SOS activos",
      value: stats.activeAlerts,
      icon: BellAlertIcon,
      tone: "text-danger"
    },
    {
      label: "SOS resueltos",
      value: stats.resolvedAlerts,
      icon: CheckCircleIcon,
      tone: "text-accent"
    },
    {
      label: "Moteros en ruta",
      value: stats.activeRiders,
      icon: MapIcon,
      tone: "text-warning"
    },
    {
      label: "Voy en camino",
      value: stats.responses,
      icon: UserGroupIcon,
      tone: "text-accent"
    }
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,43,0.94),rgba(8,12,22,0.97))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.045]">
                  <Icon className={`h-5 w-5 ${card.tone}`} />
                </span>
                <div>
                  <p className="text-2xl font-semibold text-ink">{card.value}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    {card.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href={"/admin/usuarios" as Route}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 transition hover:border-accent/30 hover:bg-accent/10"
        >
          <h2 className="text-lg font-semibold text-ink">Gestionar usuarios</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Revisa perfiles, ficha médica, push y rol admin.
          </p>
        </Link>
        <Link
          href={"/admin/alertas" as Route}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 transition hover:border-danger/30 hover:bg-danger/10"
        >
          <h2 className="text-lg font-semibold text-ink">Gestionar alertas</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Filtra SOS, revisa apoyos y cierra incidentes manualmente.
          </p>
        </Link>
        <Link
          href={"/admin/rutas" as Route}
          className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 transition hover:border-warning/30 hover:bg-warning/10"
        >
          <h2 className="text-lg font-semibold text-ink">Monitorear rutas</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Mira usuarios en ruta, ubicación y última actividad.
          </p>
        </Link>
      </div>
    </section>
  );
}
