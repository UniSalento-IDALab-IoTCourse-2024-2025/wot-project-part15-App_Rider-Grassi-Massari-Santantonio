import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, MapPin, Radar, RefreshCw, ShoppingBag } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { acceptOrder, fetchActiveOrder, fetchOrdersByPosition, getCoordinatesFromAddress, OrderDto } from '../../lib/api';

const enrichOrderWithCoordinates = async (order: OrderDto): Promise<OrderDto> => {
    const newOrder = { ...order };

    if (!newOrder.shopAddress.latitude || Number(newOrder.shopAddress.latitude) === 0) {
        const coords = await getCoordinatesFromAddress(newOrder.shopAddress.street, newOrder.shopAddress.city);
        if (coords) {
            newOrder.shopAddress.latitude = coords.lat;
            newOrder.shopAddress.longitude = coords.lon;
        }
    }

    if (!newOrder.deliveryAddress.latitude || Number(newOrder.deliveryAddress.latitude) === 0) {
        const coords = await getCoordinatesFromAddress(newOrder.deliveryAddress.street, newOrder.deliveryAddress.city);
        if (coords) {
            newOrder.deliveryAddress.latitude = coords.lat;
            newOrder.deliveryAddress.longitude = coords.lon;
        }
    }

    return newOrder;
};

export default function ActiveShiftScreen() {
  const router = useRouter();
  const { lat, lon } = useLocalSearchParams();
  
  const [address, setAddress] = useState<string>("Posizione impostata");
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true); 

  useEffect(() => {
    const checkActiveOrder = async () => {
        try {
            let activeOrder = await fetchActiveOrder();
            
            if (activeOrder) {
                activeOrder = await enrichOrderWithCoordinates(activeOrder);
                router.replace({
                    pathname: '/rider/delivery',
                    params: { orderData: JSON.stringify(activeOrder) }
                });
            }
        } catch (e) {
            console.log("Errore controllo ordine attivo", e);
        } finally {
            setCheckingActive(false); 
        }
    };

    checkActiveOrder();
  }, []); 

  useEffect(() => {
    const getAddressFromOSM = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'FastGoRiderApp/1.0' } });
        const data = await response.json();
        if (data && data.address) {
             const road = data.address.road || data.address.pedestrian || "";
             const city = data.address.city || data.address.town || "";
             setAddress(road ? `${road}, ${city}` : data.display_name.split(',')[0]);
        }
      } catch (e) {}
    };
    if (lat && lon) getAddressFromOSM();
  }, [lat, lon]);

  const handleManualSearch = async () => {
    if (!lat || !lon) return;
    
    setIsLoading(true);
    try {
        const foundOrders = await fetchOrdersByPosition(parseFloat(lat as string), parseFloat(lon as string));
        const pendingOrders = foundOrders.filter(o => o.orderStatus === 'PENDING' || o.orderStatus === 'IN_PROGRESS');
        
        setOrders(pendingOrders);
        
        if (pendingOrders.length === 0) {
            Alert.alert("Nessun ordine", "Al momento non ci sono ordini in questa zona. Riprova tra poco.");
        }

    } catch (error) {
        console.log("Errore ricerca ordini:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);
    
    //  Recupera l'oggetto ordine corrente
    const originalOrder = orders.find(o => o.id === orderId);

    //  Chiama il server per accettare
    const success = await acceptOrder(orderId);
    
    if (success && originalOrder) {
      
        const updatedOrder: OrderDto = { 
            ...originalOrder, 
            orderStatus: 'DELIVER' 
        };
        
        
        const finalOrder = await enrichOrderWithCoordinates(updatedOrder);

        // Pulisce la lista locale
        setOrders(prev => prev.filter(o => o.id !== orderId));
        
        
        router.push({
            pathname: '/rider/delivery',
            params: { orderData: JSON.stringify(finalOrder) }
        });
    } else {
        Alert.alert("Errore", "L'ordine è stato preso da un altro rider o c'è stato un problema.");
        handleManualSearch(); 
    }
    setAcceptingId(null);
  };

  const renderOrder = ({ item }: { item: OrderDto }) => (
    <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
            <View style={styles.shopIcon}>
                <ShoppingBag size={20} color="#2563EB" />
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.shopName}>{item.shopName}</Text>
                <Text style={styles.shopAddress}>{item.shopAddress.street}, {item.shopAddress.city}</Text>
            </View>
            <View style={styles.priceBadge}>
                <Text style={styles.priceText}>€ {item.totalPrice.toFixed(2)}</Text>
            </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
                <MapPin size={16} color="#64748B" />
                <Text style={styles.detailText}>Consegna a: {item.deliveryAddress.street}</Text>
            </View>
            <View style={styles.detailRow}>
                <Clock size={16} color="#64748B" />
                <Text style={styles.detailText}>Ristorante: {item.shopName}</Text> 
            </View>
        </View>

        <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAccept(item.id)}
            disabled={acceptingId === item.id}
        >
            {acceptingId === item.id ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.acceptButtonText}>ACCETTA ORDINE</Text>
            )}
        </TouchableOpacity>
    </View>
  );

  if (checkingActive) {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={{marginTop: 10, color: '#64748B'}}>Verifica turno...</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>In Turno</Text>
        <View style={styles.locationTag}>
            <MapPin size={14} color="#2563EB" />
            <Text style={styles.locationTagText} numberOfLines={1}>{address}</Text>
        </View>
      </View>

      <View style={styles.content}>
        
        {orders.length === 0 ? (
            <View style={styles.radarView}>
                <View style={styles.radarContainer}>
                    <Radar size={100} color="#2563EB" />
                </View>
                <Text style={styles.statusTitle}>Sei Online</Text>
                <Text style={styles.statusSubtitle}>Premi Cerca per trovare ordini vicini.</Text>
                
                <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={handleManualSearch}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <RefreshCw size={20} color="white" />
                            <Text style={styles.searchButtonText}>Cerca Ordini</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        ) : (
            <FlatList 
                data={orders}
                keyExtractor={item => item.id}
                renderItem={renderOrder}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <TouchableOpacity 
                        style={styles.refreshListButton} 
                        onPress={handleManualSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#2563EB" size="small"/> : <Text style={styles.refreshListText}>Aggiorna Lista</Text>}
                    </TouchableOpacity>
                }
            />
        )}

      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()} 
        >
            <ArrowLeft size={20} color="#334155" />
            <Text style={styles.backButtonText}>Cambia Posizione</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { justifyContent: 'center', alignItems: 'center' }, 
  
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  locationTag: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#EFF6FF', 
      padding: 6, 
      borderRadius: 8,
      maxWidth: '60%',
      gap: 4
  },
  locationTagText: { color: '#2563EB', fontSize: 12, fontWeight: '600' },

  content: { flex: 1 },

  radarView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  radarContainer: {
    marginBottom: 30,
    padding: 40,
    backgroundColor: '#DBEAFE',
    borderRadius: 200,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  statusTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  statusSubtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 30 },

  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    gap: 10,
    elevation: 5,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  searchButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  orderCard: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  shopIcon: { backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10 },
  shopName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  shopAddress: { fontSize: 12, color: '#64748B' },
  priceBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  priceText: { color: '#166534', fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  
  cardDetails: { gap: 8, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { color: '#475569', fontSize: 14 },

  acceptButton: {
      backgroundColor: '#2563EB',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
  },
  acceptButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  refreshListButton: {
      alignSelf: 'center',
      marginBottom: 15,
      padding: 8
  },
  refreshListText: { color: '#2563EB', fontWeight: '600' },

  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#334155' }
});