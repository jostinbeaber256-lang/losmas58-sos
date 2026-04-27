"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  HeartIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

export function MedicalProfileCard() {
  const { medicalProfile } = useRoutePresence();
  const isComplete = Boolean(medicalProfile);
  const medicalItems = [
    {
      label: "Grupo sanguineo",
      value: medicalProfile?.blood_type || "Sin registrar"
    },
    {
      label: "Alergias",
      value: medicalProfile?.allergies || "Sin registrar"
    },
    {
      label: "Condiciones",
      value: medicalProfile?.medical_conditions || "Sin registrar"
    },
    {
      label: "Medicamentos",
      value: medicalProfile?.medications || "Sin registrar"
    }
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(255,77,109,0.14),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.95),rgba(8,12,22,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-6">
      <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-danger/12 blur-3xl" />
      <div className="relative flex flex-col gap-5 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="flex items-start gap-4">
          <div className="rounded-3xl border border-danger/20 bg-danger/12 p-3 text-danger shadow-[0_0_30px_rgba(255,77,109,0.12)]">
            <HeartIcon className="h-6 w-6" />
          </div>
          <div className="los-section-head sm:items-start">
            <p className="los-section-kicker text-danger">
              Ficha medica
            </p>
            <h3 className="text-[1.55rem] font-semibold leading-tight text-ink sm:text-[1.75rem]">
              Datos vitales para emergencias
            </h3>
            <p className="los-section-copy max-w-lg text-sm">
              Registra alergias, medicamentos, contactos y hospital preferido para
              usarlo en caso de accidente.
            </p>
          </div>
        </div>

        <span
          className={`mx-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] sm:mx-0 ${
            isComplete
              ? "border border-accent/25 bg-accent/10 text-accent"
              : "border border-danger/25 bg-danger/10 text-danger"
          }`}
        >
          {isComplete ? "Completa" : "Incompleta"}
        </span>
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {medicalProfile?.show_in_sos
                ? "Compartir datos vitales en SOS"
                : "Datos medicos privados"}
            </p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {medicalProfile?.show_in_sos
                ? "Solo se mostraran datos importantes en una emergencia."
                : "Activa la opcion en tu ficha si quieres compartirlos en SOS."}
            </p>
          </div>
          <ShieldCheckIcon
            className={`h-6 w-6 shrink-0 ${
              medicalProfile?.show_in_sos ? "text-accent" : "text-muted"
            }`}
          />
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
        {medicalItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
              {item.label}
            </p>
            <p className="mt-1 line-clamp-2 break-words text-sm font-medium text-ink">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <Link
        href="/perfil/ficha-medica"
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/25 bg-danger/12 px-4 py-3.5 text-center font-semibold text-danger transition hover:border-danger/40 hover:bg-danger/18"
      >
        {isComplete ? "Editar ficha medica" : "Completar ficha medica"}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </section>
  );
}
