import type { ComponentType, SVGProps } from "react";
import {
  BoltSlashIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/solid";
import type { SosAlert } from "@/lib/types";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type EmergencyMeta = {
  key: string;
  label: string;
  shortCode: string;
  icon: IconType;
  iconClasses: string;
  panelClasses: string;
  chipClasses: string;
  mapColor: string;
  mapGlow: string;
  mapRing: string;
};

const EMERGENCY_META: Record<string, EmergencyMeta> = {
  "llanta pinchada": {
    key: "llanta pinchada",
    label: "Llanta pinchada",
    shortCode: "LP",
    icon: WrenchScrewdriverIcon,
    iconClasses: "bg-warning/15 text-warning",
    panelClasses: "border-warning/25 bg-warning/10",
    chipClasses: "border-warning/25 bg-warning/12 text-warning",
    mapColor: "#ffb547",
    mapGlow: "0 0 26px rgba(255,181,71,.55)",
    mapRing: "rgba(255,181,71,.22)"
  },
  "sin combustible": {
    key: "sin combustible",
    label: "Sin combustible",
    shortCode: "SC",
    icon: BoltSlashIcon,
    iconClasses: "bg-amber-500/15 text-amber-300",
    panelClasses: "border-amber-300/25 bg-amber-400/10",
    chipClasses: "border-amber-300/25 bg-amber-400/12 text-amber-200",
    mapColor: "#f59e0b",
    mapGlow: "0 0 26px rgba(245,158,11,.55)",
    mapRing: "rgba(245,158,11,.24)"
  },
  accidente: {
    key: "accidente",
    label: "Accidente",
    shortCode: "AC",
    icon: ShieldExclamationIcon,
    iconClasses: "bg-danger/18 text-danger",
    panelClasses: "border-danger/25 bg-danger/10",
    chipClasses: "border-danger/30 bg-danger/12 text-danger",
    mapColor: "#ff4d6d",
    mapGlow: "0 0 28px rgba(255,77,109,.7)",
    mapRing: "rgba(255,77,109,.28)"
  },
  averia: {
    key: "averia",
    label: "Averia",
    shortCode: "AV",
    icon: Cog6ToothIcon,
    iconClasses: "bg-orange-500/15 text-orange-300",
    panelClasses: "border-orange-300/25 bg-orange-400/10",
    chipClasses: "border-orange-300/25 bg-orange-400/12 text-orange-200",
    mapColor: "#fb923c",
    mapGlow: "0 0 26px rgba(251,146,60,.6)",
    mapRing: "rgba(251,146,60,.24)"
  },
  robo: {
    key: "robo",
    label: "Robo",
    shortCode: "RB",
    icon: LockClosedIcon,
    iconClasses: "bg-fuchsia-500/15 text-fuchsia-300",
    panelClasses: "border-fuchsia-300/25 bg-fuchsia-500/10",
    chipClasses: "border-fuchsia-300/25 bg-fuchsia-500/12 text-fuchsia-200",
    mapColor: "#d946ef",
    mapGlow: "0 0 26px rgba(217,70,239,.6)",
    mapRing: "rgba(217,70,239,.24)"
  },
  "emergencia medica": {
    key: "emergencia medica",
    label: "Emergencia medica",
    shortCode: "EM",
    icon: HeartIcon,
    iconClasses: "bg-rose-500/15 text-rose-300",
    panelClasses: "border-rose-300/25 bg-rose-500/10",
    chipClasses: "border-rose-300/25 bg-rose-500/12 text-rose-200",
    mapColor: "#fb7185",
    mapGlow: "0 0 26px rgba(251,113,133,.62)",
    mapRing: "rgba(251,113,133,.24)"
  },
  otros: {
    key: "otros",
    label: "Otros",
    shortCode: "OT",
    icon: ExclamationTriangleIcon,
    iconClasses: "bg-sky-500/15 text-sky-300",
    panelClasses: "border-sky-300/25 bg-sky-500/10",
    chipClasses: "border-sky-300/25 bg-sky-500/12 text-sky-200",
    mapColor: "#38bdf8",
    mapGlow: "0 0 26px rgba(56,189,248,.55)",
    mapRing: "rgba(56,189,248,.24)"
  }
};

const DEFAULT_META = EMERGENCY_META.otros;

export function normalizeEmergencyType(value: string | null) {
  return value?.trim().toLowerCase() || "otros";
}

export function getEmergencyMeta(value: string | null) {
  return EMERGENCY_META[normalizeEmergencyType(value)] || DEFAULT_META;
}

export function getAlertStatusMeta(
  status: SosAlert["status"],
  isResponding = false
) {
  if (isResponding && status === "active") {
    return {
      label: "En camino",
      classes: "border border-accent/30 bg-accent/12 text-accent"
    };
  }

  if (status === "resolved") {
    return {
      label: "Resuelta",
      classes: "border border-accent/25 bg-accent/10 text-accent"
    };
  }

  if (status === "cancelled") {
    return {
      label: "Resuelta",
      classes: "border border-line/80 bg-white/5 text-muted"
    };
  }

  return {
    label: "Activa",
    classes: "border border-danger/30 bg-danger/12 text-danger"
  };
}
