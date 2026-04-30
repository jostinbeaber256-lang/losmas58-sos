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

export interface AndroidPermissionLogEntry {
  step: string;
  result?: unknown;
  error?: string;
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
  permissionLog?: AndroidPermissionLogEntry[];
  nativePlatform?: {
    platform: string;
    isNative: boolean;
  };
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
  
  logLocation("Mapping location error", {
    originalMessage: message,
    lowerMessage: lowerMessage
  });

  if (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("denied") ||
    lowerMessage.includes("user denied")
  ) {
    return new Error(
      "Permiso de ubicacion denegado. Activalo desde los permisos del navegador para Los+58 y vuelve a intentar."
    );
  }

  if (
    lowerMessage.includes("location services") ||
    lowerMessage.includes("disabled") ||
    lowerMessage.includes("settings") ||
    lowerMessage.includes("location unavailable")
  ) {
    return new Error(
      "La ubicacion del dispositivo esta desactivada o no disponible. Activa GPS/ubicacion y vuelve a intentar."
    );
  }

  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return new Error(
      "No se pudo obtener tu ubicacion a tiempo. Revisa GPS, permisos y senal, y vuelve a intentar."
    );
  }

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection")
  ) {
    return new Error(
      "Error de red al obtener ubicacion. Verifica tu conexion e intenta nuevamente."
    );
  }

  return new Error(`No fue posible obtener la ubicacion. ${message}`);
}

function isLocalDevelopmentHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function getBrowserPosition(options: PositionOptions) {
  return new Promise<Coordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = toCoordinates(position);
        logLocation("Browser getCurrentPosition returned coords", coords);
        resolve(coords);
      },
      (error) => {
        logLocation("Browser getCurrentPosition failed", error);
        reject(error);
      },
      options
    );
  });
}

async function ensureNativeLocationPermission() {
  const Geolocation = await getNativeGeolocation();
  logLocation("🔍 ANDROID: Starting permission flow");
  
  try {
    // 1. Check permissions iniciales
    let permission = await Geolocation.checkPermissions();
    logLocation("📋 ANDROID: Initial checkPermissions result", {
      location: permission.location,
      coarseLocation: permission.coarseLocation,
      isGranted: permission.location === "granted" || permission.coarseLocation === "granted"
    });

    // 2. Si no tenemos granted, solicitar permisos
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      logLocation("🙏 ANDROID: Requesting permissions (both location and coarseLocation)");
      const requestResult = await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"]
      });
      logLocation("📋 ANDROID: After requestPermissions result", {
        location: requestResult.location,
        coarseLocation: requestResult.coarseLocation,
        isGranted: requestResult.location === "granted" || requestResult.coarseLocation === "granted"
      });
    }

    // 3. Verificación final después de solicitar
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      permission = await Geolocation.checkPermissions();
      logLocation("ANDROID: Final checkPermissions after requestPermissions", {
        location: permission.location,
        coarseLocation: permission.coarseLocation,
        isGranted: permission.location === "granted" || permission.coarseLocation === "granted"
      });
    }

    const finalIsGranted = permission.location === "granted" || permission.coarseLocation === "granted";
    
    if (!finalIsGranted) {
      const errorMsg = "🚫 ANDROID: Permiso denegado. Activa ubicación desde Ajustes > Apps > Los+58 > Permisos.";
      logLocation(errorMsg, { 
        finalLocation: permission.location, 
        finalCoarse: permission.coarseLocation 
      });
      throw new Error(errorMsg);
    }

    logLocation("✅ ANDROID: Permission flow completed successfully", {
      location: permission.location,
      coarseLocation: permission.coarseLocation,
      usingFineLocation: permission.location === "granted",
      usingCoarseLocation: permission.coarseLocation === "granted"
    });
    return permission;
  } catch (error) {
    logLocation("❌ ANDROID: Permission flow failed", error);
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
      let normalizedState: GeolocationPermissionState;
      
      if (isGranted) {
        normalizedState = "granted";
      } else if (permission.location === "denied" || permission.coarseLocation === "denied") {
        normalizedState = "denied";
      } else if (permission.location === "prompt" || permission.coarseLocation === "prompt") {
        normalizedState = "prompt";
      } else {
        normalizedState = normalizeNativePermission(permission.location);
      }
      
      logLocation("🔍 ANDROID: Permission state check", {
        location: permission.location,
        coarseLocation: permission.coarseLocation,
        isGranted: isGranted,
        normalizedState: normalizedState
      });
      
      return normalizedState;
    } catch (error) {
      logLocation("❌ ANDROID: Permission state check failed", error);
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
      logLocation("🎯 ANDROID: Starting getCurrentPosition flow");
      
      // Asegurar permisos primero
      await ensureNativeLocationPermission();
      
      logLocation("📡 ANDROID: Calling getCurrentPosition with Android-optimized params");
      const position = await (await getNativeGeolocation()).getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000, // 30s para Android
        maximumAge: 15000, // Permitir cache de 15s
        enableLocationFallback: true
      });
      
      const coords = toCoordinates(position);
      logLocation("✅ ANDROID: getCurrentPosition SUCCESS", { 
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: (position as any).coords?.accuracy,
        timestamp: (position as any).timestamp
      });
      return coords;
    } catch (error) {
      logLocation("❌ ANDROID: getCurrentPosition FAILED", {
        error: error,
        message: getErrorMessage(error),
        type: typeof error,
        code: (error as any)?.code
      });
      throw mapLocationError(error);
    }
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("La geolocalizacion no esta disponible en este dispositivo.");
  }

  if (
    typeof window !== "undefined" &&
    !window.isSecureContext &&
    !isLocalDevelopmentHost()
  ) {
    throw new Error(
      "La ubicacion solo funciona en HTTPS o localhost. Abre la app desde una URL segura."
    );
  }

  try {
    return await getBrowserPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 30000
    });
  } catch (firstError) {
    const lowerMessage = getErrorMessage(firstError).toLowerCase();

    if (lowerMessage.includes("permission") || lowerMessage.includes("denied")) {
      throw mapLocationError(firstError);
    }

    logLocation("Browser high accuracy failed, trying balanced fallback", firstError);

    try {
      return await getBrowserPosition({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      });
    } catch (fallbackError) {
      throw mapLocationError(fallbackError);
    }
  }
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
      timeout: Math.max(intervalMs, 15000),
      maximumAge: 30000
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

async function testAndroidLocationLegacy(): Promise<AndroidTestResult> {
  const startTime = Date.now();
  const Geolocation = await getNativeGeolocation();
  
  try {
    logLocation("🧪 ANDROID TEST: Starting complete permission + location test");
    
    // 1. Check permissions iniciales
    let permissions = await Geolocation.checkPermissions();
    const initialIsGranted = permissions.location === "granted" || permissions.coarseLocation === "granted";
    
    logLocation("📋 ANDROID TEST: Initial permissions", {
      location: permissions.location,
      coarseLocation: permissions.coarseLocation,
      isGranted: initialIsGranted
    });
    
    // 2. Solicitar permisos si no están granted
    if (!initialIsGranted) {
      logLocation("🙏 ANDROID TEST: Requesting permissions");
      permissions = await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"]
      });
      
      logLocation("📋 ANDROID TEST: After requesting permissions", {
        location: permissions.location,
        coarseLocation: permissions.coarseLocation,
        isGranted: permissions.location === "granted" || permissions.coarseLocation === "granted"
      });
    }
    
    // 3. Verificación final de permisos
    const finalIsGranted = permissions.location === "granted" || permissions.coarseLocation === "granted";
    
    if (!finalIsGranted) {
      return {
        success: false,
        error: captureAndroidError("Permission denied after request", permissions),
        permissions: {
          location: permissions.location,
          coarseLocation: permissions.coarseLocation,
          isGranted: false
        },
        method: 'getCurrentPosition',
        duration: Date.now() - startTime
      };
    }
    
    // 4. Intentar getCurrentPosition
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
    logLocation("❌ ANDROID TEST: Test failed", error);
    
    // 5. Fallback con watchPosition si getCurrentPosition falla
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

export async function testAndroidLocation(): Promise<AndroidTestResult> {
  const startTime = Date.now();
  const Geolocation = await getNativeGeolocation();
  const { Capacitor } = await import("@capacitor/core");
  const permissionLog: AndroidPermissionLogEntry[] = [];
  const nativePlatform = {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform()
  };

  function addPermissionLog(step: string, result: unknown) {
    permissionLog.push({ step, result });
    logLocation(`[Los58AndroidPermission] ${step}`, result);
  }

  function addPermissionError(step: string, error: unknown) {
    const message = getErrorMessage(error);
    permissionLog.push({ step, error: message });
    logLocation(`[Los58AndroidPermission] ${step} failed`, {
      message,
      error
    });
  }

  function buildPermissions(value: {
    location?: string;
    coarseLocation?: string;
  }) {
    const location = value.location || "unknown";
    const coarseLocation = value.coarseLocation || "unknown";

    return {
      location,
      coarseLocation,
      isGranted: location === "granted" || coarseLocation === "granted"
    };
  }

  try {
    logLocation("ANDROID TEST: Starting native permission + GPS test", nativePlatform);

    const beforeRequest = await Geolocation.checkPermissions();
    addPermissionLog("checkPermissions before request", beforeRequest);

    let permissions = beforeRequest;
    let currentPermissionState = buildPermissions(permissions);

    if (!currentPermissionState.isGranted) {
      try {
        const requestResult = await Geolocation.requestPermissions({
          permissions: ["location", "coarseLocation"]
        });
        addPermissionLog("requestPermissions result", requestResult);
      } catch (requestError) {
        addPermissionError("requestPermissions", requestError);
      }

      permissions = await Geolocation.checkPermissions();
      addPermissionLog("checkPermissions after request", permissions);
      currentPermissionState = buildPermissions(permissions);
    } else {
      addPermissionLog("requestPermissions skipped because already granted", permissions);
    }

    if (!currentPermissionState.isGranted) {
      return {
        success: false,
        error: captureAndroidError(
          "Android sigue reportando permisos en prompt/denied despues de requestPermissions(). Si no aparecio popup, revisa que la APK instalada tenga el Manifest sincronizado o que el permiso no este bloqueado en Ajustes.",
          permissions
        ),
        permissions: currentPermissionState,
        method: "getCurrentPosition",
        duration: Date.now() - startTime,
        permissionLog,
        nativePlatform
      };
    }

    logLocation("ANDROID TEST: Calling getCurrentPosition after granted permission", {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 15000
    });

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
      permissions: currentPermissionState,
      method: "getCurrentPosition",
      duration: Date.now() - startTime,
      permissionLog,
      nativePlatform
    };
  } catch (error) {
    logLocation("ANDROID TEST: getCurrentPosition failed, trying watchPosition fallback", {
      message: getErrorMessage(error),
      error
    });

    try {
      return await new Promise<AndroidTestResult>((resolve) => {
        const fallbackTimeout = setTimeout(() => {
          resolve({
            success: false,
            error: captureAndroidError("watchPosition fallback timeout after 30s"),
            permissions: {
              location: "unknown",
              coarseLocation: "unknown",
              isGranted: false
            },
            method: "watchPosition",
            duration: Date.now() - startTime,
            permissionLog,
            nativePlatform
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
          (position, watchError) => {
            clearTimeout(fallbackTimeout);

            if (watchError) {
              resolve({
                success: false,
                error: captureAndroidError(watchError),
                permissions: {
                  location: "unknown",
                  coarseLocation: "unknown",
                  isGranted: false
                },
                method: "watchPosition",
                duration: Date.now() - startTime,
                permissionLog,
                nativePlatform
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
                method: "watchPosition",
                duration: Date.now() - startTime,
                permissionLog,
                nativePlatform
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
                method: "watchPosition",
                duration: Date.now() - startTime,
                permissionLog,
                nativePlatform
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
                method: "watchPosition",
                duration: Date.now() - startTime,
                permissionLog,
                nativePlatform
              });
            }
          }
        ).then((watchId) => {
          logLocation("ANDROID TEST: watchPosition fallback started", { watchId });
        }).catch((watchStartError) => {
          clearTimeout(fallbackTimeout);
          resolve({
            success: false,
            error: captureAndroidError(watchStartError),
            permissions: {
              location: "unknown",
              coarseLocation: "unknown",
              isGranted: false
            },
            method: "watchPosition",
            duration: Date.now() - startTime,
            permissionLog,
            nativePlatform
          });
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
        method: "getCurrentPosition",
        duration: Date.now() - startTime,
        permissionLog,
        nativePlatform
      };
    }
  }
}
