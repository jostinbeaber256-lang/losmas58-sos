"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

export function AuthStatus({ initialSession }: { initialSession: Session | null }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    router.replace("/login");
    router.refresh();
    setLoading(false);
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-line/80 bg-panel/70 px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted transition hover:text-ink"
      >
        Entrar
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-full border border-line/80 bg-panel/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted transition hover:text-ink disabled:opacity-70"
    >
      {loading ? "Saliendo" : "Salir"}
    </button>
  );
}
