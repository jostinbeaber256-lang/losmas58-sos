"use client";

import { UserIcon } from "@heroicons/react/24/solid";

interface AvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  username?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-20 w-20 text-lg"
};

function getInitials(name: string | null, username: string | null) {
  const source = (name || username || "M").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function Avatar({
  imageUrl,
  name,
  username,
  size = "md",
  className = ""
}: AvatarProps) {
  const initials = getInitials(name ?? null, username ?? null);
  const sizeClass = sizeClasses[size];

  if (imageUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.045] ${sizeClass} ${className}`}
      >
        <img
          src={imageUrl}
          alt={name || username || "Avatar"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] ${sizeClass} ${className}`}
    >
      <UserIcon className="h-1/2 w-1/2 text-muted" />
    </div>
  );
}
