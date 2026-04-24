import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MobileShell } from "@/components/mobile-shell";
import { RoutePresenceProvider } from "@/components/providers/route-presence-provider";
import { getCurrentSession } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Los+58",
  description: "PWA de seguridad y ruta para comunidad motera.",
  applicationName: "Los+58",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Los+58",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="es">
      <body>
        <RoutePresenceProvider session={session}>
          <MobileShell session={session}>{children}</MobileShell>
        </RoutePresenceProvider>
      </body>
    </html>
  );
}
