import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Navigation, RefreshCw, ShoppingBag, User } from 'lucide-react-native';
import mqtt from 'mqtt';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { getRouteFromOSRM, LatLng, OrderDto, updateOrderStatus } from '../../lib/api';
import { sendOrderTopicToBox } from '../../lib/bluetooth';

const { width, height } = Dimensions.get('window');

const MQTT_BROKER_URL = 'ws://10.0.2.2:9001'; 

const parseCoord = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(',', '.'));
};

export default function DeliveryScreen() {
  const { connectedDevice } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(false);
  const [heading, setHeading] = useState(0);
  
  const mapRef = useRef<MapView>(null);
  const mqttClient = useRef<mqtt.MqttClient | null>(null); 

  useEffect(() => {
    if (params.orderData) {
      try {
        const parsedOrder = JSON.parse(params.orderData as string);
        setOrder(parsedOrder);
      } catch (e) {
        console.error(e);
      }
    }
  }, [params.orderData]);

  useEffect(() => {
    try {
        const client = mqtt.connect(MQTT_BROKER_URL, {
            clientId: `rider_${Math.random().toString(16).substr(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 5000,
        });

        client.on('connect', () => {
            console.log("MQTT Connesso");
        });

        client.on('error', (err) => {
            console.warn(err);
        });

        mqttClient.current = client;

        return () => {
            if (client) {
                client.end();
            }
        };
    } catch (e) {
        console.error(e);
    }
  }, []);

  const isPhasePickup = order?.orderStatus === 'DELIVER'; 

  const getTargetCoords = (): LatLng => {
      if (!order) return { latitude: 0, longitude: 0 };
      
      let lat = 0, lon = 0;
      
      if (isPhasePickup) {
          lat = parseCoord(order.shopAddress.latitude);
          lon = parseCoord(order.shopAddress.longitude);
      } else {
          lat = parseCoord(order.deliveryAddress.latitude);
          lon = parseCoord(order.deliveryAddress.longitude);
      }

      return { latitude: lat, longitude: lon };
  };

  const targetCoords = getTargetCoords();

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
          Alert.alert("Permesso negato", "Serve il GPS per la consegna.");
          return;
      }
      
      subscription = await Location.watchPositionAsync(
        //ogni 5 secondi si fa il calcolo della posizione, se questa e' variata di di almeno 20 metri
        //si notifica la nuova posizione
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
        (loc) => {
            const newLoc = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            };
            setRiderLocation(newLoc);
            if (loc.coords.heading) setHeading(loc.coords.heading);

            if (mqttClient.current && mqttClient.current.connected && order) {
                const topic = `rider/position/${order.shopId}/${order.id}`;
                
                const payload = JSON.stringify({
                    latitude: newLoc.latitude,
                    longitude: newLoc.longitude,
                    riderId: order.riderId, 
                    timestamp: Date.now()
                });

                mqttClient.current.publish(topic, payload, { qos: 0, retain: false }, (err) => {
                    if (err) console.warn(err);
                });
            }
        }
      );
    })();
    return () => { if(subscription) subscription.remove(); };
  }, [order]); 

  const calculateRoute = async () => {
      if (!riderLocation || riderLocation.latitude === 0) return;
      if (!targetCoords || targetCoords.latitude === 0) return;
      
      const points = await getRouteFromOSRM(riderLocation, targetCoords);
      
      if (points.length > 0) {
          setRouteCoords(points);
          mapRef.current?.fitToCoordinates(points, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true
          });
      } else {
          Alert.alert("Navigazione", "Impossibile calcolare il percorso stradale.");
      }
  };

  useEffect(() => {
      if (riderLocation && targetCoords.latitude !== 0) {
          calculateRoute();
      }
  }, [riderLocation?.latitude, targetCoords.latitude, isPhasePickup]);

  const handleAction = async () => {
    if (!order) return;
    setLoading(true);
    try {
        if (isPhasePickup) {
            const success = await updateOrderStatus(order.id, 'DELIVERING');
            if (success) {
                setOrder({ ...order, orderStatus: 'DELIVERING' });
                setRouteCoords([]); 
                
                const topic = `rider/position/${order.shopId}/${order.id}`;
                await sendOrderTopicToBox(connectedDevice, topic);

                setTimeout(calculateRoute, 500); 
                Alert.alert("Ritiro Confermato", "Topic inviato al Box. Vai dal cliente.");
            } else {
                Alert.alert("Errore", "Il server non ha confermato il ritiro.");
            }
        } else {
            const success = await updateOrderStatus(order.id, 'DELIVERED');
            if (success) {
                Alert.alert("Consegna Completata", "Ottimo lavoro!");
                router.dismissAll(); 
            } else {
                Alert.alert("Errore", "Il server non ha confermato la consegna.");
            }
        }
    } catch (e) {
        console.error(e);
        Alert.alert("Errore di rete");
    } finally {
        setLoading(false);
    }
  };

  if (!order) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        initialRegion={{
            latitude: targetCoords.latitude || 40.35,
            longitude: targetCoords.longitude || 18.17,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }}
      >
        {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeColor="#2563EB" strokeWidth={5} />
        )}
        
        {targetCoords.latitude !== 0 && (
            <Marker coordinate={targetCoords}>
                <View style={[styles.markerBadge, { backgroundColor: isPhasePickup ? '#2563EB' : '#16A34A' }]}>
                    {isPhasePickup ? <ShoppingBag size={20} color="white" /> : <User size={20} color="white" />}
                </View>
            </Marker>
        )}
      </MapView>

      <View style={styles.navHeader}>
          <View style={styles.navInstruction}>
              <Navigation size={28} color="#2563EB" style={{marginRight: 10}} />
              <View style={{flex:1}}>
                  <Text style={styles.navLabel}>{isPhasePickup ? "VAI AL RISTORANTE" : "VAI DAL CLIENTE"}</Text>
                  <Text style={styles.navAddress} numberOfLines={1}>
                      {isPhasePickup ? order.shopAddress.street : order.deliveryAddress.street}
                  </Text>
              </View>
              <TouchableOpacity onPress={calculateRoute} style={{padding:8}}>
                  <RefreshCw size={24} color="white" />
              </TouchableOpacity>
          </View>
      </View>

      <View style={styles.bottomContainer}>
          <View style={styles.infoRow}>
              <View>
                  <Text style={styles.infoTitle}>{isPhasePickup ? order.shopName : "Cliente"}</Text>
                  <Text style={styles.infoSub}>{isPhasePickup ? order.shopAddress.city : order.deliveryAddress.city}</Text>
              </View>
          </View>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isPhasePickup ? '#2563EB' : '#16A34A' }]}
            onPress={handleAction}
            disabled={loading}
          >
              {loading ? ( <ActivityIndicator color="white" /> ) : (
                  <>
                    <Text style={styles.actionButtonText}>
                        {isPhasePickup ? "CONFERMA RITIRO" : "CONFERMA CONSEGNA"}
                    </Text>
                    <ArrowRight size={24} color="white" />
                  </>
              )}
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  map: { width: width, height: height },
  markerBadge: { padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white', elevation: 5 },
  navHeader: { position: 'absolute', top: 50, left: 15, right: 15, backgroundColor: '#1E293B', padding: 15, borderRadius: 15, elevation: 10 },
  navInstruction: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  navLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  navAddress: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  bottomContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40, elevation: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  infoTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  infoSub: { fontSize: 14, color: '#64748B' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 15, gap: 10, elevation: 5 },
  actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});