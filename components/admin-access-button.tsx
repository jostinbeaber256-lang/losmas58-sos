"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { useRoutePresence } from "@/components/providers/route-presence-provider";

export function AdminAccessButton({
  initialIsAdmin
}: {
  initialIsAdmin: boolean;
}) {
  const { profile, isAuthenticated } = useRoutePresence();
  const [serverIsAdmin, setServerIsAdmin] = useState(initialIsAdmin);
  const isAdmin = initialIsAdmin || serverIsAdmin || Boolean(profile?.is_admin);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      return;
    }

    let cancelled = false;

    async function loadAdminStatus() {
      try {
        const response = await fetch("/api/admin/me", {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { isAdmin?: boolean };

        if (!cancelled) {
          setServerIsAdmin(Boolean(data.isAdmin));
        }
      } catch {
        // The admin panel itself remains protected server-side.
      }
    }

    loadAdminStatus();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isAuthenticated]);

  if (!isAdmin) {
    return null;
  }

  return (
    <Link
      href={"/admin" as Route}
      className="grid h-10 w-10 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent transition hover:bg-accent/15"
      aria-label="Abrir panel admin"
    >
      <ShieldExclamationIcon className="h-5 w-5" />
    </Link>
  );
}
