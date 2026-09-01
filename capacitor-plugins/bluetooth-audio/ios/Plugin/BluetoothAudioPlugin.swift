import Foundation
import Capacitor
import AVFoundation

// Routing audio Bluetooth (HFP) per l'assistente vocale hands-free su iOS.
// Usa AVAudioSession in modalità voiceChat con opzione allowBluetooth per instradare
// TTS + microfono verso l'auricolare Bluetooth dell'operatore.
@objc(BluetoothAudioPlugin)
public class BluetoothAudioPlugin: CAPPlugin {

    private let session = AVAudioSession.sharedInstance()

    @objc func listDevices(_ call: CAPPluginCall) {
        var devices: [[String: Any]] = []
        if let inputs = session.availableInputs {
            for input in inputs where input.portType == .bluetoothHFP {
                devices.append([
                    "id": input.uid,
                    "name": input.portName,
                    "connected": true
                ])
            }
        }
        call.resolve(["devices": devices])
    }

    @objc func connect(_ call: CAPPluginCall) {
        do {
            try session.setCategory(.playAndRecord, mode: .voiceChat,
                                     options: [.allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker])
            // Preferisci l'ingresso Bluetooth HFP se presente.
            if let bt = session.availableInputs?.first(where: { $0.portType == .bluetoothHFP }) {
                try session.setPreferredInput(bt)
            }
            try session.setActive(true)
            call.resolve(["ok": true])
        } catch {
            call.reject("Routing audio Bluetooth non riuscito: \(error.localizedDescription)")
        }
    }

    @objc func startSco(_ call: CAPPluginCall) {
        do { try session.setActive(true); call.resolve() }
        catch { call.reject(error.localizedDescription) }
    }

    @objc func stopSco(_ call: CAPPluginCall) {
        do { try session.setActive(false, options: .notifyOthersOnDeactivation); call.resolve() }
        catch { call.reject(error.localizedDescription) }
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            call.resolve(["granted": granted])
        }
    }
}
