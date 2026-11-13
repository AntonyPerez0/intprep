# Mobile apps (Android and iOS)

The Android and iOS apps are the website inside a native shell. [Capacitor](https://capacitorjs.com) 8 copies the built
site (`dist/`) into each app, and the app shows it in the system WebView. There is one codebase: a change to the site
reaches the apps the next time they are built.

Nothing is published to a store yet. Today you can build a debug APK for Android in GitHub Actions and run the iOS app
from a Mac.

## How it fits together

| Path | What it is |
| --- | --- |
| `capacitor.config.ts` | App id (`io.github.antonyperez0.intprep`), name, and plugin settings |
| `android/` | Android Studio project (Gradle). `MainActivity.java` and `res/` are ours, the rest is Capacitor's template |
| `ios/` | Xcode project. Capacitor and its plugins come in through Swift Package Manager, so there is no CocoaPods |
| `src/lib/native.ts` | Everything the page asks of the shell: status bar, Android back button, launch screen, haptics |
| `assets/` | Source images for the icons and launch screens |
| `.github/workflows/mobile.yml` | Builds both apps, by hand or on a `v*` tag |

`npx cap sync` copies `dist/` into `android/app/src/main/assets/public` and `ios/App/App/public` and writes the plugin
lists. Those copies and the build output are ignored by git (`android/.gitignore`, `ios/.gitignore`), so always build
and sync before opening a native project.

What differs from the website:

- The files are in the app, so it works offline from the first launch, Python included. The service worker is not
  registered. New content needs a new build of the app.
- No scroll bars: the shells turn off the WebView's own (`MainActivity.java`, `AppViewController` in
  `SceneDelegate.swift`) and `html.native` in `base.css` hides the ones inside the page.
- The page is served at `https://localhost` on Android and `capacitor://localhost` on iOS. Progress is in
  `localStorage` under that address, so **progress in the app is separate from progress on the website** and from the
  other platform. Changing the app id, the scheme or the hostname later would reset everyone's progress.
- `isNative()` in `src/lib/native.ts` is true only inside the apps. On the website the module does nothing, and
  Capacitor's code is not part of the page's main bundle.
- Phones are locked to portrait. Tablets rotate.
- iOS 16.4 is the minimum, the same as the website asks of Safari. Android 7 (API 24) is the minimum, with a WebView
  from 2023 or later.

Requirements, from Capacitor 8: Node 22 or later, JDK 21 and Android Studio 2025.2.1 or later for Android, Xcode 26
or later for iOS.

## Commands

```bash
npm run cap:sync      # build the site, then copy it into both native projects
npm run cap:android   # the same, then open Android Studio
npm run cap:ios       # the same, then open Xcode (Mac only)
npm run cap:assets    # regenerate icons and launch screens from assets/
```

## Android: install the debug APK on a phone

1. On GitHub open **Actions → Mobile apps → Run workflow** and run it on the default branch. It takes a few minutes.
2. Open the finished run. Under **Artifacts** download `intprep-android-debug-apk` and unzip it to get
   `app-debug.apk`.
3. Send the file to the phone (USB, Drive, email) and open it there. Android asks once to allow installs from the app
   you opened it with (**Install unknown apps**). Play Protect may also ask before it installs an app it does not
   know.

Every workflow run signs the APK with the same test key, so a newer build installs over an older one and the
progress saved in the app survives. The key is the repository secret `ANDROID_TEST_KEYSTORE_BASE64` (a PKCS12 keystore,
base64; alias `androiddebugkey`, password `android`), and the workflow prints the signing certificate after the build.
Its SHA-256 fingerprint is `E2:2A:1F:D3:32:3E:64:DC:07:C4:83:22:8D:2B:0C:68:E7:73:68:E5:75:42:5C:49:42:7A:B4:B6:D9:DB:1D:CC`.
It is a test key only: a Play Store release needs its own upload key, kept somewhere safe. A build made on a computer
(Android Studio) is signed with that computer's own debug key, so it will not install over a workflow build, or the
other way round, without uninstalling first (which deletes the progress saved in the app).

To run from a computer instead: install Android Studio, run `npm ci && npm run cap:android`, then press Run with a
phone connected (USB debugging on) or an emulator.

## iOS: run on the simulator or an iPhone

This needs a Mac with Xcode 26 or later.

```bash
npm ci && npm run build && npx cap sync ios && npx cap open ios
```

- **Simulator**: pick an iPhone simulator at the top of the Xcode window and press Run. No Apple account is needed.
- **Your iPhone**: plug it in and pick it as the destination. In the **App** target, under **Signing & Capabilities**,
  choose your team; a free Apple ID works (add it in Xcode → Settings → Accounts). On the phone turn on **Settings →
  Privacy & Security → Developer Mode**, and after the first install trust yourself under **Settings → General → VPN &
  Device Management**.

With a free Apple ID the app stops opening after 7 days. Run it again from Xcode to renew it; the progress stays as
long as the app is not deleted. A free account can also keep only a few such apps installed at once.

The workflow's iOS job builds for the simulator without signing, to prove the project compiles. Its artifact,
`intprep-ios-simulator-app`, runs only on a Mac simulator (`xcrun simctl install booted App.app`), not on a phone.

## Icons and launch screens

The sources are five PNG files in `assets/`:

| File | Size | Used for |
| --- | --- | --- |
| `icon-only.png` | 1024×1024, no transparency, no rounded corners | iOS icon, old Android icon |
| `icon-foreground.png` | 1024×1024, transparent background | Android adaptive icon, front layer |
| `icon-background.png` | 1024×1024, no transparency | Android adaptive icon, back layer |
| `splash.png` | 2732×2732, logo small in the middle | Launch screen, light |
| `splash-dark.png` | 2732×2732 | Launch screen, dark |

Replace them and run `npm run cap:assets`. It rewrites the images under `android/app/src/main/res/` and
`ios/App/App/Assets.xcassets/`; commit the result. The script passes `--ios --android` so the website's own icons in
`public/` are left alone.

The current files are placeholders drawn from `public/icon.svg`. Android cuts the adaptive icon to a circle or a
rounded square depending on the phone, so keep what matters in the middle two thirds.

The page colour is also written in `android/app/src/main/res/values/colors.xml` and `values-night/colors.xml`
(`appBackground`: the launch screen's background and the colour behind the system bars). Keep it equal to `--canvas`
in `src/styles/base.css`.

## Releasing to the stores, later

Both stores need a privacy policy URL, screenshots and a listing. The app id `io.github.antonyperez0.intprep` is
permanent once an app is published under it, on both stores.

**Google Play**

- A developer account: 25 USD, once. New personal accounts must run a closed test with at least 12 testers for 14
  days before they can publish to everyone.
- A signing keystore that you create once and never lose (`.jks`; these are in `.gitignore`), and a release build as
  an AAB: `./gradlew bundleRelease` in `android/` with a signing config.
- A higher `versionCode` in `android/app/build.gradle` for every upload.

**Apple App Store**

- The Apple Developer Program: 99 USD a year. It also removes the 7-day limit.
- Signing with that team in Xcode, then **Product → Archive** and upload to App Store Connect. TestFlight shares the
  build with testers before review.
- A higher build number (`CURRENT_PROJECT_VERSION` in Xcode) for every upload, and a new version
  (`MARKETING_VERSION`) for every release.
- Apple can reject apps it sees as a repackaged website (review guideline 4.2). Working offline and running code on
  the device are the arguments against that.

The workflow would need a signed release job for each store. It has none today.

## Not yet verified on a real device

The native projects were generated and configured on a Linux machine with no JDK, Android SDK or Xcode. The site
builds and `cap sync` runs, and the page-side code was exercised in desktop Chromium and WebKit with a stand-in for
the shell. Everything below still needs a first run of the workflow and then a look on a phone.

Builds:

- `./gradlew assembleDebug` and `xcodebuild` have never run on these projects. The first workflow run is the test.
- The iOS job relies on Xcode creating the `App` scheme by itself, since the project ships none. If the step
  **Show Xcode and the project's schemes** lists no scheme, open the project once in Xcode, tick **Shared** for the
  scheme and commit it.

Python ("Run my code"):

- That the module worker starts and loads Pyodide from `https://localhost` and `capacitor://localhost`. By reading
  Capacitor's source, Android serves `.mjs` and `.wasm` with the right types. iOS serves `.wasm` correctly and may or
  may not know `.mjs`. `src/lib/pyWorker.ts` covers both cases inside the apps: it loads a refused module from its
  text, and compiles the WebAssembly from memory if compiling while downloading fails. Both paths pass in desktop
  Chromium and WebKit against a server that sends the wrong types. Neither has run in a real WebView.
- Load time and memory on a cheap phone. There is no service worker cache in the apps, so every fresh worker compiles
  the 9.6 MB WebAssembly file again.
- iOS Lockdown Mode turns WebAssembly off. The screens that can will fall back to comparing code.

Screen and system:

- Safe areas: content against the notch, status bar, home indicator and Android's navigation bar, in both themes.
  `MainActivity` turns on edge-to-edge for all Android versions; WebViews older than 140 get padding from Capacitor
  instead.
- Status bar text colour following the theme, including when the theme is set in Profile against the system's. On an
  Android WebView older than 140 with such a forced theme, the strip behind the status bar keeps the system's colour.
- The launch screen: no flash before the first screen, right colours in dark mode. Android 12 and later show the app
  icon on the page colour instead of the full image.
- The Android back button and back gesture: one step back, then out of the app. It does not close an open dialog
  first.
- The keyboard over code inputs, on both platforms.
- Rotation: locked on phones, free on tablets.
- Links to LeetCode opening in the browser, not inside the app.

Known gaps:

- **Profile → Export backup** (and the crash screen's backup) writes the file to the app's cache and opens the system
  share sheet (`saveTextFile` in `src/lib/native.ts`, Filesystem and Share plugins). Written from the plugins'
  documentation; not yet tried on a phone. Import uses the file picker and should work.
- Haptics: `src/lib/sound.ts` calls `haptic()` for right and wrong answers, taps and end screens when the Haptics
  setting is on. Not yet felt on a phone.
- Progress in the app is not synced with the website.
- Capacitor's storage guide warns that the system can clear a WebView's `localStorage` when the device runs very low
  on space. Keeping a copy of the progress in native storage would remove that risk.
- `@capacitor/assets`, a development tool, pulls in a version of `uuid` that `npm audit` reports as moderate. It
  never runs in the apps or on the website.
