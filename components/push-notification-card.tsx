"use client";

import { useState } from "react";
import { BellAlertIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { createClient } from "@/lib/supabase/browser";

type PushStatus = "idle" | "loading" | "enabled" | "denied" | "error";
type PushStep =
  | "idle"
  | "registering"
  | "permission"
  | "subscribing"
  | "saving"
  | "done";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

function getSubscriptionKey(subscription: PushSubscription, key: PushEncryptionKeyName) {
  const value = subscription.getKey(key);

  if (!value) {
    return "";
  }

  return window.btoa(String.fromCharCode(...new Uint8Array(value)));
}

export function PushNotificationCard() {
  const { currentUserId, isAuthenticated } = useRoutePresence();
  const [supabase] = useState(createClient);
  const [status, setStatus] = useState<PushStatus>("idle");
  const [step, setStep] = useState<PushStep>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleEnablePush() {
    setStatus("loading");
    setStep("registering");
    setMessage(null);

    if (!isAuthenticated || !currentUserId) {
      setStatus("error");
      setMessage("Inicia sesion para activar notificaciones push.");
      return;
    }

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("error");
      setStep("idle");
      setMessage("Este navegador no soporta notificaciones push web.");
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      setStatus("error");
      setStep("idle");
      setMessage("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
      return;
    }

    try {
      setMessage("Registrando service worker...");
      await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });

      const registration = await navigator.serviceWorker.ready;

      if (!registration.active) {
        setStatus("error");
        setStep("idle");
        setMessage("El service worker aun no esta activo. Intenta nuevamente en unos segundos.");
        return;
      }

      setStep("permission");
      setMessage("Service worker activo. Solicitando permiso...");
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("denied");
        setStep("idle");
        setMessage("Permiso denegado. Puedes activarlo luego desde ajustes del navegador.");
        return;
      }

      setStep("subscribing");
      setMessage("Permiso concedido. Creando suscripcion push...");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        }));

      setStep("saving");
      setMessage("Suscripcion creada. Guardando este dispositivo...");
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: currentUserId,
          endpoint: subscription.endpoint,
          p256dh: getSubscriptionKey(subscription, "p256dh"),
          auth: getSubscriptionKey(subscription, "auth"),
          user_agent: navigator.userAgent,
          enabled: true
        },
        { onConflict: "endpoint" }
      );

      if (error) {
        setStatus("error");
        setStep("idle");
        setMessage(error.message);
        return;
      }

      setStatus("enabled");
      setStep("done");
      setMessage("Notificaciones push activadas en este dispositivo.");
    } catch (pushError) {
      setStatus("error");
      setStep("idle");
      setMessage(
        pushError instanceof Error
          ? pushError.message
          : "No se pudieron activar las notificaciones push."
      );
    }
  }

  const statusCopy = {
    idle: "Recibe avisos aunque no estes mirando la app.",
    loading:
      step === "registering"
        ? "Registrando service worker..."
        : step === "permission"
          ? "Esperando permiso del navegador..."
          : step === "subscribing"
            ? "Creando suscripcion push..."
            : step === "saving"
              ? "Guardando suscripcion..."
              : "Preparando permisos y suscripcion...",
    enabled: "Push activadas para este dispositivo.",
    denied: "Permiso denegado para este navegador.",
    error: "No se pudo activar push."
  }[status];
  const statusMeta = {
    idle: {
      label: "Desactivadas",
      classes: "border-white/10 bg-white/[0.045] text-muted",
      icon: BellAlertIcon
    },
    loading: {
      label: "Activando",
      classes: "border-warning/30 bg-warning/12 text-warning",
      icon: BellAlertIcon
    },
    enabled: {
      label: "Activadas",
      classes: "border-accent/30 bg-accent/12 text-accent",
      icon: CheckCircleIcon
    },
    denied: {
      label: "Denegadas",
      classes: "border-danger/30 bg-danger/12 text-danger",
      icon: ExclamationTriangleIcon
    },
    error: {
      label: "Error",
      classes: "border-danger/30 bg-danger/12 text-danger",
      icon: ExclamationTriangleIcon
    }
  }[status];
  const StatusIcon = statusMeta.icon;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_100%_0%,rgba(32,211,238,0.12),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.95),rgba(8,12,22,0.98))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] md:p-6">
      <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-danger/20 bg-danger/12 p-3 text-danger shadow-[0_0_30px_rgba(255,77,109,0.1)]">
          <BellAlertIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">
            Notificaciones
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Alertas push
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">{statusCopy}</p>
        </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusMeta.classes}`}
        >
          <StatusIcon className="h-4 w-4" />
          {statusMeta.label}
        </span>
      </div>

      {message ? (
        <p
          className={`relative mt-4 rounded-2xl border px-4 py-3 text-sm ${
            status === "enabled"
              ? "border-accent/25 bg-accent/10 text-accent"
              : "border-danger/25 bg-danger/10 text-danger"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleEnablePush}
        disabled={status === "loading"}
        className="relative mt-5 w-full rounded-2xl bg-danger px-4 py-3.5 font-semibold text-white shadow-[0_18px_40px_rgba(255,77,109,.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Activando..." : "Activar notificaciones push"}
      </button>
    </section>
  );
}
