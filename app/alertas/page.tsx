"use client";

import { AlertPreview } from "@/components/alert-preview";
import { useRoutePresence } from "@/components/providers/route-presence-provider";
import { ScreenHeader } from "@/components/screen-header";

export default function AlertsPage() {
  const { alerts } = useRoutePresence();

  return (
    <main className="space-y-6">
      <ScreenHeader
        eyebrow="SOS activos"
        title="Alertas abiertas de la comunidad"
        description="Panel para responder rapido, priorizar cercania y coordinar apoyo entre moteros."
      />
      <AlertPreview alerts={alerts} expanded filterable />
    </main>
  );
}
