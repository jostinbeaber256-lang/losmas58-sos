"use client";

import { useState } from "react";
import { isNativeAndroid } from "@/lib/geolocation";
import { testAndroidLocation, type AndroidTestResult } from "@/lib/geolocation";

export function AndroidLocationTestButton() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<AndroidTestResult | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTest = async () => {
    if (!(await isNativeAndroid())) {
      setTestResult({
        success: false,
        error: {
          message: "Esta prueba solo funciona en Android APK nativo",
          type: "PlatformError",
          timestamp: new Date().toISOString()
        },
        permissions: {
          location: "unknown",
          coarseLocation: "unknown",
          isGranted: false
        },
        method: 'getCurrentPosition',
        duration: 0
      });
      return;
    }

    setIsTesting(true);
    setIsExpanded(true);
    
    try {
      console.log("🧪 ANDROID: Starting manual location test");
      const result = await testAndroidLocation();
      console.log("🧪 ANDROID: Test completed", result);
      setTestResult(result);
    } catch (error) {
      console.error("🧪 ANDROID: Test failed", error);
      setTestResult({
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          type: "TestError",
          timestamp: new Date().toISOString()
        },
        permissions: {
          location: "unknown",
          coarseLocation: "unknown",
          isGranted: false
        },
        method: 'getCurrentPosition',
        duration: 0
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={handleTest}
        disabled={isTesting}
        className="fixed bottom-20 right-4 z-40 rounded-full bg-warning px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-warning/80 disabled:opacity-50"
      >
        {isTesting ? "⏳ Probando..." : "🧪 Probar ubicación Android"}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md rounded-2xl border border-white/10 bg-surface p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">🧪 Prueba de Ubicación Android</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-muted hover:text-ink"
        >
          ✕
        </button>
      </div>

      <button
        onClick={handleTest}
        disabled={isTesting}
        className="mb-3 w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
      >
        {isTesting ? "⏳ Ejecutando prueba..." : "🔄 Ejecutar prueba"}
      </button>

      {testResult && (
        <div className="space-y-2 text-xs">
          <div className={`rounded-lg p-2 ${
            testResult.success ? 'bg-accent/10 border border-accent/25' : 'bg-danger/10 border border-danger/25'
          }`}>
            <div className="font-semibold">
              {testResult.success ? "✅ ÉXITO" : "❌ FALLO"}
            </div>
            <div className="text-muted">
              Método: {testResult.method} | Duración: {testResult.duration}ms
            </div>
          </div>

          <div className="rounded border border-white/10 bg-white/5 p-2">
            <div className="mb-1 font-semibold text-muted">Permisos:</div>
            <div className="space-y-1">
              <div>Location: {testResult.permissions.location}</div>
              <div>Coarse: {testResult.permissions.coarseLocation}</div>
              <div>Granted: {testResult.permissions.isGranted ? "✅" : "❌"}</div>
            </div>
          </div>

          {testResult.nativePlatform ? (
            <div className="rounded border border-white/10 bg-white/5 p-2">
              <div className="mb-1 font-semibold text-muted">Runtime nativo:</div>
              <div>Platform: {testResult.nativePlatform.platform}</div>
              <div>Native: {testResult.nativePlatform.isNative ? "si" : "no"}</div>
            </div>
          ) : null}

          {testResult.permissionLog?.length ? (
            <div className="rounded border border-white/10 bg-white/5 p-2">
              <div className="mb-1 font-semibold text-muted">
                Log exacto de permisos:
              </div>
              <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                {testResult.permissionLog.map((entry, index) => (
                  <div key={`${entry.step}-${index}`} className="rounded bg-black/20 p-2">
                    <div className="font-semibold text-ink">{entry.step}</div>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-4 text-muted">
                      {entry.error || JSON.stringify(entry.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {testResult.success && testResult.position && (
            <div className="rounded border border-accent/25 bg-accent/10 p-2">
              <div className="mb-1 font-semibold text-accent">Posición obtenida:</div>
              <div className="space-y-1">
                <div>Lat: {testResult.position.latitude.toFixed(6)}</div>
                <div>Lng: {testResult.position.longitude.toFixed(6)}</div>
                {testResult.position.accuracy && (
                  <div>Precisión: ±{testResult.position.accuracy.toFixed(0)}m</div>
                )}
                <div>Timestamp: {new Date(testResult.position.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          )}

          {testResult.error && (
            <div className="rounded border border-danger/25 bg-danger/10 p-2 text-danger">
              <div className="mb-1 font-semibold">Error:</div>
              <div className="break-words">{testResult.error.message}</div>
              {testResult.error.code && (
                <div className="mt-1 text-muted">Código: {testResult.error.code}</div>
              )}
              <div className="mt-1 text-muted">Tipo: {testResult.error.type}</div>
              <div className="mt-1 text-muted">
                Hora: {new Date(testResult.error.timestamp).toLocaleTimeString()}
              </div>
              {testResult.error.permissions && (
                <div className="mt-1 text-muted">
                  Permisos al error: L={testResult.error.permissions.location}, C={testResult.error.permissions.coarseLocation}
                </div>
              )}
            </div>
          )}

          <div className="text-muted text-xs">
            💡 Esta prueba ayuda a diagnosticar problemas específicos de Android APK
          </div>
        </div>
      )}
    </div>
  );
}
