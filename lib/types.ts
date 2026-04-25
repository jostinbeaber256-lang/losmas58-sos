export type Rider = {
  id: string;
  name: string;
  bike: string;
  status: string;
  distance: string;
};

export type SosAlert = {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  bike_model: string | null;
  city: string | null;
  emergency_contact: string | null;
  emergency_type: string | null;
  emergency_details: string | null;
  medical_summary: string | null;
  latitude: number;
  longitude: number;
  status: "active" | "resolved" | "cancelled";
  message: string | null;
  created_at: string;
  resolved_at: string | null;
  response_count?: number;
  helper_names?: string[];
  latest_response_at?: string | null;
  current_user_response_status?: "on_the_way" | null;
};

export type SosResponse = {
  id: string;
  sos_alert_id: string;
  helper_user_id: string;
  helper_name: string | null;
  status: "on_the_way";
  created_at: string;
};

export type NotificationEvent = {
  id: string;
  alert_id: string;
  kind: "new_sos" | "response" | "resolved";
  title: string;
  subtitle: string;
  timestamp: string;
  emergency_type: string | null;
  actor_user_id: string | null;
};

export type SosPayload = {
  emergencyType: string;
  emergencyDetails?: string | null;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bike_model: string | null;
  city: string | null;
  emergency_contact: string | null;
  is_admin: boolean;
  is_on_route: boolean;
  emergency_state: "normal" | "emergency";
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  sharing_started_at: string | null;
  updated_at: string;
};

export type ActiveRider = {
  id: string;
  username: string | null;
  full_name: string | null;
  bike_model: string | null;
  city: string | null;
  emergency_contact: string | null;
  emergency_state: "normal" | "emergency";
  latitude: number | null;
  longitude: number | null;
  is_on_route: boolean;
  location_updated_at: string | null;
};

export type ProfileFormValues = {
  full_name: string;
  username: string;
  bike_model: string;
  city: string;
  emergency_contact: string;
};

export type MedicalProfile = {
  user_id: string;
  blood_type: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  medications: string | null;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  secondary_contact_name: string | null;
  secondary_contact_phone: string | null;
  insurance_info: string | null;
  preferred_hospital: string | null;
  show_in_sos: boolean;
  updated_at: string;
};

export type MedicalProfileFormValues = {
  blood_type: string;
  allergies: string;
  medical_conditions: string;
  medications: string;
  notes: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  secondary_contact_name: string;
  secondary_contact_phone: string;
  insurance_info: string;
  preferred_hospital: string;
  show_in_sos: boolean;
};
