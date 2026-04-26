import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { AndroidLocationDebug } from "@/components/android-location-debug";
import { AndroidLocationTestButton } from "@/components/android-location-test-button";
import { MobileShell } from "@/components/mobile-shell";
import { RoutePresenceProvider } from "@/components/providers/route-presence-provider";

export const metadata: Metadata = {
  title: {
    default: "Los+58 SOS",
    template: "%s | Los+58 SOS"
  },
  description: "PWA de emergencia, ruta y apoyo en tiempo real para comunidad motera.",
  applicationName: "Los+58 SOS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    title: "Los+58 SOS",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Los+58 SOS",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#050816",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

// Static layout for Android APK build - no server-side data fetching
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <RoutePresenceProvider session={null}>
          <MobileShell session={null} initialIsAdmin={false}>
            {children}
          </MobileShell>
        </RoutePresenceProvider>
        <AndroidLocationDebug />
        <AndroidLocationTestButton />
      </body>
    </html>
  );
}
