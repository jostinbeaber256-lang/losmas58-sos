"use client";

import { useState } from "react";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { createClient } from "@/lib/supabase/browser";

type PushStatus = "idle" | "loading" | "enabled" | "denied" | "error";

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
  const [message, setMessage] = useState<string | null>(null);

  async function handleEnablePush() {
    setStatus("loading");
    setMessage(null);

    if (!isAuthenticated || !currentUserId) {
      setStatus("error");
      setMessage("Inicia sesion para activar notificaciones push.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("error");
      setMessage("Este navegador no soporta notificaciones push web.");
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      setStatus("error");
      setMessage("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setStatus("denied");
      setMessage("Permiso denegado. Puedes activarlo luego desde ajustes del navegador.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        }));

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
        setMessage(error.message);
        return;
      }

      setStatus("enabled");
      setMessage("Notificaciones push activadas en este dispositivo.");
    } catch (pushError) {
      setStatus("error");
      setMessage(
        pushError instanceof Error
          ? pushError.message
          : "No se pudieron activar las notificaciones push."
      );
    }
  }

  const statusCopy = {
    idle: "Recibe avisos aunque no estes mirando la app.",
    loading: "Preparando permisos y suscripcion...",
    enabled: "Push activadas para este dispositivo.",
    denied: "Permiso denegado para este navegador.",
    error: "No se pudo activar push."
  }[status];

  return (
    <section className="panel-blur rounded-[2rem] p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-danger/12 p-3 text-danger">
          <BellAlertIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">
            Notificaciones
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Alertas push
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">{statusCopy}</p>
        </div>
      </div>

      {message ? (
        <p
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
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
        className="mt-5 w-full rounded-2xl bg-danger px-4 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(255,77,109,.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Activando..." : "Activar notificaciones push"}
      </button>
    </section>
  );
}
