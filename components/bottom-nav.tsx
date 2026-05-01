"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BellAlertIcon,
  HomeIcon,
  MapIcon,
  UserGroupIcon,
  UserCircleIcon
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

const items: Array<{
  href: Route;
  label: string;
  icon: typeof HomeIcon;
}> = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/mapa", label: "Mapa", icon: MapIcon },
  { href: "/alertas", label: "SOS", icon: BellAlertIcon },
  { href: "/rutas" as Route, label: "Rutas", icon: UserGroupIcon },
  { href: "/perfil", label: "Perfil", icon: UserCircleIcon }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-pb safe-px-app fixed inset-x-0 bottom-0 mx-auto w-full md:max-w-3xl lg:max-w-5xl">
      <div className="panel-blur mb-3 grid grid-cols-5 rounded-[1.65rem] p-2 md:mb-4 md:rounded-[1.75rem]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-xs transition",
                active
                  ? "bg-accent/12 text-accent"
                  : "text-muted hover:bg-white/5 hover:text-ink"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
