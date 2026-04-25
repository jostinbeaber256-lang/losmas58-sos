import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.los58.sos',
  appName: 'los-plus-58',
  webDir: 'www',
  server: {
    url: 'https://losmas58-sos-5dal.vercel.app/',
    cleartext: false
  }
};

export default config;