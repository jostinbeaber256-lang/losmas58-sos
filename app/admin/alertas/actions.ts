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
