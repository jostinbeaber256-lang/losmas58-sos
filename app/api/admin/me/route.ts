import { NextResponse, type NextRequest } from "next/server";
import { getIsUserAdmin } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isAdmin = await getIsUserAdmin(user?.id);

  return NextResponse.json({ isAdmin });
}
