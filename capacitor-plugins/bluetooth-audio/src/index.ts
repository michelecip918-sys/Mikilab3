import { registerPlugin } from '@capacitor/core';
import type { BluetoothAudioPlugin } from './definitions';

// Registra il plugin nativo. Su web usa il fallback in ./web.
const BluetoothAudio = registerPlugin<BluetoothAudioPlugin>('BluetoothAudio', {
  web: () => import('./web').then((m) => new m.BluetoothAudioWeb()),
});

export * from './definitions';
export { BluetoothAudio };
