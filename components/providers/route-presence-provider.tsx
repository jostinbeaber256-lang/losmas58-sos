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
  Profile,
  ProfileFormValues,
  SosPayload,
  SosAlert,
  SosResponse
} from "@/lib/types";
import { getBrowserPosition } from "@/lib/geolocation";
import { createClient } from "@/lib/supabase/browser";

type RoutePresenceContextValue = {
  currentUserId: string | null;
  isAuthenticated: boolean;
  profile: Profile | null;
  medicalProfile: MedicalProfile | null;
  activeRiders: ActiveRider[];
  alerts: SosAlert[];
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
  "id, username, full_name, bike_model, city, emergency_contact, is_on_route, emergency_state, latitude, longitude, location_updated_at, sharing_started_at, updated_at";

const riderSelect =
  "id, username, full_name, bike_model, city, emergency_contact, emergency_state, latitude, longitude, is_on_route, location_updated_at";

const alertSelect =
  "id, user_id, full_name, username, bike_model, city, emergency_contact, emergency_type, emergency_details, medical_summary, latitude, longitude, status, message, created_at, resolved_at";

const responseSelect =
  "id, sos_alert_id, helper_user_id, helper_name, status, created_at";

const medicalProfileSelect =
  "user_id, blood_type, allergies, medical_conditions, medications, notes, emergency_contact_name, emergency_contact_phone, secondary_contact_name, secondary_contact_phone, insurance_info, preferred_hospital, show_in_sos, updated_at";

function buildSosMessage({
  emergencyType,
  emergencyDetails
}: SosPayload) {
  if (emergencyType === "Otros") {
    return emergencyDetails?.trim() || "SOS activado desde Los+58.";
  }

  return `Emergencia reportada: ${emergencyType}. Se requiere apoyo inmediato en la ubicacion compartida.`;
}

function buildMedicalSummary(medicalProfile: MedicalProfile | null) {
  if (!medicalProfile?.show_in_sos) {
    return null;
  }

  const parts = [
    medicalProfile.blood_type ? `Sangre ${medicalProfile.blood_type}` : null,
    medicalProfile.allergies ? `Alergias: ${medicalProfile.allergies}` : null,
    medicalProfile.medical_conditions
      ? `Condiciones: ${medicalProfile.medical_conditions}`
      : null,
    medicalProfile.medications ? `Medicacion: ${medicalProfile.medications}` : null,
    medicalProfile.preferred_hospital
      ? `Hospital: ${medicalProfile.preferred_hospital}`
      : null,
    medicalProfile.emergency_contact_name || medicalProfile.emergency_contact_phone
      ? `Contacto medico: ${[
          medicalProfile.emergency_contact_name,
          medicalProfile.emergency_contact_phone
        ]
          .filter(Boolean)
          .join(" · ")}`
      : null,
    medicalProfile.notes ? `Notas: ${medicalProfile.notes}` : null
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
          .join(" · ")}`
      : null
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : null;
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

  const isAuthenticated = Boolean(session?.user.id);
  const userId = session?.user.id ?? null;

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
      const { data: nextProfile, error: profileError } = await supabase
        .from("profiles")
        .update({
          emergency_state: "normal"
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

  async function pushLocationUpdate({
    routeActive,
    clearLocation = false,
    emergencyState,
    coordsOverride
  }: {
    routeActive: boolean;
    clearLocation?: boolean;
    emergencyState?: "normal" | "emergency";
    coordsOverride?: Coordinates;
  }) {
    if (!userId) {
      return false;
    }

    const coords = clearLocation ? null : coordsOverride || (await getBrowserPosition());

    const payload = {
      is_on_route: routeActive,
      emergency_state: emergencyState ?? profile?.emergency_state ?? "normal",
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      location_updated_at: routeActive ? new Date().toISOString() : null,
      sharing_started_at:
        routeActive && !profile?.sharing_started_at
          ? new Date().toISOString()
          : routeActive
            ? profile?.sharing_started_at
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

    setTracking(false);
  }

  function startTracking() {
    if (intervalRef.current) {
      return;
    }

    setTracking(true);
    intervalRef.current = setInterval(async () => {
      try {
        await pushLocationUpdate({
          routeActive: true,
          emergencyState: profile?.emergency_state ?? "normal"
        });
      } catch (updateError) {
        const message =
          updateError instanceof Error
            ? updateError.message
            : "No se pudo refrescar tu posicion.";
        setError(message);
      }
    }, 10000);
  }

  async function toggleRoute() {
    if (!userId || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (profile?.is_on_route) {
        const success = await pushLocationUpdate({
          routeActive: false,
          clearLocation: true,
          emergencyState: "normal"
        });

        if (success) {
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

  async function triggerSos({ emergencyType, emergencyDetails }: SosPayload) {
    if (!userId || sosLoading) {
      return false;
    }

    setSosLoading(true);
    setError(null);
    setSosFeedback(null);

    try {
      const coords = await getBrowserPosition();
      const latestMedicalProfile = await getMedicalProfileForSos();

      const updated = await pushLocationUpdate({
        routeActive: true,
        emergencyState: "emergency",
        coordsOverride: coords
      });

      if (!updated) {
        setSosLoading(false);
        return false;
      }

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
        setError(alertError.message);
        setSosLoading(false);
        return false;
      }

      setRawAlerts((current) => [data, ...current]);
      setSosFeedback(
        `SOS enviado por ${emergencyType.toLowerCase()}. Tu ubicacion fue compartida con la comunidad.`
      );
      startTracking();
      return true;
    } catch (sosError) {
      const messageText =
        sosError instanceof Error
          ? sosError.message
          : "No se pudo activar la alerta SOS.";
      setError(messageText);
      return false;
    } finally {
      setSosLoading(false);
    }
  }

  function clearSosFeedback() {
    setSosFeedback(null);
  }

  async function respondToAlert(alertId: string) {
    if (!userId || responseSubmittingAlertId) {
      return false;
    }

    const targetAlert = rawAlerts.find((alert) => alert.id === alertId);

    if (!targetAlert || targetAlert.status !== "active" || targetAlert.user_id === userId) {
      return false;
    }

    const alreadyResponded = responses.some(
      (response) =>
        response.sos_alert_id === alertId &&
        response.helper_user_id === userId &&
        response.status === "on_the_way"
    );

    if (alreadyResponded) {
      return true;
    }

    setResponseSubmittingAlertId(alertId);
    setError(null);

    const helperName =
      profile?.full_name?.trim() ||
      profile?.username?.trim() ||
      session?.user.user_metadata?.full_name ||
      session?.user.email ||
      "Motero en ruta";

    const { data, error: responseError } = await supabase
      .from("sos_responses")
      .insert({
        sos_alert_id: alertId,
        helper_user_id: userId,
        helper_name: helperName,
        status: "on_the_way"
      })
      .select(responseSelect)
      .single();

    if (responseError) {
      if (responseError.code === "23505") {
        await loadResponses();
        setResponseSubmittingAlertId(null);
        return true;
      }

      setError(responseError.message);
      setResponseSubmittingAlertId(null);
      return false;
    }

    setResponses((current) => {
      const exists = current.some((response) => response.id === data.id);
      return exists ? current : [...current, data];
    });
    setResponseSubmittingAlertId(null);
    return true;
  }

  useEffect(() => {
    if (!userId) {
      stopTracking();
      setProfile(null);
      setMedicalProfile(null);
      setLatestPosition(null);
      setActiveRiders([]);
      setRawAlerts([]);
      setSosAlertEvents([]);
      setResponses([]);
      return;
    }

    loadProfile();
    loadMedicalProfile();
    loadActiveRiders();
    loadAlerts();
    loadResponses();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setRawAlerts([]);
      setSosAlertEvents([]);
      setResponses([]);
      return;
    }

    const alertChannel = supabase
      .channel("live-sos-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sos_alerts"
        },
        (payload) => {
          const newAlert = payload.new as SosAlert;

          if (newAlert.status === "active") {
            setSosAlertEvents((current) => {
              if (current.some((alert) => alert.id === newAlert.id)) {
                return current;
              }

              return [newAlert, ...current].slice(0, 20);
            });
          }

          loadAlerts();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sos_alerts"
        },
        () => {
          loadAlerts();
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
        () => {
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
          event: "*",
          schema: "public",
          table: "sos_responses"
        },
        () => {
          loadResponses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertChannel);
      supabase.removeChannel(ridersChannel);
      supabase.removeChannel(medicalChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (profile?.is_on_route) {
      startTracking();
      return;
    }

    stopTracking();
  }, [profile?.is_on_route, profile?.emergency_state]);

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
          ? alertResponses.reduce((latest, response) =>
              new Date(response.created_at).getTime() > new Date(latest).getTime()
                ? response.created_at
                : latest
            , alertResponses[0].created_at)
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

  const value = useMemo<RoutePresenceContextValue>(
    () => ({
      isAuthenticated,
      currentUserId: userId,
      profile,
      medicalProfile,
      activeRiders,
      alerts,
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
