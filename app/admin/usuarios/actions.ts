"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/data";

export async function updateUserAdminRole(formData: FormData) {
  const context = await requireAdmin();

  if (!context.isAdmin) {
    return;
  }

  const targetUserId = String(formData.get("userId") || "");
  const nextIsAdmin = String(formData.get("isAdmin")) === "true";

  if (!targetUserId || targetUserId === context.user.id) {
    return;
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      is_admin: nextIsAdmin
    })
    .eq("id", targetUserId);

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
}
