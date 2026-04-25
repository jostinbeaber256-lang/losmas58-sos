import { MedicalProfileCard } from "@/components/medical-profile-card";
import { ProfileForm } from "@/components/profile-form";
import { PushNotificationCard } from "@/components/push-notification-card";
import { HeartIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/solid";

export default function ProfilePage() {
  return (
    <main className="space-y-5 md:space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(32,211,238,0.18),transparent_34%),linear-gradient(145deg,rgba(18,27,43,0.98),rgba(6,10,20,0.96))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)] md:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-6 h-56 w-56 rounded-full bg-danger/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              <UserCircleIcon className="h-4 w-4" />
              Perfil motero
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-ink md:text-4xl">
              Tu identidad y seguridad en carretera.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted md:text-base">
              Mantén tus datos listos para ruta, SOS, notificaciones y ficha
              médica de emergencia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[300px]">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <ShieldCheckIcon className="mx-auto h-5 w-5 text-accent" />
              <p className="mt-2 text-sm font-semibold text-ink">Identidad</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Ruta y SOS
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <HeartIcon className="mx-auto h-5 w-5 text-danger" />
              <p className="mt-2 text-sm font-semibold text-ink">Emergencia</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Ficha médica
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <PushNotificationCard />
        <MedicalProfileCard />
      </section>

      <ProfileForm />
    </main>
  );
}
