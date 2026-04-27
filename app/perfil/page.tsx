import { MedicalProfileCard } from "@/components/medical-profile-card";
import { ProfileForm } from "@/components/profile-form";
import { PushNotificationCard } from "@/components/push-notification-card";
import { SecurityMonitoringCard } from "@/components/security-monitoring-card";
import { HeartIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/solid";

export default function ProfilePage() {
  return (
    <main className="space-y-5 md:space-y-6">
      <section className="los-hero">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-danger/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="los-section-head los-section-head-center max-w-xl lg:items-start lg:text-left">
            <div className="los-chip los-chip-accent">
              <UserCircleIcon className="h-4 w-4" />
              Perfil motero
            </div>
            <h1 className="los-section-title max-w-2xl">
              Tu identidad y seguridad en carretera.
            </h1>
            <p className="los-section-copy max-w-xl">
              Manten tus datos listos para ruta, SOS, notificaciones y ficha
              medica de emergencia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[300px]">
            <div className="los-card-compact text-center">
              <ShieldCheckIcon className="mx-auto h-5 w-5 text-accent" />
              <p className="mt-2 text-sm font-semibold text-ink">Identidad</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Ruta y SOS
              </p>
            </div>
            <div className="los-card-compact text-center">
              <HeartIcon className="mx-auto h-5 w-5 text-danger" />
              <p className="mt-2 text-sm font-semibold text-ink">Emergencia</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Ficha medica
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SecurityMonitoringCard />
        <PushNotificationCard />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <MedicalProfileCard />
      </section>

      <ProfileForm />
    </main>
  );
}
