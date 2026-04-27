import { redirect } from "next/navigation";
import type { GroupRideEvent, MedicalProfile, RideParticipant, SosAlert } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bike_model: string | null;
  city: string | null;
  emergency_contact: string | null;
  is_admin: boolean;
  is_on_route: boolean;
  emergency_state: "normal" | "emergency";
  continuous_monitoring_enabled: boolean;
  emergency_tracking_active: boolean;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  monitoring_updated_at: string | null;
  emergency_tracking_started_at: string | null;
  updated_at: string;
  has_medical_profile?: boolean;
  has_push_enabled?: boolean;
  medical_profile?: MedicalProfile | null;
};

export type AdminResponse = {
  id: string;
  sos_alert_id: string;
  helper_user_id: string;
  helper_name: string | null;
  status: "on_the_way";
  created_at: string;
};

export type AdminAlert = SosAlert & {
  responses: AdminResponse[];
};

export type AdminRideData = {
  activeRide: GroupRideEvent | null;
  participants: RideParticipant[];
};

const adminProfileSelect =
  "id, username, full_name, bike_model, city, emergency_contact, is_admin, is_on_route, emergency_state, continuous_monitoring_enabled, emergency_tracking_active, latitude, longitude, location_updated_at, monitoring_updated_at, emergency_tracking_started_at, updated_at";

const adminAlertSelect =
  "id, user_id, full_name, username, bike_model, city, emergency_contact, emergency_type, emergency_details, medical_summary, latitude, longitude, status, message, created_at, resolved_at";

const adminGroupRideSelect =
  "id, name, description, meeting_point, starts_at, status, created_at";

const adminRideParticipantSelect =
  "id, event_id, user_id, full_name, username, bike_model, city, is_admin, attendance_status, live_route_enabled, current_lat, current_lng, last_seen_at, updated_at";

export function formatAdminDate(value: string | null) {
  if (!value) {
    return "Sin registro";
  }

  return new Date(value).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getAdminDisplayName(
  item: Pick<AdminProfile | AdminAlert, "full_name" | "username">
) {
  return item.full_name || item.username || "Sin nombre";
}

export async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, full_name, username, is_admin")
    .eq("id", user.id)
    .single<{ id: string; full_name: string | null; username: string | null; is_admin: boolean }>();

  if (error || !profile?.is_admin) {
    return {
      user,
      profile: profile ?? null,
      isAdmin: false
    };
  }

  return {
    user,
    profile,
    isAdmin: true
  };
}

export async function requireAdmin() {
  const context = await getAdminContext();

  if (!context.isAdmin) {
    return context;
  }

  return context;
}

export async function getAdminDashboardData() {
  const admin = createAdminClient();
  const [
    users,
    activeAlerts,
    resolvedAlerts,
    activeRiders,
    monitoredUsers,
    emergencyTrackingUsers,
    responses
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("sos_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("sos_alerts")
      .select("id", { count: "exact", head: true })
      .neq("status", "active"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_on_route", true),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("continuous_monitoring_enabled", true),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("emergency_tracking_active", true),
    admin
      .from("sos_responses")
      .select("id", { count: "exact", head: true })
      .eq("status", "on_the_way")
  ]);

  return {
    users: users.count ?? 0,
    activeAlerts: activeAlerts.count ?? 0,
    resolvedAlerts: resolvedAlerts.count ?? 0,
    activeRiders: activeRiders.count ?? 0,
    monitoredUsers: monitoredUsers.count ?? 0,
    emergencyTrackingUsers: emergencyTrackingUsers.count ?? 0,
    responses: responses.count ?? 0
  };
}

export async function getAdminRideData(): Promise<AdminRideData> {
  const admin = createAdminClient();
  const { data: activeRide, error: rideError } = await admin
    .from("group_rides")
    .select(adminGroupRideSelect)
    .eq("status", "active")
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle<GroupRideEvent>();

  if (rideError) {
    throw new Error(rideError.message);
  }

  if (!activeRide) {
    return {
      activeRide: null,
      participants: []
    };
  }

  const { data: participants, error: participantsError } = await admin
    .from("ride_participants")
    .select(adminRideParticipantSelect)
    .eq("event_id", activeRide.id)
    .order("updated_at", { ascending: false })
    .returns<RideParticipant[]>();

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  return {
    activeRide,
    participants: participants ?? []
  };
}

export async function getAdminUsers(search = "") {
  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select(adminProfileSelect)
    .order("updated_at", { ascending: false })
    .returns<AdminProfile[]>();

  if (error) {
    throw new Error(error.message);
  }

  const [{ data: medicalProfiles }, { data: pushSubscriptions }] = await Promise.all([
    admin
      .from("medical_profiles")
      .select(
        "user_id, blood_type, allergies, medical_conditions, medications, notes, emergency_contact_name, emergency_contact_phone, secondary_contact_name, secondary_contact_phone, insurance_info, preferred_hospital, show_in_sos, updated_at"
      )
      .returns<MedicalProfile[]>(),
    admin
      .from("push_subscriptions")
      .select("user_id")
      .eq("enabled", true)
      .returns<Array<{ user_id: string }>>()
  ]);

  const medicalProfilesByUser = new Map(
    (medicalProfiles ?? []).map((item) => [item.user_id, item])
  );
  const pushUserIds = new Set((pushSubscriptions ?? []).map((item) => item.user_id));
  const normalizedSearch = search.trim().toLowerCase();

  return (profiles ?? [])
    .filter((profile) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        profile.full_name,
        profile.username,
        profile.bike_model,
        profile.city
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    })
    .map((profile) => ({
      ...profile,
      has_medical_profile: medicalProfilesByUser.has(profile.id),
      has_push_enabled: pushUserIds.has(profile.id),
      medical_profile: medicalProfilesByUser.get(profile.id) ?? null
    }));
}

export async function getAdminAlerts({
  status,
  emergencyType
}: {
  status?: string;
  emergencyType?: string;
}) {
  const admin = createAdminClient();
  let query = admin
    .from("sos_alerts")
    .select(adminAlertSelect)
    .order("created_at", { ascending: false });

  if (status === "active" || status === "resolved" || status === "cancelled") {
    query = query.eq("status", status);
  }

  if (emergencyType && emergencyType !== "all") {
    query = query.eq("emergency_type", emergencyType);
  }

  const { data: alerts, error } = await query.returns<SosAlert[]>();

  if (error) {
    throw new Error(error.message);
  }

  const { data: responses, error: responsesError } = await admin
    .from("sos_responses")
    .select("id, sos_alert_id, helper_user_id, helper_name, status, created_at")
    .order("created_at", { ascending: true })
    .returns<AdminResponse[]>();

  if (responsesError) {
    throw new Error(responsesError.message);
  }

  const responsesByAlert = (responses ?? []).reduce<Record<string, AdminResponse[]>>(
    (acc, response) => {
      acc[response.sos_alert_id] = acc[response.sos_alert_id] ?? [];
      acc[response.sos_alert_id].push(response);
      return acc;
    },
    {}
  );

  return (alerts ?? []).map((alert) => ({
    ...alert,
    responses: responsesByAlert[alert.id] ?? []
  }));
}

export async function getAdminRoutes() {
  const users = await getAdminUsers();

  return users
    .filter((user) => user.is_on_route)
    .sort((left, right) => {
      const rightTime = right.location_updated_at
        ? new Date(right.location_updated_at).getTime()
        : 0;
      const leftTime = left.location_updated_at
        ? new Date(left.location_updated_at).getTime()
        : 0;

      return rightTime - leftTime;
    });
}
