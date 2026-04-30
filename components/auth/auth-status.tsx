"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

export function AuthStatus({ initialUser }: { initialUser: User | null }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async () => {
      const {
        data: { user: verifiedUser }
      } = await supabase.auth.getUser();

      setUser(verifiedUser);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);

    if (typeof window !== "undefined") {
      window.location.replace("/login");
      return;
    }

    router.replace("/login");
    router.refresh();
    setLoading(false);
  }

  if (!user) {
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
