import { MedicalProfileForm } from "@/components/medical-profile-form";
import { ScreenHeader } from "@/components/screen-header";

export default function MedicalProfilePage() {
  return (
    <main className="space-y-6">
      <ScreenHeader
        eyebrow="Ficha medica"
        title="Informacion clave para emergencias"
        description="Completa los datos medicos que podrian ayudar a atenderte mejor en un accidente o una situacion critica."
      />
      <MedicalProfileForm />
    </main>
  );
}
