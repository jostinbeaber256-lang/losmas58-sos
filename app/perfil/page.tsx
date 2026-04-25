import { MedicalProfileCard } from "@/components/medical-profile-card";
import { ProfileForm } from "@/components/profile-form";
import { PushNotificationCard } from "@/components/push-notification-card";
import { ScreenHeader } from "@/components/screen-header";

export default function ProfilePage() {
  return (
    <main className="space-y-6">
      <ScreenHeader
        eyebrow="Perfil"
        title="Tu identidad en carretera"
        description="Edita aqui los datos reales que la app usara en el mapa, el SOS y tu presencia en ruta."
      />
      <PushNotificationCard />
      <MedicalProfileCard />
      <ProfileForm />
    </main>
  );
}
