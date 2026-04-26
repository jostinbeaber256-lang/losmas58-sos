"use client";

import { useEffect, useState } from "react";
import { 
  getGeolocationPermissionState, 
  getDevicePosition, 
  type GeolocationPermissionState 
} from "@/lib/geolocation";

interface DebugInfo {
  permissionState: GeolocationPermissionState;
  lastPosition: { latitude: number; longitude: number } | null;
  lastError: string | null;
  isAndroid: boolean;
  timestamp: string;
  permissionDetails: any;
}

export function AndroidLocationDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    permissionState: "unknown",
    lastPosition: null,
    lastError: null,
    isAndroid: false,
    timestamp: new Date().toISOString(),
    permissionDetails: null
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function updateDebugInfo() {
      try {
        // Detectar si es Android
        const { Capacitor } = await import("@capacitor/core");
        const isAndroid = Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform();

        // Obtener estado de permisos detallado
        let permissionState: GeolocationPermissionState = "unknown";
        let permissionDetails = null;
        let lastError = null;
        let lastPosition = null;

        if (isAndroid) {
          try {
            const Geolocation = await import("@capacitor/geolocation");
            const permissions = await Geolocation.Geolocation.checkPermissions();
            permissionDetails = {
              location: permissions.location,
              coarseLocation: permissions.coarseLocation,
              isGranted: permissions.location === "granted" || permissions.coarseLocation === "granted"
            };
            permissionState = permissionDetails.isGranted ? "granted" : 
              (permissions.location === "prompt-with-rationale" ? "prompt" : permissions.location);
          } catch (permError) {
            lastError = permError instanceof Error ? permError.message : "Error checking permissions";
            permissionState = "unknown";
          }

          // Intentar obtener posición actual
          if (permissionDetails?.isGranted) {
            try {
              const position = await getDevicePosition();
              lastPosition = {
                latitude: position.latitude,
                longitude: position.longitude
              };
            } catch (posError) {
              lastError = posError instanceof Error ? posError.message : "Error getting position";
            }
          }
        } else {
          // Web/PWA
          permissionState = await getGeolocationPermissionState();
          try {
            const position = await getDevicePosition();
            lastPosition = {
              latitude: position.latitude,
              longitude: position.longitude
            };
          } catch (posError) {
            lastError = posError instanceof Error ? posError.message : "Error getting position";
          }
        }

        setDebugInfo({
          permissionState,
          lastPosition,
          lastError,
          isAndroid,
          timestamp: new Date().toISOString(),
          permissionDetails
        });
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          lastError: error instanceof Error ? error.message : "Debug error",
          timestamp: new Date().toISOString()
        }));
      }
    }

    updateDebugInfo();
    interval = setInterval(updateDebugInfo, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white shadow-lg"
      >
        🐞 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-white/10 bg-surface p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">🐞 Android Location Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted hover:text-ink"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted">Platform:</span>
          <span className={debugInfo.isAndroid ? "text-accent" : "text-warning"}>
            {debugInfo.isAndroid ? "Android Native" : "Web/PWA"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted">Permission:</span>
          <span className={
            debugInfo.permissionState === "granted" ? "text-accent" :
            debugInfo.permissionState === "denied" ? "text-danger" :
            "text-warning"
          }>
            {debugInfo.permissionState}
          </span>
        </div>

        {debugInfo.permissionDetails && (
          <div className="rounded border border-white/10 bg-white/5 p-2">
            <div className="mb-1 text-muted">Permission Details:</div>
            <div className="space-y-1">
              <div>Location: {debugInfo.permissionDetails.location}</div>
              <div>Coarse: {debugInfo.permissionDetails.coarseLocation}</div>
              <div>Granted: {debugInfo.permissionDetails.isGranted ? "✅" : "❌"}</div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted">Position:</span>
          <span className={debugInfo.lastPosition ? "text-accent" : "text-warning"}>
            {debugInfo.lastPosition 
              ? `${debugInfo.lastPosition.latitude.toFixed(6)}, ${debugInfo.lastPosition.longitude.toFixed(6)}`
              : "No position"
            }
          </span>
        </div>

        {debugInfo.lastError && (
          <div className="rounded border border-danger/25 bg-danger/10 p-2 text-danger">
            <div className="mb-1 text-muted">Error:</div>
            <div className="break-words">{debugInfo.lastError}</div>
          </div>
        )}

        <div className="text-muted">
          Last update: {new Date(debugInfo.timestamp).toLocaleTimeString()}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-muted hover:bg-white/10"
        >
          🔄 Reload App
        </button>
      </div>
    </div>
  );
}
