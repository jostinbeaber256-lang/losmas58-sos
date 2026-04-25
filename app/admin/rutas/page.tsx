import {
  formatAdminDate,
  getAdminDisplayName,
  getAdminRoutes
} from "@/lib/admin/data";
import { formatCoordinatesCompact } from "@/lib/map";

export default async function AdminRoutesPage() {
  const riders = await getAdminRoutes();

  return (
    <section className="space-y-5">
      <div className="rounded-[1.85rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,43,0.95),rgba(8,12,22,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
        <p className="text-xs uppercase tracking-[0.28em] text-warning">
          Rutas activas
        </p>
        <h2 className="mt-2 text-xl font-semibold text-ink">
          Moteros en ruta ahora
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Última ubicación reportada, estado de emergencia y actividad reciente.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {riders.map((rider) => (
          <article
            key={rider.id}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-ink">
                  {getAdminDisplayName(rider)}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {rider.bike_model || "Sin moto"} / {rider.city || "Sin ciudad"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  rider.emergency_state === "emergency"
                    ? "border-danger/30 bg-danger/12 text-danger"
                    : "border-accent/30 bg-accent/12 text-accent"
                }`}
              >
                {rider.emergency_state === "emergency" ? "SOS" : "En ruta"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info
                label="Ubicación"
                value={
                  rider.latitude !== null && rider.longitude !== null
                    ? formatCoordinatesCompact(rider.latitude, rider.longitude)
                    : "Sin coordenadas"
                }
              />
              <Info
                label="Última actividad"
                value={formatAdminDate(rider.location_updated_at)}
              />
              <Info label="Contacto SOS" value={rider.emergency_contact || "Sin contacto"} />
              <Info label="Push" value={rider.has_push_enabled ? "Activada" : "Sin push"} />
            </div>
          </article>
        ))}
      </div>

      {!riders.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/[0.035] p-8 text-center text-sm text-muted">
          No hay usuarios en ruta ahora mismo.
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
