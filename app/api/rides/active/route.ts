import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const groupRideSelect =
  "id, name, description, meeting_point, starts_at, status, created_at";
const rideParticipantSelect =
  "id, event_id, user_id, full_name, username, bike_model, city, avatar_url, is_admin, attendance_status, live_route_enabled, current_lat, current_lng, last_seen_at, updated_at";
const rideParticipantSelectWithoutAvatar =
  "id, event_id, user_id, full_name, username, bike_model, city, is_admin, attendance_status, live_route_enabled, current_lat, current_lng, last_seen_at, updated_at";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ activeRideEvent: null, rideParticipants: [] }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: activeRideEvent, error: rideError } = await admin
    .from("group_rides")
    .select(groupRideSelect)
    .eq("status", "active")
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (rideError) {
    return NextResponse.json({ error: rideError.message }, { status: 500 });
  }

  if (!activeRideEvent) {
    return NextResponse.json({ activeRideEvent: null, rideParticipants: [] });
  }

  let { data: rideParticipants, error: participantsError } = await admin
    .from("ride_participants")
    .select(rideParticipantSelect)
    .eq("event_id", activeRideEvent.id)
    .order("updated_at", { ascending: false });

  if (
    participantsError &&
    (participantsError.message.includes("avatar_url") ||
      participantsError.message.includes("schema cache"))
  ) {
    const fallback = await admin
      .from("ride_participants")
      .select(rideParticipantSelectWithoutAvatar)
      .eq("event_id", activeRideEvent.id)
      .order("updated_at", { ascending: false });

    rideParticipants = (fallback.data ?? []).map((participant) => ({
      ...participant,
      avatar_url: null
    }));
    participantsError = fallback.error;
  }

  if (participantsError) {
    return NextResponse.json({ error: participantsError.message }, { status: 500 });
  }

  return NextResponse.json({
    activeRideEvent,
    rideParticipants: rideParticipants ?? []
  });
}
