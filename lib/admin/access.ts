import { createAdminClient } from "@/lib/supabase/admin";

export async function getIsUserAdmin(userId: string | null | undefined) {
  if (!userId) {
    return false;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single<{ is_admin: boolean }>();

  if (error) {
    return false;
  }

  return Boolean(data?.is_admin);
}
