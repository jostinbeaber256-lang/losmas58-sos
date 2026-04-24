"use client";

import { useEffect, useState } from "react";
import type { MedicalProfileFormValues } from "@/lib/types";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

const BLOOD_TYPES = ["", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function getInitialValues(): MedicalProfileFormValues {
  return {
    blood_type: "",
    allergies: "",
    medical_conditions: "",
    medications: "",
    notes: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    secondary_contact_name: "",
    secondary_contact_phone: "",
    insurance_info: "",
    preferred_hospital: "",
    show_in_sos: false
  };
}

export function MedicalProfileForm() {
  const {
    medicalProfile,
    medicalProfileSaving,
    error,
    updateMedicalProfile
  } = useRoutePresence();
  const [values, setValues] = useState<MedicalProfileFormValues>(getInitialValues);
  const [saved, setSaved] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initializedProfileId, setInitializedProfileId] = useState<string | null>(null);

  useEffect(() => {
    const nextId = medicalProfile?.user_id ?? "empty";

    if (initializedProfileId === nextId) {
      return;
    }

    setValues({
      blood_type: medicalProfile?.blood_type ?? "",
      allergies: medicalProfile?.allergies ?? "",
      medical_conditions: medicalProfile?.medical_conditions ?? "",
      medications: medicalProfile?.medications ?? "",
      notes: medicalProfile?.notes ?? "",
      emergency_contact_name: medicalProfile?.emergency_contact_name ?? "",
      emergency_contact_phone: medicalProfile?.emergency_contact_phone ?? "",
      secondary_contact_name: medicalProfile?.secondary_contact_name ?? "",
      secondary_contact_phone: medicalProfile?.secondary_contact_phone ?? "",
      insurance_info: medicalProfile?.insurance_info ?? "",
      preferred_hospital: medicalProfile?.preferred_hospital ?? "",
      show_in_sos: medicalProfile?.show_in_sos ?? false
    });
    setInitializedProfileId(nextId);
  }, [initializedProfileId, medicalProfile]);

  function updateField<K extends keyof MedicalProfileFormValues>(
    key: K,
    value: MedicalProfileFormValues[K]
  ) {
    setSaved(null);
    setValidationError(null);
    setValues((current) => ({
      ...current,
      [key]: value
    }));
  }

  function validate() {
    const hasPrimaryName = Boolean(values.emergency_contact_name.trim());
    const hasPrimaryPhone = Boolean(values.emergency_contact_phone.trim());
    const hasSecondaryName = Boolean(values.secondary_contact_name.trim());
    const hasSecondaryPhone = Boolean(values.secondary_contact_phone.trim());

    if (hasPrimaryName !== hasPrimaryPhone) {
      return "El contacto principal debe tener nombre y telefono.";
    }

    if (hasSecondaryName !== hasSecondaryPhone) {
      return "El contacto secundario debe tener nombre y telefono.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(null);

    const nextError = validate();

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    const success = await updateMedicalProfile(values);

    if (success) {
      setSaved("Ficha medica actualizada correctamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel-blur rounded-[2rem] p-5">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-danger">
          Ficha medica
        </p>
        <h3 className="text-xl font-semibold text-ink">
          Datos medicos importantes
        </h3>
        <p className="text-sm leading-6 text-muted">
          Guarda solo la informacion clave que podria ayudar a atenderte mejor en
          una emergencia.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Grupo sanguineo</span>
          <select
            value={values.blood_type}
            onChange={(event) => updateField("blood_type", event.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
          >
            {BLOOD_TYPES.map((type) => (
              <option key={type || "none"} value={type}>
                {type || "Selecciona una opcion"}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Alergias</span>
          <textarea
            value={values.allergies}
            onChange={(event) => updateField("allergies", event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
            placeholder="Ej. Penicilina, mariscos"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Condiciones medicas</span>
          <textarea
            value={values.medical_conditions}
            onChange={(event) => updateField("medical_conditions", event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
            placeholder="Ej. Diabetes, hipertension"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Medicamentos</span>
          <textarea
            value={values.medications}
            onChange={(event) => updateField("medications", event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
            placeholder="Ej. Losartan 50mg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Notas adicionales</span>
          <textarea
            value={values.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
            placeholder="Indicaciones utiles para una emergencia"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-muted">Contacto principal</span>
            <input
              type="text"
              value={values.emergency_contact_name}
              onChange={(event) =>
                updateField("emergency_contact_name", event.target.value)
              }
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
              placeholder="Nombre"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Telefono principal</span>
            <input
              type="tel"
              value={values.emergency_contact_phone}
              onChange={(event) =>
                updateField("emergency_contact_phone", event.target.value)
              }
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
              placeholder="+58 412 000 0000"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-muted">Contacto secundario</span>
            <input
              type="text"
              value={values.secondary_contact_name}
              onChange={(event) =>
                updateField("secondary_contact_name", event.target.value)
              }
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
              placeholder="Nombre"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Telefono secundario</span>
            <input
              type="tel"
              value={values.secondary_contact_phone}
              onChange={(event) =>
                updateField("secondary_contact_phone", event.target.value)
              }
              className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
              placeholder="+58 414 000 0000"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Seguro medico</span>
          <input
            type="text"
            value={values.insurance_info}
            onChange={(event) => updateField("insurance_info", event.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
            placeholder="Poliza, empresa o datos utiles"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-muted">Hospital preferido</span>
          <input
            type="text"
            value={values.preferred_hospital}
            onChange={(event) => updateField("preferred_hospital", event.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-danger"
            placeholder="Centro medico de preferencia"
          />
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4">
          <input
            type="checkbox"
            checked={values.show_in_sos}
            onChange={(event) => updateField("show_in_sos", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-line bg-surface text-danger"
          />
          <div>
            <p className="font-medium text-ink">Mostrar datos medicos en el SOS</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Si activas esta opcion, la alerta compartira un resumen medico con
              datos importantes para atenderte mejor.
            </p>
          </div>
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {validationError ? (
        <p className="mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {validationError}
        </p>
      ) : null}

      {saved ? (
        <p className="mt-4 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-accent">
          {saved}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={medicalProfileSaving}
        className="mt-5 w-full rounded-2xl bg-danger px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {medicalProfileSaving ? "Guardando..." : "Guardar ficha medica"}
      </button>
    </form>
  );
}
