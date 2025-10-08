import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ikosten.app',
  appName: 'Ikosten',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Permite peticiones HTTPS externas
    allowNavigation: [
      'https://ikosten-api-v3-e7cbdta5hndta2fc.eastus-01.azurewebsites.net'
    ]
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "phone", "apple.com"]
    }
  },
};

export default config;
