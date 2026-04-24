"use client";

import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

export function MedicalProfileCard() {
  const { medicalProfile } = useRoutePresence();
  const isComplete = Boolean(medicalProfile);

  return (
    <section className="panel-blur rounded-[2rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-3xl bg-danger/12 p-3 text-danger">
            <HeartIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-danger">
              Ficha medica
            </p>
            <h3 className="mt-2 text-xl font-semibold text-ink">
              Datos vitales para emergencias
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Registra alergias, medicamentos, contactos y hospital preferido para
              usarlo en caso de accidente.
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
            isComplete
              ? "border border-accent/25 bg-accent/10 text-accent"
              : "border border-danger/25 bg-danger/10 text-danger"
          }`}
        >
          {isComplete ? "Completa" : "Incompleta"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-3">
          <p className="text-sm text-muted">Grupo sanguineo</p>
          <p className="mt-1 font-medium text-ink">
            {medicalProfile?.blood_type || "Sin registrar"}
          </p>
        </div>

        <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-3">
          <p className="text-sm text-muted">Visible en SOS</p>
          <p className="mt-1 font-medium text-ink">
            {medicalProfile?.show_in_sos ? "Si" : "No"}
          </p>
        </div>
      </div>

      <Link
        href="/perfil/ficha-medica"
        className="mt-5 block w-full rounded-2xl border border-danger/25 bg-danger/12 px-4 py-3 text-center font-semibold text-danger transition hover:border-danger/40 hover:bg-danger/18"
      >
        {isComplete ? "Editar ficha medica" : "Completar ficha medica"}
      </Link>
    </section>
  );
}
