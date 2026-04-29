"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BellAlertIcon,
  ChartBarIcon,
  MapIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";

const adminLinks: Array<{
  href: Route;
  label: string;
  description: string;
  icon: typeof ChartBarIcon;
}> = [
  {
    href: "/admin" as Route,
    label: "Dashboard",
    description: "Resumen operativo",
    icon: ChartBarIcon
  },
  {
    href: "/admin/usuarios" as Route,
    label: "Usuarios",
    description: "Comunidad",
    icon: UserGroupIcon
  },
  {
    href: "/admin/alertas" as Route,
    label: "Alertas",
    description: "Incidentes SOS",
    icon: BellAlertIcon
  },
  {
    href: "/admin/rutas" as Route,
    label: "Rutas",
    description: "Presencia",
    icon: MapIcon
  }
];

function isActiveAdminPath(pathname: string, href: Route) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {adminLinks.map(({ href, label, description, icon: Icon }) => {
        const active = isActiveAdminPath(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group relative overflow-hidden rounded-[1.35rem] border px-4 py-3 transition ${
              active
                ? "border-accent/30 bg-accent/10 text-ink shadow-[0_0_28px_rgba(32,211,238,.10)]"
                : "border-white/8 bg-white/[0.04] text-muted hover:border-accent/22 hover:bg-accent/6 hover:text-ink"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-y-3 left-0 w-1 rounded-r-full transition ${
                active ? "bg-accent shadow-[0_0_16px_rgba(32,211,238,.55)]" : "bg-white/8"
              }`}
            />
            <div className="flex items-center gap-3 pl-1">
              <span
                className={`grid h-10 w-10 place-items-center rounded-2xl border transition ${
                  active
                    ? "border-accent/22 bg-accent/10 text-accent"
                    : "border-white/8 bg-black/18 text-muted group-hover:text-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.14em] text-muted">
                  {description}
                </span>
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
