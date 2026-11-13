import type { CapacitorConfig } from '@capacitor/cli';

// The Android and iOS apps (docs/MOBILE.md): the built site (dist/) is copied into each app and
// served from it, at https://localhost on Android and capacitor://localhost on iOS.
//
// Progress is kept in localStorage, which belongs to that address. Changing `appId`, or setting
// `server.androidScheme`, `server.iosScheme` or `server.hostname`, after people have installed the
// app would start them from zero.
const config: CapacitorConfig = {
  appId: 'io.github.antonyperez0.intprep',
  appName: 'IntPrep',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      // src/lib/native.ts hides the launch screen as soon as the first screen is drawn. The
      // duration is only the upper limit, for a page that never gets that far.
      launchShowDuration: 5000,
      launchAutoHide: true,
    },
    SystemBars: {
      // index.html asks for viewport-fit=cover: saying so here saves a layout jump on Android.
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
