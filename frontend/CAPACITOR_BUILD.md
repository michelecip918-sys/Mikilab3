# MikiLab — Build Nativa (Capacitor) per l'uso hands-free in laboratorio

**Perché serve la build nativa.** In una semplice Web App i browser mobile **bloccano il microfono in background** e non permettono l'ascolto continuo a schermo spento o mentre si usano altre app. Per 10 panettieri con le **mani in pasta** e **cuffie Bluetooth**, l'unico modo tecnico affidabile è una **app nativa Android/iOS** (Capacitor) con:
- microfono in **background** (foreground service Android / background audio iOS),
- **wake-word / ascolto continuo** senza toccare il telefono,
- **instradamento audio per singolo operatore** sul MAC address dell'auricolare Bluetooth (plugin nativo).

Il codice web è **già predisposto**: `src/lib/nativeAudio.js` (`routeVoice`) rileva il plugin nativo (`window.Capacitor.Plugins.MikiAudio`) e, se presente, chiama `MikiAudio.speakTo({ text, lang, mac })`. In assenza del plugin (web) usa la sintesi nativa del browser + l'indicatore UI.

---

## 1) Prerequisiti (sul TUO computer, non in questa preview)
- Node 18+, Yarn
- **Android**: Android Studio + JDK 17
- **iOS**: macOS + Xcode + CocoaPods

## 2) Installazione Capacitor
```bash
cd frontend
yarn add @capacitor/core
yarn add -D @capacitor/cli
yarn add @capacitor/android @capacitor/ios
# build web (CRA → cartella build/, già impostata in capacitor.config.json)
yarn build
# inizializza le piattaforme native
npx cap add android
npx cap add ios
npx cap sync
```

> `capacitor.config.json` è già presente (appId `com.mikilab.app`, webDir `build`).

## 3) Aprire i progetti nativi
```bash
npx cap open android   # Android Studio
npx cap open ios       # Xcode
```

## 4) Permessi
**Android** `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
```
**iOS** `ios/App/App/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key><string>Comandi vocali hands-free in laboratorio</string>
<key>NSBluetoothAlwaysUsageDescription</key><string>Instradamento audio agli auricolari della squadra</string>
<key>UIBackgroundModes</key><array><string>audio</string></array>
```

---

## 5) Native Audio Plugin — spec `MikiAudio`
Plugin custom da implementare (registra `MikiAudio` in `window.Capacitor.Plugins`). Interfaccia attesa dal web (`nativeAudio.js`):

```ts
interface MikiAudioPlugin {
  // TTS instradato su UN auricolare specifico (per-operatore)
  speakTo(opts: { text: string; lang: string; mac: string; persona?: string }): Promise<void>;
  // (facoltativi, per estensione)
  listBluetoothDevices(): Promise<{ devices: { name: string; mac: string }[] }>;
  startBackgroundListening(opts: { wakeWord: string; lang: string }): Promise<void>;
  stopBackgroundListening(): Promise<void>;
  // emette eventi 'wake' con { command } al riconoscimento della wake-word
}
```
- **Android**: `TextToSpeech` + `setPreferredDevice(AudioDeviceInfo)` selezionando il device BT via MAC; ascolto in background con `SpeechRecognizer` dentro un **Foreground Service**.
- **iOS**: `AVSpeechSynthesizer` + `AVAudioSession` con route sul device BT; ascolto con `SFSpeechRecognizer` e background audio.

L'app associa MAC ↔ operatore nella sezione **Turni di Lavoro** (campo auricolare). Quando `ShiftScheduler`/comandi vocali chiamano `routeVoice({ operator })`, in nativo l'audio va **solo** all'auricolare di quell'operatore.

## 6) Ciclo di sviluppo
```bash
yarn build && npx cap sync   # dopo ogni modifica web
```

## 7) Note
- La preview web (Emergent) continua a funzionare come demo: voce del dispositivo + indicatore a schermo di chi riceve.
- La distribuzione avviene tramite Play Store / App Store (o APK interno per il laboratorio).
