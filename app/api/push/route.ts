import { NextResponse, type NextRequest } from "next/server";
import { sendPushNotification, type PushPayload, type PushType } from "@/lib/push/send";

export const dynamic = "force-static";
export const runtime = "nodejs";

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

function validateBody(value: unknown): PushPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Partial<PushPayload>;

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

export async function POST(request: NextRequest) {
  const pushSecret = process.env.PUSH_API_SECRET;
  const token = getBearerToken(request);

  if (!pushSecret || token !== pushSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = validateBody(await request.json().catch(() => null));

  if (!body) {
    return NextResponse.json({ error: "Invalid push payload" }, { status: 400 });
  }

  try {
    const result = await sendPushNotification(body);

    return NextResponse.json({
      ok: true,
      type: body.type,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Push send failed" },
      { status: 500 }
    );
  }
}
