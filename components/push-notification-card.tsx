"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import type { PermissionStatus } from "@capacitor/push-notifications";
import {
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PowerIcon
} from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { createClient } from "@/lib/supabase/browser";

type PushStatus = "checking" | "inactive" | "loading" | "enabled" | "denied" | "error";
type PushStep =
  | "idle"
  | "checking"
  | "registering"
  | "permission"
  | "subscribing"
  | "saving"
  | "disabling"
  | "done";
type PushMode = "native-android" | "web";
type CapacitorBridge = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
  platform?: string;
};

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

function getCapacitorBridge() {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as Window & { Capacitor?: CapacitorBridge }).Capacitor ?? null;
}

function isNativeAndroid() {
  const bridge = getCapacitorBridge();
  const platform =
    bridge?.getPlatform?.() ?? bridge?.platform ?? Capacitor.getPlatform();
  const native =
    bridge?.isNativePlatform?.() ?? Capacitor.isNativePlatform();

  return native && platform === "android";
}

function getPushMode(): PushMode {
  return isNativeAndroid() ? "native-android" : "web";
}

function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isNativePermissionGranted(permission: PermissionStatus) {
  return permission.receive === "granted";
}

async function getNativePushNotifications() {
  const module = await import("@capacitor/push-notifications");
  return module.PushNotifications;
}

function logNativePush(message: string, data?: unknown) {
  if (data === undefined) {
    console.log(`[Los58NativePush] ${message}`);
    return;
  }

  console.log(`[Los58NativePush] ${message}`, data);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido";
  }
}

export function PushNotificationCard() {
  const { currentUserId, isAuthenticated } = useRoutePresence();
  const [supabase] = useState(createClient);
  const [status, setStatus] = useState<PushStatus>("checking");
  const [step, setStep] = useState<PushStep>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<PushMode>(() => getPushMode());
  const isNative = mode === "native-android";

  async function getReadyRegistration() {
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/"
    });

    return navigator.serviceWorker.ready;
  }

  async function saveWebSubscription(subscription: PushSubscription, enabled: boolean) {
    if (!currentUserId) {
      throw new Error("Usuario no autenticado.");
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: currentUserId,
        endpoint: subscription.endpoint,
        p256dh: getSubscriptionKey(subscription, "p256dh"),
        auth: getSubscriptionKey(subscription, "auth"),
        user_agent: navigator.userAgent,
        platform: "web",
        enabled
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  async function saveNativeToken(token: string, enabled: boolean) {
    if (!currentUserId) {
      throw new Error("Usuario no autenticado.");
    }

    logNativePush("Attempting Supabase native_push_tokens upsert", {
      userId: currentUserId,
      tokenPreview: `${token.slice(0, 12)}...`,
      enabled
    });
    setDebugMessage("Guardando token FCM en Supabase...");

    const { data, error } = await supabase.from("native_push_tokens").upsert(
      {
        user_id: currentUserId,
        token,
        platform: "android",
        device_info: navigator.userAgent,
        enabled
      },
      { onConflict: "token" }
    ).select("id, enabled, platform").single();

    if (error) {
      logNativePush("Supabase native token upsert failed", error);
      throw new Error(error.message);
    }

    logNativePush("Supabase native token upsert succeeded", data);
    setDebugMessage("Token FCM guardado en Supabase.");
  }

  async function checkNativePushState() {
    if (!isAuthenticated || !currentUserId) {
      setStatus("inactive");
      setStep("idle");
      setMessage("Inicia sesion para gestionar notificaciones de la app.");
      return;
    }

    setStatus("checking");
    setStep("checking");
    setDebugMessage("Detectando Android nativo y permisos FCM...");

    try {
      logNativePush("Detected native Android mode", {
        mode,
        platform: getPushMode(),
        currentUserId
      });
      const PushNotifications = await getNativePushNotifications();
      const permission = await PushNotifications.checkPermissions();
      logNativePush("checkPermissions result", permission);
      setDebugMessage(`Permiso actual: ${permission.receive}`);

      if (permission.receive === "denied") {
        setStatus("denied");
        setStep("idle");
        setMessage("Permiso denegado. Activalo desde ajustes de Android para recibir notificaciones.");
        return;
      }

      if (!isNativePermissionGranted(permission)) {
        setStatus("inactive");
        setStep("idle");
        setMessage(null);
        return;
      }

      const { data, error } = await supabase
        .from("native_push_tokens")
        .select("enabled")
        .eq("user_id", currentUserId)
        .eq("platform", "android")
        .eq("enabled", true)
        .limit(1);

      if (error) {
        logNativePush("native_push_tokens state query failed", error);
        setStatus("error");
        setStep("idle");
        setMessage(error.message);
        return;
      }

      if ((data ?? []).length > 0) {
        logNativePush("Active native token found for user", {
          count: data?.length ?? 0
        });
        setStatus("enabled");
        setStep("done");
        setMessage("Notificaciones nativas activas para esta app.");
        return;
      }

      setStatus("inactive");
      setStep("idle");
      setMessage("Permiso concedido. Toca activar para registrar este dispositivo.");
      setDebugMessage("Permiso concedido, pero no hay token activo guardado.");
    } catch (pushError) {
      logNativePush("checkNativePushState exception", pushError);
      setStatus("error");
      setStep("idle");
      setMessage(
        pushError instanceof Error
          ? pushError.message
          : "No se pudo revisar el estado de notificaciones nativas."
      );
    }
  }

  async function checkWebPushState() {
    if (!isAuthenticated || !currentUserId) {
      setStatus("inactive");
      setStep("idle");
      setMessage("Inicia sesion para gestionar notificaciones push.");
      return;
    }

    if (!isWebPushSupported()) {
      setStatus("error");
      setStep("idle");
      setMessage("Este navegador no soporta notificaciones push web.");
      return;
    }

    setStatus("checking");
    setStep("checking");

    try {
      if (Notification.permission === "denied") {
        setStatus("denied");
        setStep("idle");
        setMessage("Permiso denegado. Activalo desde ajustes del navegador si quieres recibir push.");
        return;
      }

      const registration = await getReadyRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setStatus("inactive");
        setStep("idle");
        setMessage(null);
        return;
      }

      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("enabled")
        .eq("endpoint", subscription.endpoint)
        .eq("user_id", currentUserId)
        .maybeSingle<{ enabled: boolean }>();

      if (error) {
        setStatus("error");
        setStep("idle");
        setMessage(error.message);
        return;
      }

      if (Notification.permission === "granted" && data?.enabled !== false) {
        await saveWebSubscription(subscription, true);
        setStatus("enabled");
        setStep("done");
        setMessage("Notificaciones push activas en este dispositivo.");
        return;
      }

      setStatus("inactive");
      setStep("idle");
      setMessage(data?.enabled === false ? "Push desactivadas manualmente en este dispositivo." : null);
    } catch (pushError) {
      setStatus("error");
      setStep("idle");
      setMessage(
        pushError instanceof Error
          ? pushError.message
          : "No se pudo revisar el estado de push."
      );
    }
  }

  async function checkPushState() {
    const detectedMode = getPushMode();
    logNativePush("Push mode detection", {
      detectedMode,
      capacitorPlatform: Capacitor.getPlatform(),
      isNativePlatform: Capacitor.isNativePlatform(),
      hasWindowBridge: Boolean(getCapacitorBridge())
    });
    setMode(detectedMode);

    if (detectedMode === "native-android") {
      await checkNativePushState();
      return;
    }

    await checkWebPushState();
  }

  useEffect(() => {
    checkPushState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isAuthenticated]);

  async function handleEnableNativePush() {
    setStatus("loading");
    setStep("permission");
    setMessage("Solicitando permiso de Android...");
    setDebugMessage("Iniciando flujo nativo FCM...");
    logNativePush("Enable native push clicked", {
      currentUserId,
      isAuthenticated,
      mode
    });

    if (!isAuthenticated || !currentUserId) {
      logNativePush("Enable native push aborted: unauthenticated");
      setStatus("error");
      setStep("idle");
      setMessage("Inicia sesion para activar notificaciones de la app.");
      return;
    }

    try {
      const PushNotifications = await getNativePushNotifications();
      let permission = await PushNotifications.checkPermissions();
      logNativePush("checkPermissions before request", permission);
      setDebugMessage(`Permiso antes de solicitar: ${permission.receive}`);

      if (!isNativePermissionGranted(permission)) {
        logNativePush("Requesting native push permission");
        setDebugMessage("Solicitando permiso nativo de Android...");
        permission = await PushNotifications.requestPermissions();
        logNativePush("requestPermissions result", permission);
        setDebugMessage(`Resultado del permiso: ${permission.receive}`);
      }

      if (!isNativePermissionGranted(permission)) {
        logNativePush("Native push permission not granted", permission);
        setStatus(permission.receive === "denied" ? "denied" : "inactive");
        setStep("idle");
        setMessage("Permiso no concedido. Puedes activarlo desde ajustes de Android.");
        return;
      }

      setStep("registering");
      setMessage("Registrando dispositivo con FCM...");
      setDebugMessage("Instalando listeners de registro FCM...");

      const token = await new Promise<string>((resolve, reject) => {
        Promise.all([
          PushNotifications.addListener("registration", async (tokenResult) => {
            logNativePush("registration listener fired with token", {
              tokenPreview: `${tokenResult.value.slice(0, 16)}...`,
              tokenLength: tokenResult.value.length
            });
            setDebugMessage("Token FCM recibido. Preparando guardado...");
            cleanupListeners();
            resolve(tokenResult.value);
          }),
          PushNotifications.addListener("registrationError", async (error) => {
            logNativePush("registrationError listener fired", error);
            setDebugMessage(`Error al registrar FCM: ${getErrorMessage(error)}`);
            cleanupListeners();
            reject(new Error(error.error || getErrorMessage(error) || "No se pudo registrar FCM."));
          })
        ])
          .then(([registrationListener, registrationErrorListener]) => {
            logNativePush("registration listeners installed before register()");
            setDebugMessage("Listeners instalados. Llamando PushNotifications.register()...");

            function removeListeners() {
              registrationListener.remove();
              registrationErrorListener.remove();
            }

            cleanupListeners = removeListeners;
            logNativePush("Calling PushNotifications.register()");
            PushNotifications.register().catch((registerError) => {
              logNativePush("PushNotifications.register() rejected", registerError);
              cleanupListeners();
              reject(registerError);
            });
          })
          .catch((listenerError) => {
            logNativePush("Could not install registration listeners", listenerError);
            reject(listenerError);
          });

        let cleanupListeners: () => void = () => undefined;
      });

      setStep("saving");
      setMessage("Guardando token nativo del dispositivo...");
      setDebugMessage("Token recibido. Guardando en native_push_tokens...");
      await saveNativeToken(token, true);

      setStatus("enabled");
      setStep("done");
      setMessage("Notificaciones nativas activadas para esta app.");
      setDebugMessage("Token guardado. Notificaciones nativas activas.");
      logNativePush("Native push flow completed successfully");
    } catch (pushError) {
      logNativePush("handleEnableNativePush exception", pushError);
      setStatus("error");
      setStep("idle");
      setMessage(
        pushError instanceof Error
          ? pushError.message
          : "No se pudieron activar las notificaciones nativas."
      );
      setDebugMessage(`Error capturado: ${getErrorMessage(pushError)}`);
    }
  }

  async function handleEnableWebPush() {
    setStatus("loading");
    setStep("registering");
    setMessage(null);

    if (!isAuthenticated || !currentUserId) {
      setStatus("error");
      setStep("idle");
      setMessage("Inicia sesion para activar notificaciones push.");
      return;
    }

    if (!isWebPushSupported()) {
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
      const registration = await getReadyRegistration();

      if (!registration.active) {
        setStatus("error");
        setStep("idle");
        setMessage("El service worker aun no esta activo. Intenta nuevamente en unos segundos.");
        return;
      }

      let permission = Notification.permission;

      if (permission !== "granted") {
        setStep("permission");
        setMessage("Solicitando permiso del navegador...");
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "inactive");
        setStep("idle");
        setMessage("Permiso no concedido. Puedes activarlo luego desde ajustes del navegador.");
        return;
      }

      setStep("subscribing");
      setMessage("Permiso concedido. Asegurando suscripcion push...");
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        }));

      setStep("saving");
      setMessage("Guardando este dispositivo como activo...");
      await saveWebSubscription(subscription, true);

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

  async function handleDisablePush() {
    setStatus("loading");
    setStep("disabling");
    setMessage(isNative ? "Desactivando notificaciones de la app..." : "Desactivando notificaciones push...");

    try {
      if (isNative) {
        logNativePush("Disabling native push tokens", {
          userId: currentUserId
        });
        setDebugMessage("Marcando tokens nativos como desactivados...");
        const { error } = await supabase
          .from("native_push_tokens")
          .update({ enabled: false })
          .eq("user_id", currentUserId)
          .eq("platform", "android");

        if (error) {
          logNativePush("Disable native push tokens failed", error);
          throw new Error(error.message);
        }

        logNativePush("Native push tokens disabled");
      } else {
        const registration = await getReadyRegistration();
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await supabase
            .from("push_subscriptions")
            .update({ enabled: false })
            .eq("endpoint", subscription.endpoint)
            .eq("user_id", currentUserId);

          await subscription.unsubscribe().catch(() => false);
        }
      }

      setStatus("inactive");
      setStep("idle");
      setDebugMessage(isNative ? "Tokens FCM desactivados." : null);
      setMessage(
        isNative
          ? "Notificaciones de la app desactivadas en este dispositivo."
          : "Notificaciones push desactivadas en este dispositivo."
      );
    } catch (pushError) {
      logNativePush("handleDisablePush exception", pushError);
      setStatus("error");
      setStep("idle");
      setMessage(
        pushError instanceof Error
          ? pushError.message
          : "No se pudieron desactivar las notificaciones."
      );
    }
  }

  const isEnabled = status === "enabled";
  const isBusy = status === "loading";
  const title = isNative ? "Notificaciones de la app" : "Alertas push";
  const actionEnableLabel = isNative
    ? "Activar notificaciones de la app"
    : "Activar notificaciones push";
  const actionDisableLabel = isNative
    ? "Desactivar notificaciones de la app"
    : "Desactivar notificaciones push";
  const statusCopy = {
    checking: isNative
      ? "Revisando permisos nativos de Android..."
      : "Revisando permiso y suscripcion del dispositivo...",
    inactive: isNative
      ? "Activalas para recibir SOS desde la APK con FCM nativo."
      : "Activalas para recibir SOS aunque no estes mirando la app.",
    loading:
      step === "disabling"
        ? "Desactivando notificaciones para este dispositivo..."
        : step === "registering"
          ? isNative
            ? "Registrando dispositivo con FCM..."
            : "Registrando service worker..."
          : step === "permission"
            ? isNative
              ? "Esperando permiso de Android..."
              : "Esperando permiso del navegador..."
            : step === "subscribing"
              ? "Creando suscripcion push..."
              : step === "saving"
                ? "Guardando token del dispositivo..."
                : "Preparando permisos y suscripcion...",
    enabled: isNative
      ? "FCM nativo activo para esta APK."
      : "Push activas por defecto en este dispositivo.",
    denied: isNative
      ? "Permiso denegado en Android."
      : "Permiso denegado para este navegador.",
    error: "No se pudo completar la accion de notificaciones."
  }[status];
  const statusMeta = {
    checking: {
      label: "Revisando",
      classes: "border-white/10 bg-white/[0.045] text-muted",
      icon: BellAlertIcon
    },
    inactive: {
      label: "Desactivadas",
      classes: "border-white/10 bg-white/[0.045] text-muted",
      icon: BellAlertIcon
    },
    loading: {
      label: step === "disabling" ? "Desactivando" : "Activando",
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
        <div className="flex min-w-0 items-start gap-4">
          <div className={`rounded-2xl border p-3 shadow-[0_0_30px_rgba(32,211,238,0.1)] ${
            isEnabled
              ? "border-accent/20 bg-accent/10 text-accent"
              : "border-danger/20 bg-danger/12 text-danger"
          }`}>
            {isEnabled ? (
              <CheckCircleIcon className="h-6 w-6" />
            ) : (
              <BellAlertIcon className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              {isNative ? "Android FCM" : "Web Push"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{title}</h2>
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
              : status === "inactive"
                ? "border-white/10 bg-white/[0.045] text-muted"
                : "border-danger/25 bg-danger/10 text-danger"
          }`}
        >
          {message}
        </p>
      ) : null}

      {isNative && debugMessage ? (
        <p className="relative mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs leading-5 text-muted">
          Debug FCM: {debugMessage}
        </p>
      ) : null}

      <button
        type="button"
        onPointerDown={() => {
          logNativePush("Button pointer down", {
            status,
            step,
            mode,
            isNative,
            isBusy
          });
          setDebugMessage("Toque detectado en el boton.");
        }}
        onClick={() => {
          logNativePush("Button pressed", {
            status,
            step,
            mode,
            isNative,
            isEnabled
          });

          if (isEnabled) {
            void handleDisablePush();
            return;
          }

          if (isNative) {
            void handleEnableNativePush();
            return;
          }

          void handleEnableWebPush();
        }}
        disabled={isBusy}
        className={`relative z-20 mt-5 inline-flex min-h-14 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold transition duration-150 hover:brightness-110 active:scale-[0.98] active:brightness-125 disabled:cursor-not-allowed disabled:opacity-70 ${
          isEnabled
            ? "border border-danger/30 bg-danger/12 text-danger shadow-[0_18px_40px_rgba(255,77,109,.14)]"
            : "bg-danger text-white shadow-[0_18px_40px_rgba(255,77,109,.25)]"
        }`}
      >
        {isEnabled ? <PowerIcon className="h-5 w-5" /> : <BellAlertIcon className="h-5 w-5" />}
        {isBusy
          ? step === "disabling"
            ? "Desactivando..."
            : "Revisando..."
          : isEnabled
            ? actionDisableLabel
            : actionEnableLabel}
      </button>
    </section>
  );
}
