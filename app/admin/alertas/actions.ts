"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/data";

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
  await admin
    .from("sos_alerts")
    .update({
      status,
      resolved_at: new Date().toISOString()
    })
    .eq("id", alertId);

  revalidatePath("/admin");
  revalidatePath("/admin/alertas");
}
