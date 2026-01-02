import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useAuth } from '../context/AuthContext';
import { connectToFastGoBox, requestBluetoothPermissions, scanForFastGoBox, stopScan } from '../lib/bluetooth';

export default function ConnectDeviceScreen() {
  const { setConnectedDevice, logout, user, isLoading } = useAuth(); 
  
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);


  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <ThemedText style={{ marginTop: 10 }}>Recupero profilo rider...</ThemedText>
      </View>
    );
  }

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
            // Evita duplicati nella lista
            setDevices(prev => !prev.find(d => d.id === device.id) ? [...prev, device] : prev);
        },
        (error) => {
            console.log(error);
            setIsScanning(false);
        }
    );

    // Stop scansione dopo 10 secondi
    setTimeout(() => {
      stopScan();
      setIsScanning(false);
    }, 10000);
  };

  const handleConnect = async (device: Device) => {

    if (!user?.id) {
        Alert.alert("Errore", "ID Rider non trovato. Prova a fare logout e login.");
        return;
    }

    setIsConnecting(true);

    try {
   
      const connected = await connectToFastGoBox(device.id, user.id);
      
      if (connected) {
          Alert.alert("Successo", "Box FastGo collegato e sincronizzato!");
          setConnectedDevice(connected);
      }
    } catch (e: any) {
      Alert.alert("Errore", e.message || "Impossibile connettersi");
    } finally {
      setIsConnecting(false);
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
        Benvenuto, <ThemedText type="defaultSemiBold">{user?.name}</ThemedText>.
        {"\n"}Connettiti al box per sincronizzare il tuo ID.
      </ThemedText>

      <TouchableOpacity 
        style={[styles.button, (isScanning || isConnecting) && styles.buttonDisabled]} 
        onPress={handleStartScan} 
        disabled={isScanning || isConnecting}
      >
        {isScanning ? (
            <ActivityIndicator color="white" /> 
        ) : (
            <ThemedText style={styles.buttonText}>Cerca Box</ThemedText>
        )}
      </TouchableOpacity>

      {devices.map(device => (
        <TouchableOpacity 
            key={device.id} 
            style={[styles.deviceCard, isConnecting && { opacity: 0.5 }]} 
            onPress={() => handleConnect(device)}
            disabled={isConnecting}
        >
           <ThemedView style={{flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', backgroundColor: 'transparent'}}>
               <ThemedView style={{backgroundColor: 'transparent'}}>
                    <ThemedText type="defaultSemiBold">{device.name || "FastGo Box"}</ThemedText>
                    <ThemedText style={{fontSize: 12, opacity: 0.6}}>{device.id}</ThemedText>
               </ThemedView>
               {isConnecting && <ActivityIndicator color="#2563EB" />}
           </ThemedView>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={logout} style={{marginTop: 50, alignItems: 'center'}}>
          <ThemedText style={{color: 'red'}}>Esci / Logout</ThemedText>
      </TouchableOpacity>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerImage: { color: '#3B82F6', bottom: -50, left: -30, position: 'absolute', opacity: 0.3 },
  titleContainer: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  deviceCard: { padding: 15, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 }
});