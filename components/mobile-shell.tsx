"use client";

import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { AlertToastStack } from "@/components/alert-toast-stack";
import { AuthStatus } from "@/components/auth/auth-status";
import { BottomNav } from "@/components/bottom-nav";
import { AppBadge } from "@/components/ui/app-badge";
import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  session
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hideNav = pathname.startsWith("/login") || pathname.startsWith("/registro");

  return (
    <div className="safe-px mx-auto min-h-screen w-full max-w-md pb-28 pt-6">
      <AlertToastStack />

      <div
        className={cn(
          "rounded-[2rem] border border-white/5 px-4 py-4",
          isHome ? "bg-transparent" : "bg-black/10"
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <AppBadge />
          <AuthStatus initialSession={session} />
        </div>

        {children}
      </div>

      {hideNav ? null : <BottomNav />}
    </div>
  );
}
