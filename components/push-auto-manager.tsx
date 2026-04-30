"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { createClient } from "@/lib/supabase/browser";

type CapacitorBridge = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
  platform?: string;
};

const PUSH_DISABLED_KEY = "los58-push-disabled";

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

function isDisabledByUser() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PUSH_DISABLED_KEY) === "true";
}

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

async function getReadyRegistration() {
  await navigator.serviceWorker.register("/sw.js", {
    scope: "/"
  });

  return navigator.serviceWorker.ready;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
}

export function PushAutoManager() {
  const { currentUserId, isAuthenticated } = useRoutePresence();
  const [supabase] = useState(createClient);
  const attemptedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId || isDisabledByUser()) {
      return;
    }

    if (attemptedUserRef.current === currentUserId) {
      return;
    }

    attemptedUserRef.current = currentUserId;

    async function ensureWebPush() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        return;
      }

      if (Notification.permission !== "granted") {
        console.log("[Los58PushAuto] Web push permission not granted yet; waiting for user action.");
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.warn("[Los58PushAuto] Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
        return;
      }

      const registration = await getReadyRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        }));

      const payload = {
        user_id: currentUserId,
        endpoint: subscription.endpoint,
        p256dh: getSubscriptionKey(subscription, "p256dh"),
        auth: getSubscriptionKey(subscription, "auth"),
        user_agent: navigator.userAgent,
        platform: "web",
        enabled: true
      };

      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(payload, { onConflict: "endpoint" });

      if (error) {
        console.warn("[Los58PushAuto] Web push upsert failed.", error);
        return;
      }

      console.log("[Los58PushAuto] Web push enabled automatically after login.");
    }

    async function ensureNativePush() {
      const nativePluginModule = await import("@capacitor/push-notifications");
      const PushNotifications = nativePluginModule.PushNotifications;
      const permission = await PushNotifications.checkPermissions();

      if (permission.receive !== "granted") {
        console.log("[Los58PushAuto] Native push permission not granted yet; waiting for user action.");
        return;
      }

      const token = await withTimeout(
        new Promise<string>((resolve, reject) => {
          let cleanupListeners: () => void = () => undefined;

          Promise.all([
            PushNotifications.addListener("registration", (tokenResult) => {
              cleanupListeners();
              resolve(tokenResult.value);
            }),
            PushNotifications.addListener("registrationError", (error) => {
              cleanupListeners();
              reject(new Error(error.error || "No se pudo registrar FCM."));
            })
          ])
            .then(([registrationListener, registrationErrorListener]) => {
              cleanupListeners = () => {
                registrationListener.remove();
                registrationErrorListener.remove();
              };
              void PushNotifications.register();
            })
            .catch(reject);
        }),
        15000,
        "Timeout registrando FCM."
      );

      const { error } = await supabase.from("native_push_tokens").upsert(
        {
          user_id: currentUserId,
          token,
          platform: "android",
          device_info: navigator.userAgent,
          enabled: true
        },
        { onConflict: "token" }
      );

      if (error) {
        console.warn("[Los58PushAuto] Native push token upsert failed.", error);
        return;
      }

      console.log("[Los58PushAuto] Native push enabled automatically after login.");
    }

    void (async () => {
      try {
        if (isNativeAndroid()) {
          await ensureNativePush();
          return;
        }

        await ensureWebPush();
      } catch (error) {
        console.warn("[Los58PushAuto] Auto activation failed.", error);
      }
    })();
  }, [currentUserId, isAuthenticated, supabase]);

  return null;
}
