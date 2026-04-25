"use client";

import Image from "next/image";
import { useState } from "react";

function LogoFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[1.15rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,77,109,.45),transparent_42%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(0,229,168,.08))] text-sm font-black tracking-[0.08em] text-ink">
      +58
    </div>
  );
}

export function AppBadge() {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/8 bg-white/[0.035] px-2.5 py-2 shadow-[0_16px_36px_rgba(0,0,0,.22)] backdrop-blur-xl">
      <div className="relative h-12 w-12 shrink-0">
        <div className="absolute inset-[-7px] rounded-[1.4rem] bg-[radial-gradient(circle,rgba(0,229,168,.22),transparent_62%)] blur-md transition group-hover:opacity-90" />
        <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] border border-accent/20 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_0_24px_rgba(0,229,168,.16)]">
          {logoError ? (
            <LogoFallback />
          ) : (
            <Image
              src="/logo-los58.png"
              alt="Logo Los+58"
              fill
              sizes="48px"
              className="object-cover"
              priority
              onError={() => setLogoError(true)}
            />
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[0.95rem] font-black uppercase leading-none tracking-[0.14em] text-ink">
          LOS+58
        </p>
        <p className="mt-1 truncate text-xs font-medium text-muted/85">
          Seguridad y ruta
        </p>
      </div>
    </div>
  );
}
