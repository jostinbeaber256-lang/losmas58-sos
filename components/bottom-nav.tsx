"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellAlertIcon,
  HomeIcon,
  MapIcon,
  UserCircleIcon
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/mapa", label: "Mapa", icon: MapIcon },
  { href: "/alertas", label: "SOS", icon: BellAlertIcon },
  { href: "/perfil", label: "Perfil", icon: UserCircleIcon }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-pb safe-px fixed inset-x-0 bottom-0 mx-auto w-full max-w-md">
      <div className="panel-blur mb-4 grid grid-cols-4 rounded-[1.75rem] p-2">
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
