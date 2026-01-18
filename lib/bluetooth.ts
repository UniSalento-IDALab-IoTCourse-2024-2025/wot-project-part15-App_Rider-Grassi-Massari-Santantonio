import { Buffer } from 'buffer';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleError, BleManager, Device } from 'react-native-ble-plx';


export const FASTGO_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
export const FASTGO_CHAR_UUID    = '12345678-1234-5678-1234-56789abcdef1';


const bleManager = new BleManager();

// permessi
export const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
        
        const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
            result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
    }
    return true; 
};

// Funzione di Scansione
export const scanForFastGoBox = (
    onDeviceFound: (device: Device) => void,
    onError: (error: BleError) => void
) => {
    bleManager.startDeviceScan([FASTGO_SERVICE_UUID], null, (error, device) => {
        if (error) {
            onError(error);
            return;
        }
        if (device) {
            onDeviceFound(device);
        }
    });
};

export const stopScan = () => {
    bleManager.stopDeviceScan();
};

// Connessione e Handshake
export const connectToFastGoBox = async (deviceId: string, riderId: string): Promise<Device | null> => {
    try {
        stopScan();
        console.log(`[BLE] Connessione a ${deviceId}...`);
        
        const deviceConnection = await bleManager.connectToDevice(deviceId);
        await deviceConnection.discoverAllServicesAndCharacteristics();
        
        // Verifica handshake leggendo la caratteristica
        const characteristic = await deviceConnection.readCharacteristicForService(
            FASTGO_SERVICE_UUID,
            FASTGO_CHAR_UUID
        );
        
        const text = Buffer.from(characteristic.value!, 'base64').toString('utf-8');
        console.log(`[BLE] Messaggio handshake: ${text}`);

        if (text.includes("RiderBox")) {
            const idCommand = `RIDER_ID:${riderId}`;
            console.log(`[BLE] Invio Rider ID automatico: ${idCommand}`);
            
            await sendCommandToBox(deviceConnection, idCommand);
            return deviceConnection;
        } else {
            throw new Error("Dispositivo non riconosciuto (Handshake fallito)");
        }

    } catch (e: any) {
        console.error("[BLE] Errore connessione:", e);
        throw e;
    }
};

// Invio comandi generici
export const sendCommandToBox = async (device: Device, command: string): Promise<boolean> => {
    try {
        const base64Command = Buffer.from(command).toString('base64');
        console.log(`[BLE] Invio comando: ${command}`);

        await device.writeCharacteristicWithResponseForService(
            FASTGO_SERVICE_UUID,
            FASTGO_CHAR_UUID,
            base64Command
        );
        return true;
    } catch (e) {
        console.error("[BLE] Errore invio comando:", e);
        return false;
    }
};

// invio topic dell'ordine
export const sendOrderTopicToBox = async (device: Device | null, topic: string) => {
    if (!device) {
        console.warn("[BLE] Nessun dispositivo connesso per inviare il topic.");
        return;
    }
    const command = `TOPIC:${topic}`;
    await sendCommandToBox(device, command);
};


export const sendOrderCompletionWithDetails = async (
    device: Device | null, 
    orderId: string, 
    totalPrice: number, 
    clientId: string
) => {
    if (!device) {
        console.warn("[BLE] Nessun dispositivo connesso per finalizzare l'ordine.");
        return;
    }

    const command = `ORDER_COMPLETED:${orderId}|${totalPrice}|${clientId}`;
    
    await sendCommandToBox(device, command);
};