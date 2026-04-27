"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

const EMERGENCY_OPTIONS = [
  "Llanta pinchada",
  "Sin combustible",
  "Accidente",
  "Averia",
  "Robo",
  "Emergencia medica",
  "Otros"
] as const;

const SOS_VARIANTS = {
  minimal: {
    name: "Elegante minimalista",
    idleShell:
      "bg-[radial-gradient(circle_at_30%_18%,rgba(255,244,246,.55),rgba(255,113,143,.88)_34%,rgba(97,10,31,.94)_68%,rgba(18,6,10,1))] shadow-[0_24px_70px_rgba(255,77,109,.24)]",
    activeShell:
      "bg-[radial-gradient(circle_at_30%_20%,rgba(255,246,248,.72),rgba(255,93,123,.96)_32%,rgba(110,8,31,.98)_70%,rgba(18,5,10,1))] shadow-[0_30px_82px_rgba(255,77,109,.36)]",
    innerSurface:
      "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.015))]",
    iconWrap: "border-white/10 bg-white/8",
    subtitle: "Emergencia inmediata",
    helper: "Pedir ayuda ahora"
  },
  aggressive: {
    name: "Agresiva llamativa",
    idleShell:
      "bg-[radial-gradient(circle_at_30%_14%,rgba(255,248,250,.64),rgba(255,85,116,.96)_24%,rgba(160,11,42,1)_54%,rgba(25,4,9,1))] shadow-[0_38px_100px_rgba(255,77,109,.44)]",
    activeShell:
      "bg-[radial-gradient(circle_at_30%_16%,rgba(255,252,252,.76),rgba(255,70,103,1)_22%,rgba(186,10,46,1)_48%,rgba(31,3,9,1))] shadow-[0_44px_110px_rgba(255,77,109,.56)]",
    innerSurface:
      "border-danger/25 bg-[linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.03))]",
    iconWrap: "border-white/12 bg-white/12",
    subtitle: "Alerta total",
    helper: "Activar rescate"
  },
  command: {
    name: "Centro de mando",
    idleShell:
      "bg-[radial-gradient(circle_at_30%_16%,rgba(255,247,250,.62),rgba(255,102,134,.9)_22%,rgba(120,13,38,.96)_42%,rgba(22,10,20,1)_72%,rgba(5,8,22,1))] shadow-[0_30px_92px_rgba(255,77,109,.32)]",
    activeShell:
      "bg-[radial-gradient(circle_at_30%_18%,rgba(255,248,250,.76),rgba(255,88,122,.98)_24%,rgba(143,14,44,.98)_44%,rgba(24,8,18,1)_72%,rgba(5,8,22,1))] shadow-[0_36px_105px_rgba(255,77,109,.48)]",
    innerSurface:
      "border-cyan-300/12 bg-[linear-gradient(180deg,rgba(255,255,255,.1),rgba(98,157,255,.04)_54%,rgba(255,255,255,.015))]",
    iconWrap:
      "border-cyan-200/12 bg-[linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04))]",
    subtitle: "Emergencia inmediata",
    helper: "Centro de respuesta"
  }
} as const;

const ACTIVE_VARIANT = SOS_VARIANTS.command;

export function SosButton() {
  const {
    profile,
    latestPosition,
    sosLoading,
    error,
    activeSosAlert,
    triggerSos,
  } = useRoutePresence();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [otherDetails, setOtherDetails] = useState("");
  const variant = ACTIVE_VARIANT;

  useEffect(() => {
    if (!confirmOpen) {
      setSelectedType(null);
      setOtherDetails("");
    }
  }, [confirmOpen]);

  async function handleConfirm() {
    if (!selectedType) {
      return;
    }

    const trimmedDetails = otherDetails.trim();

    if (selectedType === "Otros" && !trimmedDetails) {
      return;
    }

    const success = await triggerSos({
      emergencyType: selectedType,
      emergencyDetails: selectedType === "Otros" ? trimmedDetails : null
    });

    if (success) {
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={`group relative flex h-60 w-60 items-center justify-center rounded-full border border-white/10 transition duration-300 hover:scale-[1.02] active:scale-[0.98] ${
            activeSosAlert
              ? variant.activeShell
              : variant.idleShell
          }`}
          aria-label="Activar SOS"
          title={`Variante visual activa: ${variant.name}`}
        >
          <span
            className={`absolute inset-[-14px] rounded-full border ${
              activeSosAlert
                ? "border-danger/40 animate-sos-radar-strong"
                : "border-danger/26 animate-sos-radar-soft"
            }`}
          />
          <span className="absolute inset-[16px] rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.18),transparent_34%)]" />
          <span className="absolute bottom-7 left-10 right-10 h-10 rounded-full bg-black/25 blur-2xl" />

          <div
            className={`relative flex h-[78%] w-[78%] flex-col items-center justify-center rounded-full text-center backdrop-blur-sm ${variant.innerSurface}`}
          >
            <div
              className={`rounded-[1.3rem] border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] ${variant.iconWrap}`}
            >
              <ShieldExclamationIcon className="h-10 w-10 text-white" />
            </div>
            <span className="mt-4 text-[2rem] font-black tracking-[0.28em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.25)]">
              SOS
            </span>
            <span className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/78">
              {variant.subtitle}
            </span>
            <span className="mt-1 text-xs text-white/58">
              {variant.helper}
            </span>
          </div>
        </button>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75">
          <div className="safe-px safe-pb w-full">
            <div className="mx-auto flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] border border-danger/20 bg-[linear-gradient(180deg,#1a0b12_0%,#070910_100%)] shadow-[0_-30px_80px_rgba(0,0,0,.45)]">
              <div className="relative px-5 pb-3 pt-5 text-center">
                <div className="mx-auto max-w-[20rem]">
                  <p className="text-xs uppercase tracking-[0.3em] text-danger">
                    Tipo de emergencia
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">
                    ¿Qué emergencia tienes?
                  </h2>
                  <p className="mx-auto mt-1 max-w-[17rem] text-sm leading-5 text-muted">
                    Elige el tipo de apoyo antes de enviar la alerta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-muted transition hover:border-white/20 hover:bg-white/10"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <div className="rounded-[1.5rem] border border-danger/20 bg-danger/10 p-4 text-center">
                  <p className="mx-auto max-w-[20rem] text-sm leading-5 text-muted">
                    Se compartira tu ubicacion actual y la alerta se vera en el
                    mapa en tiempo real.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-left">
                    {EMERGENCY_OPTIONS.map((option) => {
                      const isSelected = selectedType === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedType(option)}
                          className={`rounded-[1.2rem] border px-4 py-3 text-left transition ${
                            isSelected
                              ? "border-danger/60 bg-[linear-gradient(180deg,rgba(255,77,109,.32),rgba(126,14,38,.42))] text-white shadow-[0_0_0_1px_rgba(255,77,109,.35),0_14px_34px_rgba(255,77,109,.18)]"
                              : "border-white/10 bg-black/20 text-ink"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-semibold leading-5">
                              {option}
                            </span>
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-danger bg-danger text-white"
                                  : "border-white/15 bg-white/5 text-transparent"
                              }`}
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedType === "Otros" ? (
                    <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
                      <label
                        htmlFor="emergency-details"
                        className="text-xs uppercase tracking-[0.24em] text-muted"
                      >
                        Describe el problema
                      </label>
                      <textarea
                        id="emergency-details"
                        value={otherDetails}
                        onChange={(event) => setOtherDetails(event.target.value)}
                        rows={3}
                        placeholder="Describe brevemente que necesitas."
                        className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-ink outline-none placeholder:text-muted focus:border-danger/40"
                      />
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2 text-left">
                    <details className="group rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
                        <span>
                          Ver datos del motero
                          <span className="ml-2 text-xs font-medium text-muted">
                            perfil, contacto y ubicacion
                          </span>
                        </span>
                        <ShieldCheckIcon className="h-4 w-4 text-accent transition group-open:rotate-45" />
                      </summary>

                      <div className="mt-4 grid gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                              Motero
                            </p>
                            <p className="mt-1 text-sm font-medium text-ink">
                              {profile?.full_name || profile?.username || "Usuario actual"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                              Moto
                            </p>
                            <p className="mt-1 text-sm font-medium text-ink">
                              {profile?.bike_model || "Sin registrar"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                              Ciudad
                            </p>
                            <p className="mt-1 text-sm text-ink">
                              {profile?.city || "Sin ciudad"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                              Ubicacion
                            </p>
                            <p className="mt-1 break-all text-sm text-ink">
                              {latestPosition
                                ? `${latestPosition.latitude.toFixed(4)}, ${latestPosition.longitude.toFixed(4)}`
                                : "Se capturara al confirmar"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
                            Contacto de emergencia
                          </p>
                          <p className="mt-1 text-sm text-ink">
                            {profile?.emergency_contact || "Sin contacto configurado"}
                          </p>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>

                {error ? (
                  <p className="mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                  </p>
                ) : null}

                {!selectedType ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
                    Selecciona un tipo de emergencia para poder enviar el SOS.
                  </p>
                ) : null}

                {selectedType === "Otros" && !otherDetails.trim() ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
                    Agrega una descripcion breve para continuar.
                  </p>
                ) : null}
              </div>

              <div className="border-t border-white/10 bg-[rgba(7,9,16,.94)] px-5 pb-5 pt-4 backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="rounded-2xl border border-line bg-surface px-4 py-4 font-semibold text-ink"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={
                      sosLoading ||
                      !selectedType ||
                      (selectedType === "Otros" && !otherDetails.trim())
                    }
                    className="rounded-2xl bg-danger px-4 py-4 font-semibold text-white shadow-sos disabled:opacity-70"
                  >
                    {sosLoading ? "Enviando..." : "Enviar SOS"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
