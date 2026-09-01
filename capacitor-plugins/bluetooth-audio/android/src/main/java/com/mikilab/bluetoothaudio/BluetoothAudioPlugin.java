package com.mikilab.bluetoothaudio;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothHeadset;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.media.AudioManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONArray;

// Routing audio Bluetooth (HFP/SCO) per l'assistente vocale hands-free.
// Instrada TTS + microfono verso la cuffia BT dell'operatore e avvia il canale SCO.
@CapacitorPlugin(
    name = "BluetoothAudio",
    permissions = {
        @Permission(alias = "bt", strings = { "android.permission.BLUETOOTH_CONNECT" }),
        @Permission(alias = "mic", strings = { "android.permission.RECORD_AUDIO" })
    }
)
public class BluetoothAudioPlugin extends Plugin {

    private AudioManager audioManager;
    private BluetoothHeadset headsetProfile;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter != null) {
            adapter.getProfileProxy(getContext(), new BluetoothProfile.ServiceListener() {
                @Override public void onServiceConnected(int profile, BluetoothProfile proxy) {
                    if (profile == BluetoothProfile.HEADSET) headsetProfile = (BluetoothHeadset) proxy;
                }
                @Override public void onServiceDisconnected(int profile) {
                    if (profile == BluetoothProfile.HEADSET) headsetProfile = null;
                }
            }, BluetoothProfile.HEADSET);
        }
    }

    @PluginMethod
    public void listDevices(PluginCall call) {
        JSONArray arr = new JSONArray();
        if (headsetProfile != null) {
            for (BluetoothDevice d : headsetProfile.getConnectedDevices()) {
                JSObject o = new JSObject();
                o.put("id", d.getAddress());
                o.put("name", d.getName() != null ? d.getName() : d.getAddress());
                o.put("connected", true);
                arr.put(o);
            }
        }
        JSObject ret = new JSObject();
        ret.put("devices", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        // Instrada l'audio in modalità comunicazione verso la cuffia BT e avvia SCO.
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        audioManager.setBluetoothScoOn(true);
        audioManager.startBluetoothSco();
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void startSco(PluginCall call) {
        audioManager.setBluetoothScoOn(true);
        audioManager.startBluetoothSco();
        call.resolve();
    }

    @PluginMethod
    public void stopSco(PluginCall call) {
        audioManager.stopBluetoothSco();
        audioManager.setBluetoothScoOn(false);
        audioManager.setMode(AudioManager.MODE_NORMAL);
        call.resolve();
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        // La richiesta runtime effettiva è gestita dal ponte Capacitor tramite @Permission.
        JSObject ret = new JSObject();
        ret.put("granted", true);
        call.resolve(ret);
    }
}
