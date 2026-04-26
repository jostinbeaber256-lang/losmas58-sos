"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { Session } from "@supabase/supabase-js";
import type {
  ActiveRider,
  Coordinates,
  MedicalProfile,
  MedicalProfileFormValues,
  NotificationEvent,
  Profile,
  ProfileFormValues,
  SosAlert,
  SosPayload,
  SosResponse
} from "@/lib/types";
import {
  clearDeviceWatch,
  getDevicePosition,
  watchDevicePosition
} from "@/lib/geolocation";
import { createClient } from "@/lib/supabase/browser";

type RoutePresenceContextValue = {
  currentUserId: string | null;
  isAuthenticated: boolean;
  profile: Profile | null;
  medicalProfile: MedicalProfile | null;
  activeRiders: ActiveRider[];
  alerts: SosAlert[];
  notificationEvents: NotificationEvent[];
  sosAlertEvents: SosAlert[];
  activeSosAlert: SosAlert | null;
  isOnRoute: boolean;
  latestPosition: Coordinates | null;
  loading: boolean;
  tracking: boolean;
  sosLoading: boolean;
  alertUpdatingId: string | null;
  responseSubmittingAlertId: string | null;
  profileSaving: boolean;
  medicalProfileSaving: boolean;
  error: string | null;
  sosFeedback: string | null;
  toggleRoute: () => Promise<void>;
  toggleContinuousMonitoring: () => Promise<boolean>;
  toggleEmergencyTracking: () => Promise<boolean>;
  triggerSos: (payload: SosPayload) => Promise<boolean>;
  updateAlertStatus: (
    alertId: string,
    status: "resolved" | "cancelled"
  ) => Promise<boolean>;
  respondToAlert: (alertId: string) => Promise<boolean>;
  updateProfile: (values: ProfileFormValues) => Promise<boolean>;
  updateMedicalProfile: (values: MedicalProfileFormValues) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshMedicalProfile: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshActiveRiders: () => Promise<void>;
  clearSosFeedback: () => void;
};

const RoutePresenceContext = createContext<RoutePresenceContextValue | null>(null);

const profileSelect =
  "id, username, full_name, bike_model, city, emergency_contact, is_admin, is_on_route, emergency_state, continuous_monitoring_enabled, emergency_tracking_active, latitude, longitude, location_updated_at, sharing_started_at, monitoring_updated_at, emergency_tracking_started_at, updated_at";

const riderSelect =
  "id, username, full_name, bike_model, city, emergency_contact, emergency_state, continuous_monitoring_enabled, emergency_tracking_active, latitude, longitude, is_on_route, location_updated_at";

const alertSelect =
  "id, user_id, full_name, username, bike_model, city, emergency_contact, emergency_type, emergency_details, medical_summary, latitude, longitude, status, message, created_at, resolved_at";

const responseSelect =
  "id, sos_alert_id, helper_user_id, helper_name, status, created_at";

const medicalProfileSelect =
  "user_id, blood_type, allergies, medical_conditions, medications, notes, emergency_contact_name, emergency_contact_phone, secondary_contact_name, secondary_contact_phone, insurance_info, preferred_hospital, show_in_sos, updated_at";

function formatAlertTitle(alert: SosAlert) {
  return alert.full_name || alert.username || "Motero en emergencia";
}

function getEmergencyLabel(value: string | null) {
  return value || "SOS";
}

function buildSosMessage({
  emergencyType,
  emergencyDetails
}: SosPayload) {
  if (emergencyType === "Otros") {
    return emergencyDetails?.trim() || "SOS activado desde Los+58.";
  }

  return `Emergencia reportada: ${emergencyType}. Se requiere apoyo inmediato en la ubicacion compartida.`;
}

function buildSosMedicalSummary(medicalProfile: MedicalProfile | null) {
  if (!medicalProfile?.show_in_sos) {
    return null;
  }

  const parts = [
    medicalProfile.blood_type ? `Sangre ${medicalProfile.blood_type}` : null,
    medicalProfile.allergies ? `Alergias: ${medicalProfile.allergies}` : null,
    medicalProfile.medical_conditions
      ? `Condiciones: ${medicalProfile.medical_conditions}`
      : null,
    medicalProfile.emergency_contact_name || medicalProfile.emergency_contact_phone
      ? `Contacto: ${[
          medicalProfile.emergency_contact_name,
          medicalProfile.emergency_contact_phone
        ]
          .filter(Boolean)
          .join(" - ")}`
      : null
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : null;
}

function getDefaultProfileValues(session: Session | null, userId: string) {
  const metadata = session?.user.user_metadata ?? {};
  const rawName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null;

  return {
    id: userId,
    full_name: rawName
  };
}

async function notifyPushEvent({
  type,
  alertId
}: {
  type: "new_sos" | "response" | "resolved";
  alertId: string;
}) {
  try {
    console.log("[push:client] Requesting push event", { type, alertId });
    const response = await fetch("/api/push/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ type, alertId })
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      console.warn("[push:client] Push event request failed", {
        type,
        alertId,
        status: response.status,
        result
      });
      return;
    }

    console.log("[push:client] Push event request completed", {
      type,
      alertId,
      result
    });
  } catch (pushError) {
    console.warn("No se pudo disparar la notificacion push.", pushError);
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
) {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function RoutePresenceProvider({
  children,
  session
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [supabase] = useState(createClient);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile | null>(null);
  const [activeRiders, setActiveRiders] = useState<ActiveRider[]>([]);
  const [rawAlerts, setRawAlerts] = useState<SosAlert[]>([]);
  const [sosAlertEvents, setSosAlertEvents] = useState<SosAlert[]>([]);
  const [responses, setResponses] = useState<SosResponse[]>([]);
  const [latestPosition, setLatestPosition] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [alertUpdatingId, setAlertUpdatingId] = useState<string | null>(null);
  const [responseSubmittingAlertId, setResponseSubmittingAlertId] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [medicalProfileSaving, setMedicalProfileSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sosFeedback, setSosFeedback] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<string | number | null>(null);
  const watchedPositionRef = useRef<Coordinates | null>(null);
  const profileRef = useRef<Profile | null>(null);

  const isAuthenticated = Boolean(session?.user.id);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  function shouldReportLocation(nextProfile = profileRef.current) {
    return Boolean(
      nextProfile?.is_on_route ||
        nextProfile?.continuous_monitoring_enabled ||
        nextProfile?.emergency_tracking_active ||
        nextProfile?.emergency_state === "emergency"
    );
  }

  async function ensureProfile() {
    if (!userId) {
      return null;
    }

    const defaults = getDefaultProfileValues(session, userId);
    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(defaults)
      .select(profileSelect)
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }

    setProfile(insertedProfile);
    setLatestPosition(null);
    setError(null);
    return insertedProfile;
  }

  async function loadProfile() {
    if (!userId) {
      setProfile(null);
      setLatestPosition(null);
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", userId)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        await ensureProfile();
        return;
      }

      setError(profileError.message);
      return;
    }

    setProfile(data);

    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      setLatestPosition({
        latitude: data.latitude,
        longitude: data.longitude
      });
    } else {
      setLatestPosition(null);
    }

    setError(null);
  }

  async function loadMedicalProfile() {
    if (!userId) {
      setMedicalProfile(null);
      return;
    }

    const { data, error: medicalError } = await supabase
      .from("medical_profiles")
      .select(medicalProfileSelect)
      .eq("user_id", userId)
      .single();

    if (medicalError) {
      if (medicalError.code === "PGRST116") {
        setMedicalProfile(null);
        return;
      }

      setError(medicalError.message);
      return;
    }

    setMedicalProfile(data);
  }

  async function getMedicalProfileForSos() {
    if (!userId) {
      return null;
    }

    const { data, error: medicalError } = await supabase
      .from("medical_profiles")
      .select(medicalProfileSelect)
      .eq("user_id", userId)
      .single();

    if (medicalError) {
      if (medicalError.code === "PGRST116") {
        setMedicalProfile(null);
        return null;
      }

      setError(medicalError.message);
      return null;
    }

    setMedicalProfile(data);
    return data;
  }

  async function loadActiveRiders() {
    if (!userId) {
      setActiveRiders([]);
      return;
    }

    const { data, error: ridersError } = await supabase
      .from("profiles")
      .select(riderSelect)
      .eq("is_on_route", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("location_updated_at", { ascending: false });

    if (ridersError) {
      setError(ridersError.message);
      return;
    }

    setActiveRiders(data ?? []);
  }

  async function loadAlerts() {
    if (!userId) {
      setRawAlerts([]);
      return;
    }

    const { data, error: alertsError } = await supabase
      .from("sos_alerts")
      .select(alertSelect)
      .order("created_at", { ascending: false });

    if (alertsError) {
      setError(alertsError.message);
      return;
    }

    setRawAlerts(data ?? []);
  }

  async function loadResponses() {
    if (!userId) {
      setResponses([]);
      return;
    }

    const { data, error: responsesError } = await supabase
      .from("sos_responses")
      .select(responseSelect)
      .eq("status", "on_the_way")
      .order("created_at", { ascending: true });

    if (responsesError) {
      setError(responsesError.message);
      return;
    }

    setResponses(data ?? []);
  }

  async function pushLocationUpdate({
    routeActive,
    clearLocation = false,
    emergencyState,
    coordsOverride,
    continuousMonitoringEnabled,
    emergencyTrackingActive
  }: {
    routeActive?: boolean;
    clearLocation?: boolean;
    emergencyState?: "normal" | "emergency";
    coordsOverride?: Coordinates;
    continuousMonitoringEnabled?: boolean;
    emergencyTrackingActive?: boolean;
  }) {
    if (!userId) {
      return false;
    }

    const currentProfile = profileRef.current;
    const nextRouteActive = routeActive ?? Boolean(currentProfile?.is_on_route);
    const nextContinuousMonitoring =
      continuousMonitoringEnabled ?? Boolean(currentProfile?.continuous_monitoring_enabled);
    const nextEmergencyTracking =
      emergencyTrackingActive ?? Boolean(currentProfile?.emergency_tracking_active);
    const nextEmergencyState =
      emergencyState ?? currentProfile?.emergency_state ?? "normal";
    const shouldCaptureLocation =
      !clearLocation &&
      (nextRouteActive ||
        nextContinuousMonitoring ||
        nextEmergencyTracking ||
        nextEmergencyState === "emergency");
    const coords = shouldCaptureLocation
      ? coordsOverride || watchedPositionRef.current || (await getDevicePosition())
      : null;
    const now = new Date().toISOString();

    const payload = {
      is_on_route: nextRouteActive,
      emergency_state: nextEmergencyState,
      continuous_monitoring_enabled: nextContinuousMonitoring,
      emergency_tracking_active: nextEmergencyTracking,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      location_updated_at: coords ? now : null,
      sharing_started_at:
        nextRouteActive && !currentProfile?.sharing_started_at
          ? now
          : nextRouteActive
            ? currentProfile?.sharing_started_at
            : null,
      monitoring_updated_at: nextContinuousMonitoring && coords
        ? now
        : nextContinuousMonitoring
          ? currentProfile?.monitoring_updated_at
          : null,
      emergency_tracking_started_at: nextEmergencyTracking
        ? currentProfile?.emergency_tracking_started_at || now
        : null
    };

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select(profileSelect)
      .single();

    if (updateError) {
      setError(updateError.message);
      return false;
    }

    setProfile(data);
    setLatestPosition(
      coords
        ? {
            latitude: coords.latitude,
            longitude: coords.longitude
          }
        : null
    );
    setError(null);
    await loadActiveRiders();
    return true;
  }

  function stopTracking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    void clearDeviceWatch(watchIdRef.current);
    watchIdRef.current = null;
    watchedPositionRef.current = null;
    setTracking(false);
  }

  function startTracking() {
    const intervalMs = profileRef.current?.emergency_tracking_active ? 5000 : 10000;

    stopTracking();
    setTracking(true);
    void watchDevicePosition(
      (coords) => {
        watchedPositionRef.current = coords;
        setLatestPosition(coords);
      },
      (locationError) => {
        setError(locationError.message);
      },
      intervalMs
    )
      .then((watchId) => {
        watchIdRef.current = watchId;
      })
      .catch((locationError) => {
        const message =
          locationError instanceof Error
            ? locationError.message
            : "No se pudo iniciar el monitoreo nativo de ubicacion.";
        setError(message);
      });

    intervalRef.current = setInterval(async () => {
      try {
        const currentProfile = profileRef.current;

        if (!shouldReportLocation(currentProfile)) {
          stopTracking();
          return;
        }

        await pushLocationUpdate({
          routeActive: currentProfile?.is_on_route ?? false,
          emergencyState: currentProfile?.emergency_state ?? "normal",
          continuousMonitoringEnabled:
            currentProfile?.continuous_monitoring_enabled ?? false,
          emergencyTrackingActive: currentProfile?.emergency_tracking_active ?? false
        });
      } catch (updateError) {
        const message =
          updateError instanceof Error
            ? updateError.message
            : "No se pudo refrescar tu posicion.";
        setError(message);
      }
    }, intervalMs);
  }

  async function toggleRoute() {
    if (!userId || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (profile?.is_on_route) {
        const keepReporting =
          Boolean(profile.continuous_monitoring_enabled) ||
          Boolean(profile.emergency_tracking_active);
        const success = await pushLocationUpdate({
          routeActive: false,
          clearLocation: !keepReporting,
          emergencyState: "normal"
        });

        if (success && !keepReporting) {
          stopTracking();
        }
      } else {
        const success = await pushLocationUpdate({
          routeActive: true,
          emergencyState: profile?.emergency_state ?? "normal"
        });

        if (success) {
          startTracking();
        }
      }
    } catch (toggleError) {
      const message =
        toggleError instanceof Error
          ? toggleError.message
          : "No se pudo cambiar el estado de ruta.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleContinuousMonitoring() {
    if (!userId || loading) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const nextEnabled = !profile?.continuous_monitoring_enabled;
      const keepLocation =
        nextEnabled ||
        Boolean(profile?.is_on_route) ||
        Boolean(profile?.emergency_tracking_active);
      const success = await pushLocationUpdate({
        routeActive: profile?.is_on_route ?? false,
        clearLocation: !keepLocation,
        emergencyState: profile?.emergency_state ?? "normal",
        continuousMonitoringEnabled: nextEnabled,
        emergencyTrackingActive: profile?.emergency_tracking_active ?? false
      });

      if (success) {
        if (keepLocation) {
          startTracking();
        } else {
          stopTracking();
        }
      }

      return success;
    } catch (monitoringError) {
      const message =
        monitoringError instanceof Error
          ? monitoringError.message
          : "No se pudo actualizar el monitoreo continuo.";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function toggleEmergencyTracking() {
    if (!userId || loading) {
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const nextEnabled = !profile?.emergency_tracking_active;
      const keepLocation =
        nextEnabled ||
        Boolean(profile?.is_on_route) ||
        Boolean(profile?.continuous_monitoring_enabled);
      const success = await pushLocationUpdate({
        routeActive: profile?.is_on_route ?? false,
        clearLocation: !keepLocation,
        emergencyState: nextEnabled ? "emergency" : "normal",
        continuousMonitoringEnabled: profile?.continuous_monitoring_enabled ?? false,
        emergencyTrackingActive: nextEnabled
      });

      if (success) {
        if (keepLocation) {
          startTracking();
        } else {
          stopTracking();
        }
      }

      return success;
    } catch (trackingError) {
      const message =
        trackingError instanceof Error
          ? trackingError.message
          : "No se pudo actualizar el rastreo de emergencia.";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function triggerSos({ emergencyType, emergencyDetails }: SosPayload) {
    if (!userId || sosLoading) {
      return false;
    }

    console.log("[Los58SOS] Starting SOS flow", { emergencyType });
    setSosLoading(true);
    setError(null);
    setSosFeedback(null);

    try {
      console.log("[Los58SOS] Requesting position");
      const coords = await withTimeout(
        getDevicePosition(),
        12000,
        "No se pudo obtener tu ubicacion actual. Verifica GPS y permisos."
      );

      if (
        !Number.isFinite(coords.latitude) ||
        !Number.isFinite(coords.longitude)
      ) {
        throw new Error(
          "No se pudo obtener tu ubicacion actual. Verifica GPS y permisos."
        );
      }

      console.log("[Los58SOS] Position received", coords);
      const latestMedicalProfile = await getMedicalProfileForSos();

      const updated = await pushLocationUpdate({
        routeActive: true,
        emergencyState: "emergency",
        emergencyTrackingActive:
          emergencyType === "Robo" || Boolean(profile?.emergency_tracking_active),
        coordsOverride: coords
      });

      if (!updated) {
        console.warn("[Los58SOS] Location state update failed before alert insert");
        setError(
          "No se pudo preparar tu ubicacion para el SOS. Intentalo nuevamente."
        );
        return false;
      }

      console.log("[Los58SOS] Creating sos_alert");
      const { data, error: alertError } = await supabase
        .from("sos_alerts")
        .insert({
          user_id: userId,
          full_name: profile?.full_name,
          username: profile?.username,
          bike_model: profile?.bike_model,
          city: profile?.city,
          emergency_contact: profile?.emergency_contact,
          emergency_type: emergencyType,
          emergency_details:
            emergencyType === "Otros" ? emergencyDetails?.trim() || null : null,
          medical_summary: buildSosMedicalSummary(latestMedicalProfile),
          latitude: coords.latitude,
          longitude: coords.longitude,
          status: "active",
          message: buildSosMessage({ emergencyType, emergencyDetails })
        })
        .select(alertSelect)
        .single();

      if (alertError) {
        console.error("[Los58SOS] Supabase sos_alert insert failed", alertError);
        setError("No se pudo crear la alerta SOS. Intentalo nuevamente.");
        return false;
      }

      console.log("[Los58SOS] sos_alert created", { alertId: data.id });
      setRawAlerts((current) => [data, ...current]);
      setSosFeedback(
        `SOS enviado por ${emergencyType.toLowerCase()}. Tu ubicacion fue compartida con la comunidad.`
      );
      startTracking();
      try {
        await withTimeout(
          notifyPushEvent({
            type: "new_sos",
            alertId: data.id
          }),
          8000,
          "El SOS fue creado, pero la notificacion push tardo demasiado."
        );
        console.log("[Los58SOS] Push event sent", { alertId: data.id });
      } catch (pushError) {
        console.warn("[Los58SOS] Push event failed after SOS creation", pushError);
      }
      return true;
    } catch (sosError) {
      const messageText =
        sosError instanceof Error
          ? sosError.message
          : "No se pudo activar la alerta SOS.";
      console.error("[Los58SOS] SOS flow failed", sosError);
      setError(messageText);
      return false;
    } finally {
      console.log("[Los58SOS] SOS flow finished");
      setSosLoading(false);
    }
  }

  async function updateAlertStatus(
    alertId: string,
    status: "resolved" | "cancelled"
  ) {
    if (!userId || alertUpdatingId) {
      return false;
    }

    setAlertUpdatingId(alertId);
    setError(null);

    const { data, error: alertError } = await supabase
      .from("sos_alerts")
      .update({
        status,
        resolved_at: new Date().toISOString()
      })
      .eq("id", alertId)
      .eq("user_id", userId)
      .select(alertSelect)
      .single();

    if (alertError) {
      setError(alertError.message);
      setAlertUpdatingId(null);
      return false;
    }

    setRawAlerts((current) =>
      current.map((alert) => (alert.id === alertId ? data : alert))
    );

    const hasAnotherActiveOwnAlert = rawAlerts.some(
      (alert) =>
        alert.id !== alertId && alert.user_id === userId && alert.status === "active"
    );

    if (!hasAnotherActiveOwnAlert) {
      const keepMonitoring =
        Boolean(profileRef.current?.continuous_monitoring_enabled) ||
        Boolean(profileRef.current?.emergency_tracking_active);
      const { data: nextProfile, error: profileError } = await supabase
        .from("profiles")
        .update({
          emergency_state: keepMonitoring ? "normal" : "normal"
        })
        .eq("id", userId)
        .select(profileSelect)
        .single();

      if (!profileError) {
        setProfile(nextProfile);
      }
    }

    setAlertUpdatingId(null);
    await loadActiveRiders();
    if (status === "resolved") {
      await notifyPushEvent({
        type: "resolved",
        alertId
      });
    }
    return true;
  }

  async function respondToAlert(alertId: string) {
    if (!userId || responseSubmittingAlertId) {
      return false;
    }

    const targetAlert = rawAlerts.find((alert) => alert.id === alertId);

    if (!targetAlert || targetAlert.user_id === userId || targetAlert.status !== "active") {
      return false;
    }

    setResponseSubmittingAlertId(alertId);
    setError(null);

    const helperName =
      profile?.full_name?.trim() || profile?.username?.trim() || "Motero Los+58";
    const { data, error: responseError } = await supabase
      .from("sos_responses")
      .upsert(
        {
          sos_alert_id: alertId,
          helper_user_id: userId,
          helper_name: helperName,
          status: "on_the_way"
        },
        { onConflict: "sos_alert_id,helper_user_id" }
      )
      .select(responseSelect)
      .single();

    if (responseError) {
      setError(responseError.message);
      setResponseSubmittingAlertId(null);
      return false;
    }

    setResponses((current) => {
      if (current.some((response) => response.id === data.id)) {
        return current.map((response) => (response.id === data.id ? data : response));
      }

      return [...current, data];
    });
    setResponseSubmittingAlertId(null);
    await notifyPushEvent({
      type: "response",
      alertId
    });
    return true;
  }

  async function updateProfile(values: ProfileFormValues) {
    if (!userId || profileSaving) {
      return false;
    }

    setProfileSaving(true);
    setError(null);

    const payload = {
      id: userId,
      full_name: values.full_name.trim() || null,
      username: values.username.trim() || null,
      bike_model: values.bike_model.trim() || null,
      city: values.city.trim() || null,
      emergency_contact: values.emergency_contact.trim() || null
    };

    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select(profileSelect)
      .single();

    if (updateError) {
      setError(updateError.message);
      setProfileSaving(false);
      return false;
    }

    setProfile(data);
    setProfileSaving(false);
    await loadActiveRiders();
    return true;
  }

  async function updateMedicalProfile(values: MedicalProfileFormValues) {
    if (!userId || medicalProfileSaving) {
      return false;
    }

    setMedicalProfileSaving(true);
    setError(null);

    const payload = {
      user_id: userId,
      blood_type: values.blood_type || null,
      allergies: values.allergies.trim() || null,
      medical_conditions: values.medical_conditions.trim() || null,
      medications: values.medications.trim() || null,
      notes: values.notes.trim() || null,
      emergency_contact_name: values.emergency_contact_name.trim() || null,
      emergency_contact_phone: values.emergency_contact_phone.trim() || null,
      secondary_contact_name: values.secondary_contact_name.trim() || null,
      secondary_contact_phone: values.secondary_contact_phone.trim() || null,
      insurance_info: values.insurance_info.trim() || null,
      preferred_hospital: values.preferred_hospital.trim() || null,
      show_in_sos: values.show_in_sos
    };

    const { data, error: medicalError } = await supabase
      .from("medical_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select(medicalProfileSelect)
      .single();

    if (medicalError) {
      setError(medicalError.message);
      setMedicalProfileSaving(false);
      return false;
    }

    setMedicalProfile(data);
    setMedicalProfileSaving(false);
    return true;
  }

  function clearSosFeedback() {
    setSosFeedback(null);
  }

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setMedicalProfile(null);
      setActiveRiders([]);
      setRawAlerts([]);
      setResponses([]);
      setLatestPosition(null);
      stopTracking();
      return;
    }

    loadProfile();
    loadMedicalProfile();
    loadActiveRiders();
    loadAlerts();
    loadResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const alertChannel = supabase
      .channel("sos-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sos_alerts"
        },
        (payload) => {
          const newAlert = payload.new as SosAlert;

          setRawAlerts((current) => {
            if (current.some((alert) => alert.id === newAlert.id)) {
              return current;
            }

            return [newAlert, ...current];
          });

          if (newAlert.status === "active") {
            setSosAlertEvents((current) => {
              if (current.some((alert) => alert.id === newAlert.id)) {
                return current;
              }

              return [newAlert, ...current].slice(0, 20);
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sos_alerts"
        },
        (payload) => {
          const updatedAlert = payload.new as SosAlert;

          setRawAlerts((current) => {
            const exists = current.some((alert) => alert.id === updatedAlert.id);

            if (!exists) {
              return [updatedAlert, ...current];
            }

            return current.map((alert) =>
              alert.id === updatedAlert.id ? updatedAlert : alert
            );
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "sos_alerts"
        },
        (payload) => {
          const deletedAlert = payload.old as Pick<SosAlert, "id">;
          setRawAlerts((current) =>
            current.filter((alert) => alert.id !== deletedAlert.id)
          );
        }
      )
      .subscribe();

    const ridersChannel = supabase
      .channel("live-riders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles"
        },
        (payload) => {
          const changedProfile = payload.new as Partial<Profile>;

          if (changedProfile.id === userId) {
            loadProfile();
          }

          loadActiveRiders();
        }
      )
      .subscribe();

    const medicalChannel = supabase
      .channel("medical-profile")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medical_profiles"
        },
        () => {
          loadMedicalProfile();
        }
      )
      .subscribe();

    const responsesChannel = supabase
      .channel("sos-responses")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sos_responses"
        },
        (payload) => {
          const newResponse = payload.new as SosResponse;

          setResponses((current) => {
            if (current.some((response) => response.id === newResponse.id)) {
              return current;
            }

            return [...current, newResponse];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sos_responses"
        },
        (payload) => {
          const updatedResponse = payload.new as SosResponse;

          setResponses((current) => {
            const exists = current.some((response) => response.id === updatedResponse.id);

            if (!exists) {
              return [...current, updatedResponse];
            }

            return current.map((response) =>
              response.id === updatedResponse.id ? updatedResponse : response
            );
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "sos_responses"
        },
        (payload) => {
          const deletedResponse = payload.old as Pick<SosResponse, "id">;
          setResponses((current) =>
            current.filter((response) => response.id !== deletedResponse.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(ridersChannel);
      supabase.removeChannel(medicalChannel);
      supabase.removeChannel(responsesChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId]);

  useEffect(() => {
    if (shouldReportLocation(profile)) {
      startTracking();
      return;
    }

    stopTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.is_on_route,
    profile?.emergency_state,
    profile?.continuous_monitoring_enabled,
    profile?.emergency_tracking_active
  ]);

  useEffect(() => () => stopTracking(), []);

  const alerts = useMemo<SosAlert[]>(() => {
    const responsesByAlert = responses.reduce<Record<string, SosResponse[]>>((acc, response) => {
      if (!acc[response.sos_alert_id]) {
        acc[response.sos_alert_id] = [];
      }

      acc[response.sos_alert_id].push(response);
      return acc;
    }, {});

    return rawAlerts.map((alert) => {
      const alertResponses = responsesByAlert[alert.id] ?? [];

      return {
        ...alert,
        response_count: alertResponses.length,
        helper_names: alertResponses
          .map((response) => response.helper_name)
          .filter((value): value is string => Boolean(value)),
        latest_response_at: alertResponses.length
          ? alertResponses.reduce(
              (latest, response) =>
                new Date(response.created_at).getTime() > new Date(latest).getTime()
                  ? response.created_at
                  : latest,
              alertResponses[0].created_at
            )
          : null,
        current_user_response_status: alertResponses.some(
          (response) =>
            response.helper_user_id === userId && response.status === "on_the_way"
        )
          ? "on_the_way"
          : null
      };
    });
  }, [rawAlerts, responses, userId]);

  const activeSosAlert =
    alerts.find((alert) => alert.user_id === userId && alert.status === "active") || null;

  const notificationEvents = useMemo<NotificationEvent[]>(() => {
    const events: NotificationEvent[] = [];

    alerts.forEach((alert) => {
      const city = alert.city ? ` - ${alert.city}` : "";

      if (alert.status === "active") {
        events.push({
          id: `new-sos-${alert.id}`,
          alert_id: alert.id,
          kind: "new_sos",
          title: formatAlertTitle(alert),
          subtitle: `${getEmergencyLabel(alert.emergency_type)}${city}`,
          timestamp: alert.created_at,
          emergency_type: alert.emergency_type,
          actor_user_id: alert.user_id
        });
      }

      if ((alert.response_count ?? 0) > 0) {
        events.push({
          id: `response-${alert.id}-${alert.response_count}`,
          alert_id: alert.id,
          kind: "response",
          title: `${alert.response_count} ${alert.response_count === 1 ? "motero en camino" : "moteros en camino"}`,
          subtitle: formatAlertTitle(alert),
          timestamp: alert.latest_response_at || alert.created_at,
          emergency_type: alert.emergency_type,
          actor_user_id: null
        });
      }

      if (alert.status !== "active" && alert.resolved_at) {
        events.push({
          id: `resolved-${alert.id}-${alert.resolved_at}`,
          alert_id: alert.id,
          kind: "resolved",
          title: alert.status === "cancelled" ? "SOS cancelado" : "SOS resuelto",
          subtitle: formatAlertTitle(alert),
          timestamp: alert.resolved_at,
          emergency_type: alert.emergency_type,
          actor_user_id: alert.user_id
        });
      }
    });

    return events.sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    );
  }, [alerts]);

  const value = useMemo<RoutePresenceContextValue>(
    () => ({
      isAuthenticated,
      currentUserId: userId,
      profile,
      medicalProfile,
      activeRiders,
      alerts,
      notificationEvents,
      sosAlertEvents,
      activeSosAlert,
      isOnRoute: Boolean(profile?.is_on_route),
      latestPosition,
      loading,
      tracking,
      sosLoading,
      alertUpdatingId,
      responseSubmittingAlertId,
      profileSaving,
      medicalProfileSaving,
      error,
      sosFeedback,
      toggleRoute,
      toggleContinuousMonitoring,
      toggleEmergencyTracking,
      triggerSos,
      updateAlertStatus,
      respondToAlert,
      updateProfile,
      updateMedicalProfile,
      refreshProfile: loadProfile,
      refreshMedicalProfile: loadMedicalProfile,
      refreshAlerts: loadAlerts,
      refreshActiveRiders: loadActiveRiders,
      clearSosFeedback
    }),
    [
      activeRiders,
      alertUpdatingId,
      activeSosAlert,
      alerts,
      notificationEvents,
      sosAlertEvents,
      userId,
      error,
      isAuthenticated,
      latestPosition,
      loading,
      medicalProfile,
      medicalProfileSaving,
      profile,
      profileSaving,
      responseSubmittingAlertId,
      sosFeedback,
      sosLoading,
      tracking
    ]
  );

  return (
    <RoutePresenceContext.Provider value={value}>
      {children}
    </RoutePresenceContext.Provider>
  );
}

export function useRoutePresence() {
  const context = useContext(RoutePresenceContext);

  if (!context) {
    throw new Error("useRoutePresence must be used within RoutePresenceProvider");
  }

  return context;
}
