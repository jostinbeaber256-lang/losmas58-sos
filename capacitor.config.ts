import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.los58.sos",
  appName: "los-plus-58",
  webDir: ".next",
  server: {
    cleartext: false
  },
  android: {
    webContentsDebuggingEnabled: true
  }
};

export default config;
