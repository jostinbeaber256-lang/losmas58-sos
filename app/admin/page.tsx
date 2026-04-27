import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
  BellAlertIcon,
  CheckCircleIcon,
  MapIcon,
  PlayIcon,
  StopCircleIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import { finishGroupRide, startGroupRide } from "@/app/admin/rodadas/actions";
import {
  formatAdminDate,
  getAdminDashboardData,
  getAdminRideData
} from "@/lib/admin/data";

export default async function AdminDashboardPage() {
  const [stats, rideData] = await Promise.all([
    getAdminDashboardData(),
    getAdminRideData()
  ]);
  const activeRide = rideData.activeRide;
  const confirmedCount = rideData.participants.filter(
    (participant) => participant.attendance_status === "confirmed"
  ).length;
  const liveCount = rideData.participants.filter(
    (participant) => participant.live_route_enabled
  ).length;
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

      <section className="los-card">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <span className="los-chip los-chip-accent">
              Rodadas del club
            </span>
            <h2 className="mt-4 text-xl font-semibold text-ink">
              Control de evento activo
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Inicia una salida grupal para que los moteros confirmen asistencia
              y compartan ubicación solo durante la rodada.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <MiniMetric label="Evento" value={activeRide ? "Activo" : "Sin rodada"} />
              <MiniMetric label="Confirmados" value={confirmedCount} />
              <MiniMetric label="En ruta" value={liveCount} />
            </div>

            {activeRide ? (
              <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3">
                <p className="text-sm font-semibold text-ink">{activeRide.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Punto: {activeRide.meeting_point || "Sin punto definido"} / Salida:{" "}
                  {formatAdminDate(activeRide.starts_at)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/18 p-4">
            {activeRide ? (
              <form action={finishGroupRide} className="space-y-3">
                <input type="hidden" name="rideId" value={activeRide.id} />
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Acción administrativa
                </p>
                <button className="los-action-danger w-full">
                  <StopCircleIcon className="h-4 w-4" />
                  Finalizar rodada activa
                </button>
                <p className="text-xs leading-5 text-muted">
                  Al finalizarla, dejará de mostrarse como evento activo en Perfil.
                </p>
              </form>
            ) : (
              <form action={startGroupRide} className="grid gap-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Iniciar nueva rodada
                </p>
                <input
                  name="name"
                  required
                  placeholder="Nombre: Jueves Motero"
                  className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-accent/40"
                />
                <input
                  name="meetingPoint"
                  placeholder="Punto de encuentro"
                  className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-accent/40"
                />
                <input
                  name="startsAt"
                  type="datetime-local"
                  className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-ink outline-none focus:border-accent/40"
                />
                <button className="los-action-primary w-full">
                  <PlayIcon className="h-4 w-4" />
                  Iniciar rodada
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="los-info-panel p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
