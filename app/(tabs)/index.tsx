import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Bike, Navigation } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

//Lecce
const DEFAULT_REGION = {
  latitude: 40.35344,
  longitude: 18.17197,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function RiderMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [riderLocation, setRiderLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);


  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permesso negato", "Impossibile accedere alla posizione. Usa la mappa manualmente.");
          setRiderLocation({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
          setLoadingLocation(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        
        const userReg = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01, // Zoom più stretto per il rider
          longitudeDelta: 0.01,
        };

        setRegion(userReg);
        setRiderLocation({ latitude: userReg.latitude, longitude: userReg.longitude });
        
        // Anima la mappa sulla posizione
        mapRef.current?.animateToRegion(userReg, 1000);

      } catch (error) {
        console.log("Errore GPS:", error);
        setRiderLocation({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);


  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setRiderLocation(coords);
  };


  const handleConfirmPosition = () => {
    if (!riderLocation) return;
    
    // Navighiamo alla pagina di stato attivo passando le coordinate
    router.push({
      pathname: '/rider/active',
      params: { 
        lat: riderLocation.latitude, 
        lon: riderLocation.longitude 
      }
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={true} 
        showsMyLocationButton={false}
        onPress={handleMapPress} 
      >
        {/* Marker del Rider (Sostituisce DeliveryMarker) */}
        {riderLocation && (
            <Marker coordinate={riderLocation} title="La tua posizione di partenza">
                <View style={styles.markerContainer}>
                    <View style={styles.markerCircle}>
                        <Bike size={20} color="white" />
                    </View>
                    <View style={styles.markerArrow} />
                </View>
            </Marker>
        )}
      </MapView>

      {/* --- UI OVERLAYS --- */}

      {/* Titolo in alto */}
      <View style={styles.topBadge}>
        <Text style={styles.topBadgeText}>Dove inizi il turno?</Text>
      </View>

      {/* Tasto indietro*/}
      <TouchableOpacity 
        style={styles.myLocationButton}
        onPress={async () => {
            let location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            };
            setRiderLocation({ latitude: newRegion.latitude, longitude: newRegion.longitude });
            mapRef.current?.animateToRegion(newRegion, 500);
        }}
      >
        <Navigation size={24} color="#2563EB" />
      </TouchableOpacity>
      
      {/* Bottone Conferma */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.confirmButton, loadingLocation && styles.disabledButton]}
          onPress={handleConfirmPosition}
          disabled={loadingLocation}
        >
            {loadingLocation ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.confirmButtonText}>Conferma Posizione</Text>
            )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  
  topBadge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  topBadgeText: { fontWeight: 'bold', color: '#334155' },

  myLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'white',
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
  },
  disabledButton: { backgroundColor: '#94A3B8' },
  confirmButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  // Stili Marker Custom Inline
  markerContainer: { alignItems: 'center' },
  markerCircle: {
    backgroundColor: '#2563EB',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  markerArrow: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderLeftColor: 'transparent',
    borderRightWidth: 6, borderRightColor: 'transparent',
    borderTopWidth: 8, borderTopColor: '#2563EB',
    marginTop: -2,
  }
});