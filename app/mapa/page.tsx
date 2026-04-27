import { LiveMap } from "@/components/live-map";
import { MapIcon, SignalIcon } from "@heroicons/react/24/solid";

export default function MapPage() {
  return (
    <main className="space-y-5 md:space-y-6">
      <section className="los-hero">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-danger/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="los-section-head los-section-head-center max-w-xl sm:items-start sm:text-left">
            <div className="los-chip los-chip-accent">
              <SignalIcon className="h-4 w-4" />
              Mapa en vivo
            </div>
            <h1 className="los-section-title max-w-2xl">
              Tu peloton y emergencias en tiempo real.
            </h1>
            <p className="los-section-copy max-w-xl">
              Visualiza tu posicion, companeros activos y SOS cercanos con una
              lectura rapida, clara y lista para la ruta.
            </p>
          </div>

          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] shadow-[0_0_34px_rgba(32,211,238,0.12)] sm:mx-0">
            <MapIcon className="h-7 w-7 text-accent" />
          </div>
        </div>
      </section>
      <LiveMap />
    </main>
  );
}
