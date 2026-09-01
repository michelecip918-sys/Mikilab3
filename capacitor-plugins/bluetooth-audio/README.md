# @mikilab/bluetooth-audio

Plugin Capacitor per il **routing audio Bluetooth (HFP/SCO) per-operatore** dell'assistente vocale hands-free di MikiLab. Instrada TTS (voce dell'assistente) e microfono verso l'auricolare Bluetooth associato all'operatore, così ogni panettiere sente e parla con "Ehi Lab" sulle proprie cuffie.

> Il browser non può instradare l'audio verso una cuffia BT specifica (è compito dell'OS). Questo plugin fornisce il routing reale nelle build native Android/iOS; su web c'è un fallback no-op.

## Installazione (nel progetto Capacitor)
```bash
npm i ./capacitor-plugins/bluetooth-audio
npx cap sync
```

### Permessi
- **Android** (`AndroidManifest.xml`): `BLUETOOTH_CONNECT`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`.
- **iOS** (`Info.plist`): `NSMicrophoneUsageDescription`, `NSBluetoothAlwaysUsageDescription`, background mode `audio`.

## Uso (JS)
```js
import { BluetoothAudio } from '@mikilab/bluetooth-audio';

await BluetoothAudio.requestPermissions();
const { devices } = await BluetoothAudio.listDevices();
await BluetoothAudio.connect({ operatorId: 'michele', deviceId: devices[0]?.id });
// ...poi l'assistente parla/ascolta sulla cuffia dell'operatore
await BluetoothAudio.startSco();
```

Nel frontend MikiLab il ponte è `src/lib/nativeAudio.js`, con fallback web automatico. Il **tasto Cuffie** (alto contrasto) nella vista "Schede di Produzione" chiama `connectHeadset()` per la connessione rapida hands-free.

## API
- `listDevices()` → cuffie HFP accoppiate.
- `connect({ operatorId, deviceId })` → instrada l'audio + avvia SCO.
- `startSco()` / `stopSco()` → gestione canale voce full-duplex.
- `requestPermissions()` → permessi runtime BT + microfono.
- `addListener('headsetStateChanged', cb)` → stato cuffia/SCO.
