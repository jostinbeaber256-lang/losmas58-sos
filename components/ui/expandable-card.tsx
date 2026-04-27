"use client";

import { useState } from "react";

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
    <div className="rounded-2xl border border-white/10 bg-black/18">
      {children}
    </div>
  );
}

export function CompactView({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}

export function ExpandedView({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-white/10 p-4">{children}</div>;
}

export function ExpandTrigger({
  collapsedLabel,
  expandedLabel,
  className,
  children
}: {
  collapsedLabel?: string;
  expandedLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return <button className={className}>{children}</button>;
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
      <span className="font-medium text-ink">{value}</span>
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
  return <div className="my-3 h-px bg-white/10" />;
}
