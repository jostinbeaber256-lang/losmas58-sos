"use client";

import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AdminAccessButton } from "@/components/admin-access-button";
import { AlertToastStack } from "@/components/alert-toast-stack";
import { AuthStatus } from "@/components/auth/auth-status";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationCenter } from "@/components/notification-center";
import { AppBadge } from "@/components/ui/app-badge";
import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  user,
  initialIsAdmin = false
}: {
  children: React.ReactNode;
  user: User | null;
  initialIsAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const hideNav = pathname.startsWith("/login") || pathname.startsWith("/registro");

  return (
    <div className="safe-px-app min-h-screen w-full pb-28 pt-0 md:mx-auto md:max-w-4xl md:pt-6 lg:max-w-6xl xl:max-w-7xl">
      <AlertToastStack />

      <div
        className={cn(
          "px-0 py-0 md:rounded-[2rem] md:border md:border-white/5 md:px-4 md:py-4",
          isHome ? "bg-transparent" : "bg-transparent md:bg-black/10"
        )}
      >
        <header className="mb-4 flex items-center justify-between gap-3 rounded-b-[1.5rem] border-b border-white/5 bg-black/10 px-2 py-2 backdrop-blur-sm md:mb-5 md:rounded-[1.75rem] md:border md:px-3">
          <AppBadge />
          <div className="flex shrink-0 items-center gap-2">
            <AdminAccessButton initialIsAdmin={initialIsAdmin} />
            <NotificationCenter />
            <AuthStatus initialUser={user} />
          </div>
        </header>

        {children}
      </div>

      {hideNav ? null : <BottomNav />}
    </div>
  );
}
