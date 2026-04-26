import { NextResponse, type NextRequest } from "next/server";
import type { PushType } from "@/lib/push/send";
import { sendPushForSosEvent } from "@/lib/push/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-static";
export const runtime = "nodejs";

type PushEventBody = {
  type: PushType;
  alertId: string;
};

type ResponseRecord = {
  helper_user_id: string;
  helper_name: string | null;
};

function validateBody(value: unknown): PushEventBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Partial<PushEventBody>;

  if (
    (body.type !== "new_sos" &&
      body.type !== "response" &&
      body.type !== "resolved") ||
    typeof body.alertId !== "string" ||
    !body.alertId
  ) {
    return null;
  }

  return {
    type: body.type,
    alertId: body.alertId
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = validateBody(await request.json().catch(() => null));

  if (!body) {
    return NextResponse.json({ error: "Invalid push event" }, { status: 400 });
  }

  console.log("[push:event-route] Received push event request", {
    type: body.type,
    alertId: body.alertId,
    actorUserId: user.id
  });

  const admin = createAdminClient();
  const { data: alert, error: alertError } = await admin
    .from("sos_alerts")
    .select("id, user_id, status")
    .eq("id", body.alertId)
    .single<{ id: string; user_id: string; status: "active" | "resolved" | "cancelled" }>();

  if (alertError || !alert) {
    console.error("[push:event-route] Alert not found", {
      alertId: body.alertId,
      error: alertError?.message
    });
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  if (body.type === "new_sos") {
    if (alert.user_id !== user.id || alert.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await sendPushForSosEvent({
      type: "new_sos",
      alertId: alert.id,
      actorUserId: user.id
    });

    return NextResponse.json(result);
  }

  if (body.type === "response") {
    if (alert.user_id === user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: response, error: responseError } = await admin
      .from("sos_responses")
      .select("helper_user_id, helper_name")
      .eq("sos_alert_id", alert.id)
      .eq("helper_user_id", user.id)
      .single<ResponseRecord>();

    if (responseError || !response) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const result = await sendPushForSosEvent({
      type: "response",
      alertId: alert.id,
      actorUserId: user.id,
      helperName: response.helper_name
    });

    return NextResponse.json(result);
  }

  if (alert.user_id !== user.id || alert.status === "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await sendPushForSosEvent({
    type: "resolved",
    alertId: alert.id,
    actorUserId: user.id
  });

  return NextResponse.json(result);
}
