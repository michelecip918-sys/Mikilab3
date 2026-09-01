import { WebPlugin } from '@capacitor/core';
import type { BluetoothAudioPlugin, HeadsetDevice } from './definitions';

// Fallback WEB: il browser NON può instradare l'audio verso una cuffia BT specifica
// (è compito del sistema operativo). Qui restituiamo stati coerenti e no-op, così l'app
// resta funzionante e delega il routing reale alla build nativa (Android/iOS).
export class BluetoothAudioWeb extends WebPlugin implements BluetoothAudioPlugin {
  async listDevices(): Promise<{ devices: HeadsetDevice[] }> {
    return { devices: [] };
  }
  async connect(): Promise<{ ok: boolean; device?: HeadsetDevice }> {
    return { ok: false };
  }
  async startSco(): Promise<void> {
    /* no-op su web */
  }
  async stopSco(): Promise<void> {
    /* no-op su web */
  }
  async requestPermissions(): Promise<{ granted: boolean }> {
    return { granted: false };
  }
}
