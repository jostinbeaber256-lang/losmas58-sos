import { NextResponse, type NextRequest } from "next/server";
import webPush, { type WebPushError, type PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PushType = "new_sos" | "response" | "resolved";

type PushRequestBody = {
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

const ALLOWED_TYPES: PushType[] = ["new_sos", "response", "resolved"];

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  return scheme?.toLowerCase() === "bearer" ? token : null;
}

function isPushType(value: unknown): value is PushType {
  return typeof value === "string" && ALLOWED_TYPES.includes(value as PushType);
}

function isInternalUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("/alertas") || value.startsWith("/mapa"))
  );
}

function validateBody(value: unknown): PushRequestBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Partial<PushRequestBody>;

  if (
    !isPushType(body.type) ||
    typeof body.title !== "string" ||
    typeof body.body !== "string" ||
    !isInternalUrl(body.url)
  ) {
    return null;
  }

  return {
    type: body.type,
    title: body.title,
    body: body.body,
    url: body.url,
    recipientUserIds: Array.isArray(body.recipientUserIds)
      ? body.recipientUserIds.filter((item) => typeof item === "string")
      : undefined,
    excludeUserId: typeof body.excludeUserId === "string" ? body.excludeUserId : undefined
  };
}

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

export async function POST(request: NextRequest) {
  const pushSecret = process.env.PUSH_API_SECRET;
  const token = getBearerToken(request);

  if (!pushSecret || token !== pushSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json(
      { error: "Missing VAPID environment variables" },
      { status: 500 }
    );
  }

  const body = validateBody(await request.json().catch(() => null));

  if (!body) {
    return NextResponse.json({ error: "Invalid push payload" }, { status: 400 });
  }

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createAdminClient();
  let query = supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .eq("enabled", true);

  if (body.recipientUserIds?.length) {
    query = query.in("user_id", body.recipientUserIds);
  }

  if (body.excludeUserId) {
    query = query.neq("user_id", body.excludeUserId);
  }

  const { data: subscriptions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = JSON.stringify({
    title: body.title,
    body: body.body,
    url: body.url,
    type: body.type,
    icon: "/icon-192.svg",
    badge: "/icon-192.svg"
  });

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webPush.sendNotification(toWebPushSubscription(subscription), payload);
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

  const sent = results.filter(
    (result) => result.status === "fulfilled" && result.value.sent
  ).length;
  const deleted = results.filter(
    (result) => result.status === "fulfilled" && result.value.deleted
  ).length;
  const failed = results.filter((result) => result.status === "rejected").length;

  return NextResponse.json({
    ok: true,
    type: body.type,
    sent,
    deleted,
    failed,
    total: subscriptions?.length ?? 0
  });
}
