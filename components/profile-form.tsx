"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserIcon
} from "@heroicons/react/24/solid";
import type { ProfileFormValues } from "@/lib/types";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

function getInitials(name: string | null, username: string | null) {
  const source = (name || username || "M").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ProfileForm() {
  const { profile, profileSaving, error, updateProfile } = useRoutePresence();
  const [saved, setSaved] = useState<string | null>(null);
  const [values, setValues] = useState<ProfileFormValues>({
    full_name: "",
    username: "",
    bike_model: "",
    city: "",
    emergency_contact: ""
  });
  const [initializedProfileId, setInitializedProfileId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  function createFormValues() {
    return {
      full_name: profile?.full_name ?? "",
      username: profile?.username ?? "",
      bike_model: profile?.bike_model ?? "",
      city: profile?.city ?? "",
      emergency_contact: profile?.emergency_contact ?? ""
    };
  }

  useEffect(() => {
    if (!profile) {
      return;
    }

    if (initializedProfileId !== profile.id) {
      setValues(createFormValues());
      setInitializedProfileId(profile.id);
      setIsDirty(false);
    }
  }, [initializedProfileId, profile]);

  const initials = useMemo(
    () =>
      getInitials(
        values.full_name || profile?.full_name || null,
        values.username || profile?.username || null
      ),
    [profile?.full_name, profile?.username, values.full_name, values.username]
  );
  const requiredFields = [
    { key: "full_name", label: "Nombre" },
    { key: "username", label: "Username" },
    { key: "bike_model", label: "Moto" },
    { key: "city", label: "Ciudad" },
    { key: "emergency_contact", label: "Contacto SOS" }
  ] as const;
  const missingFields = requiredFields.filter((field) => !values[field.key].trim());
  const completedCount = requiredFields.length - missingFields.length;
  const profileStatusLabel = missingFields.length ? "Incompleto" : "Completo";
  const profileStatusClasses = missingFields.length
    ? "border-warning/30 bg-warning/12 text-warning"
    : "border-accent/30 bg-accent/12 text-accent";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(null);

    const success = await updateProfile(values);

    if (success) {
      setIsDirty(false);
      setSaved("Perfil actualizado correctamente.");
    }
  }

  function updateField<K extends keyof ProfileFormValues>(key: K, value: string) {
    setSaved(null);
    setIsDirty(true);
    setValues((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_0%_0%,rgba(32,211,238,0.14),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.96),rgba(7,11,20,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] md:p-6">
        <div className="pointer-events-none absolute -right-20 top-0 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] border border-accent/25 bg-accent/12 text-2xl font-semibold text-accent shadow-[0_0_36px_rgba(32,211,238,0.16)]">
              <div className="pointer-events-none absolute inset-2 rounded-[1.2rem] border border-white/10" />
              {initials}
            </div>
            <div className="los-section-head min-w-0 sm:items-start">
              <p className="los-section-kicker text-accent/80">
                Ficha personal
              </p>
              <h2 className="break-words text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.15rem]">
                {values.full_name || values.username || "Completa tu perfil"}
              </h2>
              <p className="text-sm text-muted">
                {profile?.emergency_state === "emergency"
                  ? "Estado de emergencia activo"
                  : profile?.is_on_route
                    ? "En ruta"
                    : "Disponible para ruta"}
              </p>
            </div>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${profileStatusClasses}`}
          >
            Perfil {profileStatusLabel}
          </span>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
              <UserIcon className="h-3.5 w-3.5 text-accent" />
              Username
            </p>
            <p className="mt-1 break-words font-medium text-ink">
              {values.username || "Sin definir"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
              <MapPinIcon className="h-3.5 w-3.5 text-accent" />
              Ciudad
            </p>
            <p className="mt-1 break-words font-medium text-ink">
              {values.city || "Sin definir"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-muted">
              <PhoneIcon className="h-3.5 w-3.5 text-accent" />
              Contacto SOS
            </p>
            <p className="mt-1 break-words font-medium text-ink">
              {values.emergency_contact || "Sin definir"}
            </p>
          </div>
        </div>

        <div className="relative mt-4 rounded-2xl border border-white/10 bg-black/18 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {completedCount} de {requiredFields.length} datos completados
              </p>
              <p className="mt-1 text-sm leading-5 text-muted">
                {missingFields.length
                  ? `Falta completar: ${missingFields.map((field) => field.label).join(", ")}.`
                  : "Tu ficha de motero esta lista para mapa y SOS."}
              </p>
            </div>
            <CheckCircleIcon
              className={`h-6 w-6 shrink-0 ${
                missingFields.length ? "text-warning" : "text-accent"
              }`}
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(18,27,43,0.95),rgba(8,12,22,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-6">
        <div className="pointer-events-none absolute -right-24 -top-20 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="los-section-head los-section-head-center min-w-0 sm:items-start sm:text-left">
            <p className="los-section-kicker text-accent">
              Editar perfil
            </p>
            <h3 className="text-[1.55rem] font-semibold leading-tight text-ink sm:text-[1.75rem]">
              Datos reales del motero
            </h3>
            <p className="los-section-copy max-w-md text-sm">
              {missingFields.length
                ? `${completedCount} de ${requiredFields.length} datos completos.`
                : "Perfil listo: 5 de 5 datos completos."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditOpen((current) => !current)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent/15 sm:w-auto"
            aria-expanded={editOpen}
          >
            {editOpen ? "Cerrar" : "Editar"}
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform duration-200 ${
                editOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            editOpen ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <form onSubmit={handleSubmit}>
              <p className="text-sm leading-6 text-muted">
                Esta informacion se usara en perfil, mapa, alertas SOS y presencia en ruta.
              </p>

              <div className="relative mt-5 grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-muted">Nombre completo</span>
                  <input
                    type="text"
                    value={values.full_name}
                    onChange={(event) => updateField("full_name", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/50 focus:bg-accent/8"
                    placeholder="Ej. Jordan Rivas"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-muted">Username</span>
                  <input
                    type="text"
                    value={values.username}
                    onChange={(event) => updateField("username", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/50 focus:bg-accent/8"
                    placeholder="Ej. jordanrivas"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-muted">Moto / modelo</span>
                  <input
                    type="text"
                    value={values.bike_model}
                    onChange={(event) => updateField("bike_model", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/50 focus:bg-accent/8"
                    placeholder="Ej. Yamaha Tenere 700"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-muted">Ciudad</span>
                  <input
                    type="text"
                    value={values.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/50 focus:bg-accent/8"
                    placeholder="Ej. Caracas"
                  />
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-muted">
                    Contacto de emergencia
                  </span>
                  <input
                    type="text"
                    value={values.emergency_contact}
                    onChange={(event) => updateField("emergency_contact", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/50 focus:bg-accent/8"
                    placeholder="Ej. Ana Rivas / +58 412 000 0000"
                  />
                </label>
              </div>

              {error ? (
                <p className="relative mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              {saved ? (
                <p className="relative mt-4 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent">
                  {saved}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="relative w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-background shadow-[0_0_28px_rgba(32,211,238,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {profileSaving ? "Guardando..." : isDirty ? "Guardar cambios" : "Perfil guardado"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 font-semibold text-muted transition hover:border-accent/30 hover:text-accent"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
