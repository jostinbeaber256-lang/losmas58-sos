import { LiveMap } from "@/components/live-map";
import { ScreenHeader } from "@/components/screen-header";

export default function MapPage() {
  return (
    <main className="space-y-6">
      <ScreenHeader
        eyebrow="Mapa en vivo"
        title="Tu peloton en tiempo real"
        description="Mapa mobile first con tu ubicacion, companeros activos y actualizacion automatica mientras vas en ruta."
      />
      <LiveMap />
    </main>
  );
}
