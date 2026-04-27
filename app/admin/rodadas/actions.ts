"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function startGroupRide(formData: FormData) {
  const context = await requireAdmin();

  if (!context.isAdmin) {
    return;
  }

  const name = String(formData.get("name") || "").trim();
  const meetingPoint = String(formData.get("meetingPoint") || "").trim();
  const startsAt = String(formData.get("startsAt") || "").trim();

  if (!name) {
    return;
  }

  const admin = createAdminClient();

  await admin
    .from("group_rides")
    .update({
      status: "finished",
      updated_at: new Date().toISOString()
    })
    .eq("status", "active");

  const { error } = await admin.from("group_rides").insert({
    name,
    meeting_point: meetingPoint || null,
    starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    status: "active",
    created_by: context.user.id
  });

  if (error) {
    console.error("[admin:rides] Could not start group ride", error.message);
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/perfil");
}

export async function finishGroupRide(formData: FormData) {
  const context = await requireAdmin();

  if (!context.isAdmin) {
    return;
  }

  const rideId = String(formData.get("rideId") || "");

  if (!rideId) {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("group_rides")
    .update({
      status: "finished",
      updated_at: new Date().toISOString()
    })
    .eq("id", rideId);

  if (error) {
    console.error("[admin:rides] Could not finish group ride", {
      rideId,
      error: error.message
    });
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/perfil");
}
