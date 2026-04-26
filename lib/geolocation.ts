import type { Coordinates } from "@/lib/types";

export type GeolocationPermissionState = PermissionState | "unsupported" | "unknown";

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unsupported";
  }

  if (!navigator.permissions?.query) {
    return "unknown";
  }

  try {
    const result = await navigator.permissions.query({
      name: "geolocation" as PermissionName
    });

    return result.state;
  } catch {
    return "unknown";
  }
}

export function getBrowserPosition() {
  return new Promise<Coordinates>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("La geolocalizacion no esta disponible en este dispositivo."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new Error(
              "Permiso de ubicacion denegado. Activalo desde los ajustes de Android o del navegador para usar mapa, ruta y SOS."
            )
          );
          return;
        }

        reject(new Error("No fue posible obtener la ubicacion actual."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
