import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-static";

function getSafeRedirectTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function getSocialDisplayName(metadata: Record<string, unknown>) {
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.user_name,
    metadata.preferred_username
  ];

  const value = candidates.find(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  return value?.trim() ?? null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error_description");
  const next = getSafeRedirectTo(requestUrl.searchParams.get("next"));
  const redirectUrl = new URL(requestUrl.toString());
  redirectUrl.pathname = next;
  redirectUrl.search = "";

  if (authError) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", authError);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "No se recibio codigo de autenticacion social.");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", exchangeError.message);
    return NextResponse.redirect(redirectUrl);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const fullName = getSocialDisplayName(user.user_metadata ?? {});
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .maybeSingle<{ id: string; full_name: string | null }>();

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: user.id,
        full_name: fullName
      });
    } else if (!existingProfile.full_name && fullName) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName
        })
        .eq("id", user.id);
    }
  }

  return NextResponse.redirect(redirectUrl);
}
