import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Activity, ArrowRight, Navigation, RefreshCw, ShoppingBag, User } from 'lucide-react-native';
import mqtt from 'mqtt';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import { getBasedUrl, getRouteFromOSRM, LatLng, OrderDto, updateOrderStatus } from '../../lib/api';
import { sendOrderCompletionWithDetails, sendOrderTopicToBox } from '../../lib/bluetooth';

const { width, height } = Dimensions.get('window');

const parseCoord = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(',', '.'));
};

const getHealthColor = (status: string) => {

    const cleanStatus = status.trim();
    
    switch (cleanStatus) {
        case 'VERY_POSITIVE': return '#16A34A'; // Verde Scuro
        case 'POSITIVE': return '#84CC16';      // Verde Chiaro
        case 'MEDIUM': return '#EAB308';        // Giallo
        case 'NEGATIVE': return '#F97316';      // Arancione
        case 'VERY_NEGATIVE': return '#DC2626'; // Rosso
        default: return '#64748B';              // Grigio (Waiting)
    }
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
  const [healthStatus, setHealthStatus] = useState<string>('WAITING');
  
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
    let client: mqtt.MqttClient | null = null;

    const connectMqtt = async () => {
      try {
        const baseUrl = await getBasedUrl(); 
        const brokerUrl = `ws://${baseUrl}:9001`; 
        
        console.log("Tentativo connessione a:", brokerUrl);
    
        client = mqtt.connect(brokerUrl, {
            clientId: `rider_${Math.random().toString(16).substr(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 5000,
        });

        client.on('connect', () => {
            console.log("MQTT Connesso");
            if (order?.id) {
                const topic = `inference/${order.id}/+`;
                client?.subscribe(topic, (err) => {
                    if (!err) console.log("Iscritto a:", topic);
                });
            }
        });

        client.on('message', (topic, message) => {
            try {
                if (topic.startsWith('inference/')) {
                    const payload = JSON.parse(message.toString());
                    
                    if (payload.status_raw) {
                        
                        const rawString = payload.status_raw.toString();
                        if (rawString.includes(',')) {
                            const parts = rawString.split(',');
                           
                            const label = parts[parts.length - 1]; 
                            setHealthStatus(label.trim());
                        } else {
                            setHealthStatus(rawString.trim());
                        }
                    }
                }
            } catch (e) {
                console.warn("Errore parsing MQTT", e);
            }
        });

        client.on('error', (err) => {
            console.warn("Errore MQTT:", err);
        });
        
        client.on('offline', () => {
            console.log("MQTT Offline");
        });

        mqttClient.current = client;

      } catch (e) {
        console.error("Errore nel recupero URL o connessione:", e);
      }
    };

    connectMqtt();

    return () => {
        if (client) {
            console.log("Chiusura connessione MQTT...");
            client.end();
        }
    };
  }, [order?.id]);

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
        //ogni 5 secondi se il cambiamento è di almeno 0 metri invia la posizione
        { accuracy: Location.Accuracy.High, timeInterval: 15000, distanceInterval: 0 },
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
            } else {
                console.log("NON INVIATO: Client disconnesso o Ordine mancante");
                console.log("Stato:", mqttClient.current?.connected, "Ordine:", !!order);
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
                if (connectedDevice) {
                    await sendOrderCompletionWithDetails(
                        connectedDevice, 
                        order.id, 
                        order.totalPrice, 
                        order.clientId
                    );
                }
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

      {!isPhasePickup && (
          <View style={[styles.healthBarContainer, { backgroundColor: getHealthColor(healthStatus) }]}>
              <Activity size={24} color="white" />
              <Text style={styles.healthText}>
                  ORDER HEALTH: {healthStatus.replace('_', ' ')}
              </Text>
          </View>
      )}

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
  healthBarContainer: { position: 'absolute', top: 135, left: 15, right: 15, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 8 },
  healthText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  bottomContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40, elevation: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  infoTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  infoSub: { fontSize: 14, color: '#64748B' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 15, gap: 10, elevation: 5 },
  actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});