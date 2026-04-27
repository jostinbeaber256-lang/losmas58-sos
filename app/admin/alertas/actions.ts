"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/data";
import { sendPushForSosEvent } from "@/lib/push/events";

export async function updateAdminAlertStatus(formData: FormData) {
  const context = await requireAdmin();

  if (!context.isAdmin) {
    return;
  }

  const alertId = String(formData.get("alertId") || "");
  const status = String(formData.get("status") || "");

  if (!alertId || (status !== "resolved" && status !== "cancelled")) {
    return;
  }

  const admin = createAdminClient();
  
  // Primero obtener el user_id de la alerta para limpiar su estado de emergencia
  const { data: alertData, error: fetchError } = await admin
    .from("sos_alerts")
    .select("user_id")
    .eq("id", alertId)
    .single();
  
  if (fetchError || !alertData) {
    console.error("[push:admin-alert-action] Could not fetch alert user_id", {
      alertId,
      error: fetchError?.message
    });
    return;
  }
  
  const { error } = await admin
    .from("sos_alerts")
    .update({
      status,
      resolved_at: new Date().toISOString()
    })
    .eq("id", alertId);

  if (error) {
    console.error("[push:admin-alert-action] Could not update alert status", {
      alertId,
      status,
      error: error.message
    });
    return;
  }
  
  // Limpiar el estado de emergencia del usuario
  const { error: profileError } = await admin
    .from("profiles")
    .update({ emergency_state: "normal" })
    .eq("id", alertData.user_id);
  
  if (profileError) {
    console.error("[push:admin-alert-action] Could not clear user emergency state", {
      userId: alertData.user_id,
      error: profileError.message
    });
  }

  if (status === "resolved") {
    try {
      console.log("[push:admin-alert-action] Dispatching resolved push", {
        alertId,
        actorUserId: context.user.id
      });
      await sendPushForSosEvent({
        type: "resolved",
        alertId,
        actorUserId: context.user.id
      });
    } catch (pushError) {
      console.error("[push:admin-alert-action] Resolved push failed", {
        alertId,
        error: pushError instanceof Error ? pushError.message : String(pushError)
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/alertas");
}
