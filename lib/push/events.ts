import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification, type PushType } from "@/lib/push/send";

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
  status: string;
};

export type PushEventResult = {
  ok: true;
  sent: number;
  deleted: number;
  failed: number;
  total: number;
  recipients: number | "broadcast";
};

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

async function getAlert(alertId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sos_alerts")
    .select("id, user_id, full_name, username, city, emergency_type, status")
    .eq("id", alertId)
    .single<AlertRecord>();

  if (error || !data) {
    console.error("[push:event] Alert not found", {
      alertId,
      error: error?.message
    });
    return null;
  }

  return data;
}

async function getActiveResponses(alertId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sos_responses")
    .select("helper_user_id, helper_name, status")
    .eq("sos_alert_id", alertId)
    .eq("status", "on_the_way")
    .returns<ResponseRecord[]>();

  if (error) {
    console.error("[push:event] Could not load SOS responses", {
      alertId,
      error: error.message
    });
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function sendPushForSosEvent({
  type,
  alertId,
  actorUserId,
  helperName
}: {
  type: PushType;
  alertId: string;
  actorUserId?: string;
  helperName?: string | null;
}): Promise<PushEventResult> {
  console.log("[push:event] Preparing push event", {
    type,
    alertId,
    actorUserId: actorUserId ?? null
  });

  const alert = await getAlert(alertId);

  if (!alert) {
    throw new Error("Alert not found");
  }

  if (type === "new_sos") {
    if (alert.status !== "active") {
      console.log("[push:event] Skipping new_sos because alert is not active", {
        alertId,
        status: alert.status
      });
      return { ok: true, sent: 0, deleted: 0, failed: 0, total: 0, recipients: 0 };
    }

    const result = await sendPushNotification({
      type: "new_sos",
      title: "Nuevo SOS en Los+58",
      body: `${getRiderName(alert)} reporto ${getEmergencyLabel(alert)}${getCityText(alert)}.`,
      url: "/alertas",
      excludeUserId: alert.user_id
    });

    console.log("[push:event] new_sos push completed", {
      alertId,
      excludeUserId: alert.user_id,
      ...result
    });

    return { ok: true, recipients: "broadcast", ...result };
  }

  if (type === "response") {
    const resolvedHelperName = helperName || "Un motero";
    const result = await sendPushNotification({
      type: "response",
      title: "Un motero va en camino",
      body: `${resolvedHelperName} va en camino por ${getEmergencyLabel(alert)}.`,
      url: "/alertas",
      recipientUserIds: [alert.user_id]
    });

    console.log("[push:event] response push completed", {
      alertId,
      recipientUserIds: [alert.user_id],
      helperName: resolvedHelperName,
      ...result
    });

    return { ok: true, recipients: 1, ...result };
  }

  const responses = await getActiveResponses(alert.id);
  const recipientUserIds = unique(
    [alert.user_id, ...responses.map((response) => response.helper_user_id)]
      .filter((userId): userId is string => Boolean(userId))
      .filter((userId) => userId !== actorUserId)
  );

  if (!recipientUserIds.length) {
    console.log("[push:event] Skipping resolved push because there are no recipients", {
      alertId,
      actorUserId: actorUserId ?? null
    });
    return { ok: true, sent: 0, deleted: 0, failed: 0, total: 0, recipients: 0 };
  }

  const result = await sendPushNotification({
    type: "resolved",
    title: "SOS resuelto",
    body: `El incidente ${getEmergencyLabel(alert)} de ${getRiderName(alert)} fue cerrado.`,
    url: "/alertas",
    recipientUserIds
  });

  console.log("[push:event] resolved push completed", {
    alertId,
    recipientUserIds,
    ...result
  });

  return { ok: true, recipients: recipientUserIds.length, ...result };
}
