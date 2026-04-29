"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

export function ExpandableCard({
  children,
  cardId,
  defaultExpanded = false
}: {
  children: React.ReactNode;
  cardId: string;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04]">
      {children}
    </div>
  );
}

export function CompactView({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

export function ExpandedView({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-white/8 p-4">{children}</div>;
}

export function ExpandTrigger({
  isExpanded,
  onToggle,
  collapsedLabel = "Ver más",
  expandedLabel = "Ver menos",
  className = ""
}: {
  isExpanded: boolean;
  onToggle: () => void;
  collapsedLabel?: string;
  expandedLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border border-accent/22 bg-accent/8 px-3 py-1 text-sm font-semibold text-accent transition hover:border-accent/32 hover:bg-accent/12 ${className}`}
    >
      {isExpanded ? expandedLabel : collapsedLabel}
      <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
    </button>
  );
}

export function CompactInfo({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="text-muted">{label}:</span>
      <span className={`font-medium ${tone || 'text-ink'}`}>{value}</span>
    </div>
  );
}

export function CompactInfoGrid({
  children,
  maxItems = 4
}: {
  children: React.ReactNode;
  maxItems?: number;
}) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function CardDivider() {
  return <div className="my-3 h-px bg-white/8" />;
}
