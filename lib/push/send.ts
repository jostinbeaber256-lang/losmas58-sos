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
    throw new Error(error.message);
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    type: payload.type,
    icon: "/icon-192.svg",
    badge: "/icon-192.svg"
  });

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webPush.sendNotification(
          toWebPushSubscription(subscription),
          notificationPayload
        );
        return { endpoint: subscription.endpoint, sent: true };
      } catch (sendError) {
        if (isExpiredSubscriptionError(sendError)) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);

          return { endpoint: subscription.endpoint, deleted: true };
        }

        throw sendError;
      }
    })
  );

  return {
    sent: results.filter(
      (result) => result.status === "fulfilled" && result.value.sent
    ).length,
    deleted: results.filter(
      (result) => result.status === "fulfilled" && result.value.deleted
    ).length,
    failed: results.filter((result) => result.status === "rejected").length,
    total: subscriptions?.length ?? 0
  };
}
