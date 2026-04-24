import type { Coordinates } from "@/lib/types";

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
          reject(new Error("Debes permitir acceso a la ubicacion para activar el modo ruta."));
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
