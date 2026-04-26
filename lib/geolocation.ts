import type { Coordinates } from "@/lib/types";

export interface AndroidLocationError {
  code?: string;
  message: string;
  type: string;
  timestamp: string;
  permissions?: {
    location: string;
    coarseLocation: string;
  };
}

export interface AndroidTestResult {
  success: boolean;
  position?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
  };
  error?: AndroidLocationError;
  permissions: {
    location: string;
    coarseLocation: string;
    isGranted: boolean;
  };
  method: 'getCurrentPosition' | 'watchPosition';
  duration: number;
}
export type GeolocationPermissionState = PermissionState | "unsupported" | "unknown";

function captureAndroidError(error: unknown, permissions?: any): AndroidLocationError {
  const timestamp = new Date().toISOString();
  
  if (error && typeof error === 'object') {
    const capacitorError = error as any;
    return {
      code: capacitorError.code?.toString(),
      message: capacitorError.message || String(error),
      type: capacitorError.constructor?.name || typeof error,
      timestamp,
      permissions: permissions ? {
        location: permissions.location,
        coarseLocation: permissions.coarseLocation
      } : undefined
    };
  }
  
  return {
    message: String(error),
    type: typeof error,
    timestamp
  };
}
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

export async function isNativeAndroid() {
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
  
  logLocation("🔍 ANDROID: Mapping location error", {
    originalMessage: message,
    lowerMessage: lowerMessage
  });

  if (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("denied") ||
    lowerMessage.includes("user denied")
  ) {
    return new Error(
      "🚫 ANDROID: Permiso de ubicacion denegado. Activalo desde ajustes de Android > Apps > Los+58 > Permisos > Ubicacion."
    );
  }

  if (
    lowerMessage.includes("location services") ||
    lowerMessage.includes("disabled") ||
    lowerMessage.includes("settings") ||
    lowerMessage.includes("location unavailable")
  ) {
    return new Error(
      "📡 ANDROID: La ubicacion del sistema está desactivada. Actívala en Ajustes del teléfono > Ubicacion."
    );
  }

  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return new Error(
      "⏱️ ANDROID: Timeout obteniendo ubicacion. Sal al exterior, alejate de edificios o revisa que el GPS este activo y con buena senal."
    );
  }

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection")
  ) {
    return new Error(
      "📶 ANDROID: Error de red. Verifica tu conexion a internet e intenta nuevamente."
    );
  }

  return new Error(`❌ ANDROID: No fue posible obtener la ubicacion. ${message}`);
}

async function ensureNativeLocationPermission() {
  const Geolocation = await getNativeGeolocation();
  logLocation("🔍 ANDROID: Checking native Android location permissions");
  
  try {
    let permission = await Geolocation.checkPermissions();
    logLocation("📋 ANDROID: Native checkPermissions result", {
      location: permission.location,
      coarseLocation: permission.coarseLocation,
      isGranted: permission.location === "granted" || permission.coarseLocation === "granted"
    });

    // Considerar ambos permisos: location OR coarseLocation
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      logLocation("🙏 ANDROID: Requesting native Android location permissions");
      permission = await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"]
      });
      logLocation("📋 ANDROID: Native requestPermissions result", {
        location: permission.location,
        coarseLocation: permission.coarseLocation,
        isGranted: permission.location === "granted" || permission.coarseLocation === "granted"
      });
    }

    // Verificar nuevamente después de solicitar
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      const errorMsg = "🚫 ANDROID: Permiso de ubicacion denegado. Activalo desde ajustes de Android para usar ruta, mapa y SOS.";
      logLocation(errorMsg, { permission });
      throw new Error(errorMsg);
    }

    logLocation("✅ ANDROID: Location permissions granted successfully", {
      location: permission.location,
      coarseLocation: permission.coarseLocation
    });
    return permission;
  } catch (error) {
    logLocation("❌ ANDROID: Permission check failed", error);
    throw error;
  }
}

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (await isNativeAndroid()) {
    try {
      const Geolocation = await getNativeGeolocation();
      const permission = await Geolocation.checkPermissions();
      
      // Considerar ambos permisos: location OR coarseLocation
      const isGranted = permission.location === "granted" || permission.coarseLocation === "granted";
      const normalizedState = isGranted ? "granted" : normalizeNativePermission(permission.location);
      
      logLocation("🔍 ANDROID: Permission state check", {
        location: permission.location,
        coarseLocation: permission.coarseLocation,
        isGranted: isGranted,
        normalizedState: normalizedState
      });
      
      return normalizedState;
    } catch (error) {
      logLocation("❌ ANDROID: Permission check failed", error);
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
      logLocation("🎯 ANDROID: Starting getCurrentPosition");
      await ensureNativeLocationPermission();
      
      logLocation("📡 ANDROID: Calling Capacitor Geolocation.getCurrentPosition with optimized Android params");
      const position = await (await getNativeGeolocation()).getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000, // Aumentado para Android
        maximumAge: 10000, // Permitir cache reciente para Android
        enableLocationFallback: true
      });
      
      const coords = toCoordinates(position);
      logLocation("✅ ANDROID: getCurrentPosition SUCCESS", { 
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: position.timestamp
      });
      return coords;
    } catch (error) {
      logLocation("❌ ANDROID: getCurrentPosition FAILED", {
        error: error,
        message: getErrorMessage(error),
        type: typeof error
      });
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
      logLocation("👁️ ANDROID: Starting watchPosition", { intervalMs });
      await ensureNativeLocationPermission();
      
      const watchId = await (await getNativeGeolocation()).watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 25000, // Aumentado para Android
          maximumAge: 15000, // Permitir cache para Android
          minimumUpdateInterval: Math.max(intervalMs, 5000), // Mínimo 5s para Android
          interval: Math.max(intervalMs, 5000),
          enableLocationFallback: true
        },
        (position, error) => {
          if (error) {
            const mappedError = mapLocationError(error);
            logLocation("❌ ANDROID: watchPosition ERROR", {
              error: error,
              message: getErrorMessage(error),
              mappedMessage: mappedError.message
            });
            onError?.(mappedError);
            return;
          }

          if (!position) {
            const emptyError = new Error("watchPosition no devolvio coordenadas.");
            logLocation("❌ ANDROID: watchPosition EMPTY POSITION");
            onError?.(emptyError);
            return;
          }

          try {
            const coords = toCoordinates(position);
            logLocation("✅ ANDROID: watchPosition UPDATE", {
              latitude: coords.latitude,
              longitude: coords.longitude,
              timestamp: position.timestamp
            });
            onPosition(coords);
          } catch (coordsError) {
            logLocation("❌ ANDROID: watchPosition COORDS ERROR", coordsError);
            onError?.(mapLocationError(coordsError));
          }
        }
      );
      
      logLocation("✅ ANDROID: watchPosition STARTED", { watchId });
      return watchId;
    } catch (error) {
      logLocation("❌ ANDROID: watchPosition FAILED TO START", {
        error: error,
        message: getErrorMessage(error)
      });
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

export async function testAndroidLocation(): Promise<AndroidTestResult> {
  const startTime = Date.now();
  const Geolocation = await getNativeGeolocation();
  
  try {
    logLocation("🧪 ANDROID TEST: Starting location test");
    
    // 1. Check permissions
    const permissions = await Geolocation.checkPermissions();
    const isGranted = permissions.location === "granted" || permissions.coarseLocation === "granted";
    
    logLocation("📋 ANDROID TEST: Permissions check", {
      location: permissions.location,
      coarseLocation: permissions.coarseLocation,
      isGranted
    });
    
    // 2. Request permissions if needed
    if (!isGranted) {
      logLocation("🙏 ANDROID TEST: Requesting permissions");
      const requestedPermissions = await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"]
      });
      
      logLocation("📋 ANDROID TEST: Requested permissions", requestedPermissions);
      
      const isNowGranted = requestedPermissions.location === "granted" || requestedPermissions.coarseLocation === "granted";
      
      if (!isNowGranted) {
        return {
          success: false,
          error: captureAndroidError("Permission denied after request", requestedPermissions),
          permissions: {
            location: requestedPermissions.location,
            coarseLocation: requestedPermissions.coarseLocation,
            isGranted: false
          },
          method: 'getCurrentPosition',
          duration: Date.now() - startTime
        };
      }
    }
    
    // 3. Try getCurrentPosition with tolerant params
    logLocation("🎯 ANDROID TEST: Trying getCurrentPosition");
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 15000,
      enableLocationFallback: true
    });
    
    const coords = toCoordinates(position);
    
    return {
      success: true,
      position: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: (position as any).coords?.accuracy,
        timestamp: (position as any).timestamp || Date.now()
      },
      permissions: {
        location: permissions.location,
        coarseLocation: permissions.coarseLocation,
        isGranted: true
      },
      method: 'getCurrentPosition',
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    logLocation("❌ ANDROID TEST: getCurrentPosition failed", error);
    
    // 4. Fallback with watchPosition
    try {
      logLocation("🔄 ANDROID TEST: Trying watchPosition fallback");
      
      return new Promise<AndroidTestResult>((resolve) => {
        const fallbackTimeout = setTimeout(() => {
          resolve({
            success: false,
            error: captureAndroidError("watchPosition fallback timeout after 30s"),
            permissions: {
              location: "unknown",
              coarseLocation: "unknown",
              isGranted: false
            },
            method: 'watchPosition',
            duration: Date.now() - startTime
          });
        }, 30000);
        
        Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 25000,
            maximumAge: 20000,
            minimumUpdateInterval: 5000,
            interval: 5000,
            enableLocationFallback: true
          },
          (position, error) => {
            clearTimeout(fallbackTimeout);
            
            if (error) {
              resolve({
                success: false,
                error: captureAndroidError(error),
                permissions: {
                  location: "unknown",
                  coarseLocation: "unknown",
                  isGranted: false
                },
                method: 'watchPosition',
                duration: Date.now() - startTime
              });
              return;
            }
            
            if (!position) {
              resolve({
                success: false,
                error: captureAndroidError("watchPosition returned null position"),
                permissions: {
                  location: "unknown",
                  coarseLocation: "unknown",
                  isGranted: false
                },
                method: 'watchPosition',
                duration: Date.now() - startTime
              });
              return;
            }
            
            try {
              const coords = toCoordinates(position);
              resolve({
                success: true,
                position: {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  accuracy: (position as any).coords?.accuracy,
                  timestamp: (position as any).timestamp || Date.now()
                },
                permissions: {
                  location: "unknown",
                  coarseLocation: "unknown",
                  isGranted: true
                },
                method: 'watchPosition',
                duration: Date.now() - startTime
              });
            } catch (coordsError) {
              resolve({
                success: false,
                error: captureAndroidError(coordsError),
                permissions: {
                  location: "unknown",
                  coarseLocation: "unknown",
                  isGranted: false
                },
                method: 'watchPosition',
                duration: Date.now() - startTime
              });
            }
          }
        ).then((watchId) => {
          logLocation("✅ ANDROID TEST: watchPosition fallback started", { watchId });
        });
      });
      
    } catch (fallbackError) {
      return {
        success: false,
        error: captureAndroidError(fallbackError),
        permissions: {
          location: "unknown",
          coarseLocation: "unknown",
          isGranted: false
        },
        method: 'getCurrentPosition',
        duration: Date.now() - startTime
      };
    }
  }
}
