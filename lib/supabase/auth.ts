import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session;
}
