import type { ActiveRider, Coordinates, SosAlert } from "@/lib/types";

export const DEFAULT_CENTER = {
  latitude: 10.4806,
  longitude: -66.9036
};

export function formatRiderName(rider: Pick<ActiveRider, "full_name" | "username">) {
  return rider.full_name || rider.username || "Motero activo";
}

export function formatAlertName(
  rider: Pick<SosAlert, "full_name" | "username">
) {
  return rider.full_name || rider.username || "Motero en emergencia";
}

export function formatPhoneNumber(phone: string | null) {
  if (!phone) {
    return "Sin contacto";
  }

  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return trimmed;
  }

  if (digits.length === 12 && digits.startsWith("58")) {
    return `+58 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  const groups = digits.match(/.{1,3}/g)?.join(" ") || digits;
  return hasPlus ? `+${groups}` : groups;
}

export function formatCoordinatesCompact(latitude: number, longitude: number) {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function isRiderVisible(rider: ActiveRider) {
  return (
    rider.is_on_route &&
    typeof rider.latitude === "number" &&
    typeof rider.longitude === "number"
  );
}

export function getDistanceKm(from: Coordinates | null, to: Coordinates | null) {
  if (!from || !to) {
    return null;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function formatDistanceKm(distanceKm: number | null) {
  if (distanceKm === null) {
    return "Sin referencia";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}
