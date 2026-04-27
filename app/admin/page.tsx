import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
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
  const operationLinks = [
    {
      href: "/admin/usuarios" as Route,
      title: "Gestionar usuarios",
      description: "Revisa identidad, roles, ficha medica, push y estado de seguridad.",
      action: "Abrir usuarios",
      tone: "accent",
      icon: UserGroupIcon
    },
    {
      href: "/admin/alertas" as Route,
      title: "Gestionar alertas",
      description: "Filtra SOS, revisa apoyos y cierra incidentes manualmente.",
      action: "Abrir incidentes",
      tone: "danger",
      icon: BellAlertIcon
    },
    {
      href: "/admin/rutas" as Route,
      title: "Monitorear rutas",
      description: "Mira presencia, ubicacion, monitoreo continuo y ultima actividad.",
      action: "Abrir rutas",
      tone: "warning",
      icon: MapIcon
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
              className="los-card-compact transition hover:border-accent/20 hover:bg-white/[0.06]"
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
        {operationLinks.map((item) => {
          const Icon = item.icon;
          const toneClass =
            item.tone === "danger"
              ? "border-danger/25 bg-danger/10 text-danger"
              : item.tone === "warning"
                ? "border-warning/25 bg-warning/10 text-warning"
                : "border-accent/25 bg-accent/10 text-accent";

          return (
            <Link
              key={item.href}
              href={item.href}
              className="los-card group transition hover:border-accent/25 hover:bg-white/[0.055]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${toneClass}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="los-chip los-chip-muted transition group-hover:border-accent/25 group-hover:text-accent">
                  Consola
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                {item.action}
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
