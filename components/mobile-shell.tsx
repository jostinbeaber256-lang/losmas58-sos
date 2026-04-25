"use client";

import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { AlertToastStack } from "@/components/alert-toast-stack";
import { AuthStatus } from "@/components/auth/auth-status";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationCenter } from "@/components/notification-center";
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
    <div className="safe-px mx-auto min-h-screen w-full max-w-md pb-28 pt-6 md:max-w-3xl lg:max-w-5xl">
      <AlertToastStack />

      <div
        className={cn(
          "rounded-[2rem] border border-white/5 px-4 py-4",
          isHome ? "bg-transparent" : "bg-black/10"
        )}
      >
        <header className="mb-5 flex items-center justify-between gap-3 rounded-[1.75rem] border border-white/5 bg-black/10 px-2 py-2 backdrop-blur-sm md:px-3">
          <AppBadge />
          <div className="flex shrink-0 items-center gap-2">
            <NotificationCenter />
            <AuthStatus initialSession={session} />
          </div>
        </header>

        {children}
      </div>

      {hideNav ? null : <BottomNav />}
    </div>
  );
}
