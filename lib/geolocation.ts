import type { Coordinates } from "@/lib/types";

export type GeolocationPermissionState = PermissionState | "unsupported" | "unknown";
type LocationWatchId = string | number;
type CapacitorBridge = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
  platform?: string;
};

function logLocation(message: string, data?: unknown) {
  if (data === undefined) {
    console.log(`[Los58Location] ${message}`);
    return;
  }

  console.log(`[Los58Location] ${message}`, data);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido";
  }
}

function getCapacitorBridge() {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as Window & { Capacitor?: CapacitorBridge }).Capacitor ?? null;
}

async function isNativeAndroid() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const { Capacitor } = await import("@capacitor/core");
    const bridge = getCapacitorBridge();
    const platform =
      bridge?.getPlatform?.() ?? bridge?.platform ?? Capacitor.getPlatform();
    const native =
      bridge?.isNativePlatform?.() ?? Capacitor.isNativePlatform();

    return native && platform === "android";
  } catch {
    return false;
  }
}

async function getNativeGeolocation() {
  const geolocationModule = await import("@capacitor/geolocation");
  return geolocationModule.Geolocation;
}

function normalizeNativePermission(value: string): GeolocationPermissionState {
  if (value === "granted" || value === "denied" || value === "prompt") {
    return value;
  }

  if (value === "prompt-with-rationale") {
    return "prompt";
  }

  return "unknown";
}

function toCoordinates(position: {
  coords?: { latitude?: number; longitude?: number } | null;
}) {
  const latitude = position.coords?.latitude;
  const longitude = position.coords?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("No se recibieron coordenadas validas del dispositivo.");
  }

  return { latitude, longitude };
}

function mapLocationError(error: unknown) {
  const message = getErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("denied") ||
    lowerMessage.includes("user denied")
  ) {
    return new Error(
      "Permiso de ubicacion denegado. Activalo desde ajustes de Android para usar ruta, mapa y SOS."
    );
  }

  if (
    lowerMessage.includes("location services") ||
    lowerMessage.includes("disabled") ||
    lowerMessage.includes("settings")
  ) {
    return new Error(
      "Los servicios de ubicacion estan apagados. Activa el GPS/ubicacion del telefono e intenta de nuevo."
    );
  }

  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return new Error(
      "Tiempo agotado obteniendo ubicacion. Sal al exterior o revisa que el GPS este activo."
    );
  }

  return new Error(`No fue posible obtener la ubicacion actual. ${message}`);
}

async function ensureNativeLocationPermission() {
  const Geolocation = await getNativeGeolocation();
  logLocation("Checking native Android location permissions");
  let permission = await Geolocation.checkPermissions();
  logLocation("Native checkPermissions result", permission);

  if (permission.location !== "granted") {
    logLocation("Requesting native Android location permissions");
    permission = await Geolocation.requestPermissions({
      permissions: ["location", "coarseLocation"]
    });
    logLocation("Native requestPermissions result", permission);
  }

  if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
    throw new Error(
      "Permiso de ubicacion denegado. Activalo desde ajustes de Android para usar ruta, mapa y SOS."
    );
  }

  return permission;
}

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (await isNativeAndroid()) {
    try {
      const Geolocation = await getNativeGeolocation();
      const permission = await Geolocation.checkPermissions();
      logLocation("Permission state from Capacitor", permission);
      return normalizeNativePermission(permission.location);
    } catch (error) {
      logLocation("Native permission check failed", error);
      return "unknown";
    }
  }

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

export async function getDevicePosition() {
  if (await isNativeAndroid()) {
    try {
      await ensureNativeLocationPermission();
      logLocation("Calling Capacitor Geolocation.getCurrentPosition");
      const position = await (await getNativeGeolocation()).getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        enableLocationFallback: true
      });
      const coords = toCoordinates(position);
      logLocation("Native getCurrentPosition returned coords", coords);
      return coords;
    } catch (error) {
      logLocation("Native getCurrentPosition failed", error);
      throw mapLocationError(error);
    }
  }

  return new Promise<Coordinates>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("La geolocalizacion no esta disponible en este dispositivo."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = toCoordinates(position);
        logLocation("Browser getCurrentPosition returned coords", coords);
        resolve(coords);
      },
      (error) => {
        logLocation("Browser getCurrentPosition failed", error);
        reject(mapLocationError(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

export async function watchDevicePosition(
  onPosition: (coords: Coordinates) => void,
  onError?: (error: Error) => void,
  intervalMs = 10000
): Promise<LocationWatchId> {
  if (await isNativeAndroid()) {
    try {
      await ensureNativeLocationPermission();
      logLocation("Starting Capacitor Geolocation.watchPosition", { intervalMs });
      const watchId = await (await getNativeGeolocation()).watchPosition(
        {
          enableHighAccuracy: true,
          timeout: intervalMs,
          maximumAge: 0,
          minimumUpdateInterval: intervalMs,
          interval: intervalMs,
          enableLocationFallback: true
        },
        (position, error) => {
          if (error) {
            const mappedError = mapLocationError(error);
            logLocation("Native watchPosition error", error);
            onError?.(mappedError);
            return;
          }

          if (!position) {
            const emptyError = new Error("watchPosition no devolvio coordenadas.");
            logLocation("Native watchPosition empty position");
            onError?.(emptyError);
            return;
          }

          try {
            const coords = toCoordinates(position);
            logLocation("Native watchPosition coords", coords);
            onPosition(coords);
          } catch (coordsError) {
            onError?.(mapLocationError(coordsError));
          }
        }
      );
      logLocation("Native watchPosition started", { watchId });
      return watchId;
    } catch (error) {
      logLocation("Native watchPosition failed to start", error);
      throw mapLocationError(error);
    }
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("La geolocalizacion no esta disponible en este dispositivo.");
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const coords = toCoordinates(position);
      logLocation("Browser watchPosition coords", coords);
      onPosition(coords);
    },
    (error) => {
      logLocation("Browser watchPosition error", error);
      onError?.(mapLocationError(error));
    },
    {
      enableHighAccuracy: true,
      timeout: intervalMs,
      maximumAge: 0
    }
  );
  logLocation("Browser watchPosition started", { watchId });
  return watchId;
}

export async function clearDeviceWatch(watchId: LocationWatchId | null) {
  if (watchId === null) {
    return;
  }

  if (await isNativeAndroid()) {
    try {
      logLocation("Clearing native watchPosition", { watchId });
      await (await getNativeGeolocation()).clearWatch({ id: String(watchId) });
    } catch (error) {
      logLocation("Native clearWatch failed", error);
    }
    return;
  }

  if (typeof navigator !== "undefined" && navigator.geolocation) {
    logLocation("Clearing browser watchPosition", { watchId });
    navigator.geolocation.clearWatch(Number(watchId));
  }
}

export const getBrowserPosition = getDevicePosition;
