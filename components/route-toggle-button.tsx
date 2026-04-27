"use client";

import { MapPinIcon } from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

export function RouteToggleButton() {
  const { isOnRoute, loading, toggleRoute } = useRoutePresence();

  async function handleToggleRoute() {
    await toggleRoute();
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={handleToggleRoute}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-6 py-3.5 text-sm font-semibold transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base ${
          isOnRoute
            ? "border-danger/45 bg-danger/12 text-danger shadow-[0_0_28px_rgba(239,68,68,0.18)] hover:bg-danger/15"
            : "border-accent/45 bg-accent/12 text-accent shadow-[0_0_28px_rgba(32,211,238,0.18)] hover:bg-accent/15"
        }`}
      >
        <MapPinIcon className="h-4 w-4" />
        {loading ? "Procesando..." : isOnRoute ? "Detener ruta" : "Iniciar ruta"}
      </button>
      
      <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-muted">
        Tu ubicación solo se comparte durante la ruta activa.
      </p>
    </div>
  );
}
