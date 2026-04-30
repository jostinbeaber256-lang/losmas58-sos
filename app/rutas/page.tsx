import { SecurityMonitoringCard } from "@/components/security-monitoring-card";
import { MapPinIcon, UserGroupIcon } from "@heroicons/react/24/solid";

export default function RoutesPage() {
  return (
    <main className="space-y-5 md:space-y-6">
      <section className="los-hero">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-warning/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="los-chip los-chip-accent">
            <UserGroupIcon className="h-4 w-4" />
            Rutas
          </div>
          <div className="los-section-head los-section-head-center max-w-2xl">
            <h1 className="los-section-title">Rodadas del club.</h1>
            <p className="los-section-copy max-w-2xl">
              Confirma asistencia, comparte tu ubicacion durante la salida y
              monitorea al grupo motero en tiempo real.
            </p>
          </div>
          <div className="los-chip los-chip-muted">
            <MapPinIcon className="h-4 w-4" />
            Control grupal en vivo
          </div>
        </div>
      </section>

      <SecurityMonitoringCard />
    </main>
  );
}
