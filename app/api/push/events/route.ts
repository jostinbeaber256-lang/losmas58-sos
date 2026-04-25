import { NextResponse, type NextRequest } from "next/server";
import { sendPushNotification, type PushType } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PushEventBody = {
  type: PushType;
  alertId: string;
};

type AlertRecord = {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  city: string | null;
  emergency_type: string | null;
  status: "active" | "resolved" | "cancelled";
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

function getRiderName(alert: AlertRecord) {
  return alert.full_name || alert.username || "Motero en emergencia";
}

function getEmergencyLabel(alert: AlertRecord) {
  return alert.emergency_type || "SOS";
}

function getCityText(alert: AlertRecord) {
  return alert.city ? ` en ${alert.city}` : "";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
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

  const admin = createAdminClient();
  const { data: alert, error: alertError } = await admin
    .from("sos_alerts")
    .select("id, user_id, full_name, username, city, emergency_type, status")
    .eq("id", body.alertId)
    .single<AlertRecord>();

  if (alertError || !alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  if (body.type === "new_sos") {
    if (alert.user_id !== user.id || alert.status !== "active") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await sendPushNotification({
      type: "new_sos",
      title: "Nuevo SOS en Los+58",
      body: `${getRiderName(alert)} reporto ${getEmergencyLabel(alert)}${getCityText(alert)}.`,
      url: `/alertas?alerta=${alert.id}`,
      excludeUserId: alert.user_id
    });

    return NextResponse.json({ ok: true, ...result });
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

    const helperName = response.helper_name || "Un motero";
    const result = await sendPushNotification({
      type: "response",
      title: "Van en camino",
      body: `${helperName} respondio a tu SOS.`,
      url: `/alertas?alerta=${alert.id}`,
      recipientUserIds: [alert.user_id]
    });

    return NextResponse.json({ ok: true, ...result });
  }

  if (alert.user_id !== user.id || alert.status === "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: responses, error: responsesError } = await admin
    .from("sos_responses")
    .select("helper_user_id, helper_name")
    .eq("sos_alert_id", alert.id)
    .eq("status", "on_the_way")
    .returns<ResponseRecord[]>();

  if (responsesError) {
    return NextResponse.json({ error: responsesError.message }, { status: 500 });
  }

  const recipientUserIds = unique(
    (responses ?? [])
      .map((response) => response.helper_user_id)
      .filter((helperUserId) => helperUserId !== user.id)
  );

  if (!recipientUserIds.length) {
    return NextResponse.json({ ok: true, sent: 0, deleted: 0, failed: 0, total: 0 });
  }

  const result = await sendPushNotification({
    type: "resolved",
    title: alert.status === "cancelled" ? "SOS cancelado" : "SOS resuelto",
    body: `${getRiderName(alert)} cerro la alerta ${getEmergencyLabel(alert)}.`,
    url: `/alertas?alerta=${alert.id}`,
    recipientUserIds
  });

  return NextResponse.json({ ok: true, ...result });
}
