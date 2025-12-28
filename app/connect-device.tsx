import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useAuth } from '../context/AuthContext';
import { connectToFastGoBox, requestBluetoothPermissions, scanForFastGoBox, stopScan } from '../lib/bluetooth';

export default function ConnectDeviceScreen() {
  const { setConnectedDevice, logout } = useAuth(); 
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);

  const handleStartScan = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
        Alert.alert("Permessi mancanti", "Impossibile usare il Bluetooth senza permessi.");
        return;
    }

    setIsScanning(true);
    setDevices([]); 
    
    scanForFastGoBox(
        (device) => {
            setDevices(prev => !prev.find(d => d.id === device.id) ? [...prev, device] : prev);
        },
        (error) => {
            console.log(error);
            setIsScanning(false);
        }
    );

    setTimeout(() => {
      stopScan();
      setIsScanning(false);
    }, 10000);
  };

  const handleConnect = async (device: Device) => {
    try {
      const connected = await connectToFastGoBox(device.id);
      if (connected) {
          Alert.alert("Successo", "Box FastGo collegato correttamente!");
          setConnectedDevice(connected);
      }
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile connettersi");
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E0F2FE', dark: '#1E293B' }}
      headerImage={<IconSymbol size={250} color="#3B82F6" name="cube.box" style={styles.headerImage}/>}>
      
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Connetti il Box</ThemedText>
      </ThemedView>

      <ThemedText>
        Per iniziare il turno, devi connetterti al tuo FastGo Box.
      </ThemedText>

      <TouchableOpacity 
        style={[styles.button, isScanning && styles.buttonDisabled]} 
        onPress={handleStartScan} 
        disabled={isScanning}
      >
        {isScanning ? <ActivityIndicator color="white" /> : <ThemedText style={styles.buttonText}>Cerca Box</ThemedText>}
      </TouchableOpacity>

      {devices.map(device => (
        <TouchableOpacity key={device.id} style={styles.deviceCard} onPress={() => handleConnect(device)}>
           <ThemedText>{device.name || "Box Sconosciuto"}</ThemedText>
           <ThemedText style={{fontSize: 10}}>{device.id}</ThemedText>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={logout} style={{marginTop: 50, alignItems: 'center'}}>
          <ThemedText style={{color: 'red'}}>Esci / Logout</ThemedText>
      </TouchableOpacity>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { color: '#3B82F6', bottom: -50, left: -30, position: 'absolute', opacity: 0.3 },
  titleContainer: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  deviceCard: { padding: 15, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 }
});