"use client";

import { useEffect, useMemo, useState } from "react";
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
    () => getInitials(values.full_name || profile?.full_name || null, values.username || profile?.username || null),
    [profile?.full_name, profile?.username, values.full_name, values.username]
  );

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
      <section className="panel-blur rounded-[2rem] p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/15 text-2xl font-semibold text-accent">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">
              {values.full_name || values.username || "Completa tu perfil"}
            </h2>
            <p className="text-sm text-muted">
              {profile?.emergency_state === "emergency"
                ? "Estado de emergencia activo"
                : profile?.is_on_route
                  ? "En ruta"
                  : "Disponible"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-3">
            <p className="text-sm text-muted">Username</p>
            <p className="mt-1 font-medium text-ink">
              {values.username || "Sin definir"}
            </p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-surface/90 px-4 py-3">
            <p className="text-sm text-muted">Ciudad</p>
            <p className="mt-1 font-medium text-ink">
              {values.city || "Sin definir"}
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="panel-blur rounded-[2rem] p-5">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.35em] text-accent">
            Editar perfil
          </p>
          <h3 className="text-xl font-semibold text-ink">
            Datos reales del motero
          </h3>
          <p className="text-sm leading-6 text-muted">
            Esta informacion se usara en perfil, mapa, alertas SOS y presencia en ruta.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-muted">Nombre completo</span>
            <input
              type="text"
              value={values.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent"
              placeholder="Ej. Jordan Rivas"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Username</span>
            <input
              type="text"
              value={values.username}
              onChange={(event) => updateField("username", event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent"
              placeholder="Ej. jordanrivas"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Moto / modelo</span>
            <input
              type="text"
              value={values.bike_model}
              onChange={(event) => updateField("bike_model", event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent"
              placeholder="Ej. Yamaha Tenere 700"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Ciudad</span>
            <input
              type="text"
              value={values.city}
              onChange={(event) => updateField("city", event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent"
              placeholder="Ej. Caracas"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Contacto de emergencia</span>
            <input
              type="text"
              value={values.emergency_contact}
              onChange={(event) => updateField("emergency_contact", event.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-accent"
              placeholder="Ej. Ana Rivas · +58 412 000 0000"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {saved ? (
          <p className="mt-4 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent">
            {saved}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={profileSaving}
          className="mt-5 w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-background transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {profileSaving ? "Guardando..." : "Guardar perfil"}
        </button>
      </form>
    </>
  );
}
