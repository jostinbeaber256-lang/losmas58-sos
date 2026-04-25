import webPush, { type PushSubscription, type WebPushError } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushType = "new_sos" | "response" | "resolved";

export type PushPayload = {
  type: PushType;
  title: string;
  body: string;
  url: string;
  recipientUserIds?: string[];
  excludeUserId?: string;
};

type StoredPushSubscription = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function toWebPushSubscription(subscription: StoredPushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };
}

function isExpiredSubscriptionError(error: unknown) {
  const pushError = error as WebPushError;
  return pushError.statusCode === 404 || pushError.statusCode === 410;
}

export async function sendPushNotification(payload: PushPayload) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error("[push:send] Missing VAPID environment variables", {
      hasPublicKey: Boolean(vapidPublicKey),
      hasPrivateKey: Boolean(vapidPrivateKey),
      hasSubject: Boolean(vapidSubject)
    });
    throw new Error("Missing VAPID environment variables");
  }

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createAdminClient();
  let query = supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .eq("enabled", true);

  if (payload.recipientUserIds?.length) {
    query = query.in("user_id", payload.recipientUserIds);
  }

  if (payload.excludeUserId) {
    query = query.neq("user_id", payload.excludeUserId);
  }

  const { data: subscriptions, error } = await query;

  if (error) {
    console.error("[push:send] Could not load push subscriptions", {
      type: payload.type,
      recipientUserIds: payload.recipientUserIds,
      excludeUserId: payload.excludeUserId,
      error: error.message
    });
    throw new Error(error.message);
  }

  console.log("[push:send] Sending push notification", {
    type: payload.type,
    title: payload.title,
    url: payload.url,
    subscriptionCount: subscriptions?.length ?? 0,
    recipientUserIds: payload.recipientUserIds ?? "all",
    excludeUserId: payload.excludeUserId ?? null
  });

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    type: payload.type,
    icon: "/icon-192.png",
    badge: "/badge-72.png"
  });

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webPush.sendNotification(
          toWebPushSubscription(subscription),
          notificationPayload
        );
        console.log("[push:send] Push sent", {
          userId: subscription.user_id,
          endpoint: subscription.endpoint.slice(0, 36)
        });
        return { endpoint: subscription.endpoint, sent: true };
      } catch (sendError) {
        if (isExpiredSubscriptionError(sendError)) {
          console.warn("[push:send] Removing expired push subscription", {
            userId: subscription.user_id,
            endpoint: subscription.endpoint.slice(0, 36)
          });
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);

          return { endpoint: subscription.endpoint, deleted: true };
        }

        console.error("[push:send] Push send failed", {
          userId: subscription.user_id,
          endpoint: subscription.endpoint.slice(0, 36),
          error: sendError instanceof Error ? sendError.message : String(sendError)
        });
        throw sendError;
      }
    })
  );

  const summary = {
    sent: results.filter(
      (result) => result.status === "fulfilled" && result.value.sent
    ).length,
    deleted: results.filter(
      (result) => result.status === "fulfilled" && result.value.deleted
    ).length,
    failed: results.filter((result) => result.status === "rejected").length,
    total: subscriptions?.length ?? 0
  };

  console.log("[push:send] Push notification summary", {
    type: payload.type,
    ...summary
  });

  return summary;
}
