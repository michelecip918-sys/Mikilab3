export interface HeadsetDevice {
  id: string;
  name: string;
  connected: boolean;
  operatorId?: string;
}

export interface BluetoothAudioPlugin {
  /** Elenca le cuffie/headset Bluetooth accoppiate (profilo HFP). */
  listDevices(): Promise<{ devices: HeadsetDevice[] }>;

  /**
   * Instrada l'audio dell'assistente (voce/TTS + microfono) verso una cuffia BT
   * specifica, associandola all'operatore. Se deviceId è vuoto usa l'ultima cuffia
   * connessa. Avvia automaticamente il canale SCO per l'ascolto hands-free.
   */
  connect(options: { operatorId?: string; deviceId?: string }): Promise<{ ok: boolean; device?: HeadsetDevice }>;

  /** Avvia il canale SCO (voce full-duplex) sulla cuffia corrente. */
  startSco(): Promise<void>;

  /** Ferma il canale SCO e ripristina l'uscita audio di default. */
  stopSco(): Promise<void>;

  /** Permessi runtime (BLUETOOTH_CONNECT / microfono) necessari al routing. */
  requestPermissions(): Promise<{ granted: boolean }>;

  /** Notifica di cambio stato cuffia (connessa/disconnessa/SCO attivo). */
  addListener(
    eventName: 'headsetStateChanged',
    listenerFunc: (state: { device?: HeadsetDevice; scoActive: boolean }) => void,
  ): Promise<{ remove: () => void }>;
}
