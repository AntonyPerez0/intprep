// The Android and iOS apps (docs/MOBILE.md) are this same site inside a native shell (Capacitor):
// the built files ship in the app and the page runs in the system WebView. Everything the page
// asks of the shell goes through this module, and all of it does nothing on the website. Capacitor
// and its plugins are loaded only inside the apps: on the website they stay out of the page's code
// (the service worker stores their few small files with the rest of the build, and that is all).

import type { CapacitorGlobal } from '@capacitor/core';

// The shell defines `window.Capacitor` before any of the page's code runs, and the website has no
// such object. Reading it (rather than importing `Capacitor` from @capacitor/core, which wraps the
// same object) keeps Capacitor's 12 kB out of the website's main bundle.
const shell = (): CapacitorGlobal | undefined => (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;

/** Whether the page runs inside the Android or iOS app (false on the website, installed or not). */
export const isNative = (): boolean => shell()?.isNativePlatform() === true;

const isAndroid = (): boolean => shell()?.getPlatform() === 'android';

/** A plugin that is missing or fails must never break the page. */
const quiet = (work: Promise<unknown>): void => {
  work.catch(() => {});
};

const DARK = '(prefers-color-scheme: dark)';

/** The theme on screen: App.tsx sets `data-theme` on <html>, and leaves it off to follow the system. */
function isDark(): boolean {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark' || (theme !== 'light' && window.matchMedia(DARK).matches);
}

/** Keep the clock and icons of the status bar readable on the app's theme, also when it changes. */
async function followTheme(): Promise<void> {
  const [{ StatusBar, Style }, { SystemBars, SystemBarsStyle }] = await Promise.all([import('@capacitor/status-bar'), import('@capacitor/core')]);
  const apply = () => {
    const dark = isDark();
    // "Dark" names the background: light text and icons on a dark page.
    quiet(StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }));
    // Android: the same for the navigation bar at the bottom, through Capacitor's own SystemBars
    // plugin. It also re-applies the style it remembers when the system theme changes, so it has
    // to be told too, or it would put the status bar back to the system's choice.
    if (isAndroid()) quiet(SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }));
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia(DARK).addEventListener('change', apply);
}

/**
 * Android's back button or gesture: one step back in the app's history, and out of the app from
 * where it started (the dashboard, or the welcome page a first visit is sent to). The app is put in
 * the background as the home button would, not closed, so coming back is instant.
 */
async function handleBackButton(): Promise<void> {
  if (!isAndroid()) return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else quiet(App.minimizeApp());
  });
}

/**
 * Take the launch screen away once React has put the first screen in `root`. (Not on the next
 * animation frame: Android does not draw the page, so may not run frames, while the launch screen
 * is up.) capacitor.config.ts sets how long it stays if this is never reached.
 */
async function hideSplash(root: HTMLElement): Promise<void> {
  const { SplashScreen } = await import('@capacitor/splash-screen');
  if (!root.hasChildNodes()) {
    await new Promise<void>((resolve) => {
      const seen = new MutationObserver(() => {
        seen.disconnect();
        resolve();
      });
      seen.observe(root, { childList: true });
    });
  }
  await SplashScreen.hide();
}

/** Set up the native shell. Call once, after React has been asked to render into `root`. */
export function initNative(root: HTMLElement): void {
  if (!isNative()) return;
  document.documentElement.classList.add('native'); // base.css: no scroll bars inside the apps
  quiet(followTheme());
  quiet(handleBackButton());
  quiet(hideSplash(root));
}

/**
 * A short vibration in the apps: 'tap' for a press, 'success' and 'error' for the result of a check.
 * Does nothing on the website.
 */
export function haptic(kind: 'tap' | 'success' | 'error'): void {
  if (!isNative()) return;
  quiet(
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle, NotificationType }) =>
      kind === 'tap' ? Haptics.impact({ style: ImpactStyle.Light }) : Haptics.notification({ type: kind === 'success' ? NotificationType.Success : NotificationType.Error }),
    ),
  );
}

/**
 * Hand a text file to the learner (the progress backup). On the website the browser downloads it.
 * A WebView has no downloads, so in the apps the file is written to the app's cache and offered
 * through the system share sheet (Save to Files, Drive, email…). Falls back to the download if a
 * plugin is missing or the sheet cannot open.
 */
export async function saveTextFile(name: string, text: string, type = 'application/json'): Promise<void> {
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  if (!isNative()) return download();
  try {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: name, files: [uri] });
  } catch (e) {
    // Closing the share sheet without choosing is not a failure.
    if (!/cancel/i.test(String((e as { message?: string } | null)?.message ?? e))) download();
  }
}
