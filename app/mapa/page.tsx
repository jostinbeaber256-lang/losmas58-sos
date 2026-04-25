import { LiveMap } from "@/components/live-map";
import { MapIcon, SignalIcon } from "@heroicons/react/24/solid";

export default function MapPage() {
  return (
    <main className="space-y-5 md:space-y-6">
      <section className="los-hero">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-danger/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="los-chip los-chip-accent">
              <SignalIcon className="h-4 w-4" />
              Mapa en vivo
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-ink md:text-4xl">
              Tu peloton y emergencias en tiempo real.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted md:text-base">
              Visualiza tu posicion, companeros activos y SOS cercanos con una
              lectura rapida, clara y lista para la ruta.
            </p>
          </div>

          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] shadow-[0_0_34px_rgba(32,211,238,0.12)]">
            <MapIcon className="h-7 w-7 text-accent" />
          </div>
        </div>
      </section>
      <LiveMap />
    </main>
  );
}
