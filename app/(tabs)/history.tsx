import { useAuth } from '@/context/AuthContext';
import { getRiderHistory, OrderBlockchainDto, OrderDto, verifyOrderOnBlockchain } from '@/lib/api';
import { Coins, MapPin, ShieldCheck, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderBlockchainDto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);


  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getRiderHistory();

      setOrders(data.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
    } catch (error) {
      console.error("Errore caricamento storico:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (orderId: string) => {
    setVerifying(true);
    setModalVisible(true);
    try {
      const data = await verifyOrderOnBlockchain(orderId);
      setSelectedOrder(data);
    } catch (error) {
      console.error("Errore verifica blockchain:", error);
    } finally {
      setVerifying(false);
    }
  };

  const renderItem = ({ item }: { item: OrderDto }) => {
    const isCompleted = item.orderStatus === 'COMPLETED' || item.orderStatus === 'DELIVERED';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.shopName} numberOfLines={1}>{item.shopName} → {item.usernameClient}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#DCFCE7' : '#FEE2E2' }]}>
            <Text style={{ color: isCompleted ? '#166534' : '#991B1B', fontSize: 10, fontWeight: 'bold' }}>
              {isCompleted ? 'COMPLETATO' : 'CANCELLATO'}
            </Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.addressText}>{item.deliveryAddress.street}, {item.deliveryAddress.city}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.dateText}>{new Date(item.orderDate).toLocaleDateString()}</Text>
          
          {isCompleted && (
            <TouchableOpacity style={styles.blockchainBtn} onPress={() => handleVerify(item.id)}>
              <ShieldCheck size={16} color="#4F46E5" />
              <Text style={styles.blockchainBtnText}>Verifica Chain</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Storico Consegne</Text>
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList 
          data={orders} 
          renderItem={renderItem} 
          keyExtractor={item => item.id} 
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: '#94a3b8' }}>Nessun ordine trovato.</Text>}
        />
      )}

      {/* MODAL BLOCKCHAIN */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setModalVisible(false); setSelectedOrder(null); }}>
              <X color="#64748b" />
            </TouchableOpacity>

            {verifying ? (
              <ActivityIndicator size="large" color="#4F46E5" />
            ) : selectedOrder ? (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <View style={styles.pointsBox}>
                  <Coins size={32} color="#FACC15" />
                  <Text style={styles.pointsText}>{selectedOrder.points} PUNTI</Text>
                  <Text style={styles.pointsSub}>Bonus Blockchain Validato</Text>
                </View>
                <Text style={styles.modalOrderId}>ID: {selectedOrder.orderId.substring(0, 15)}...</Text>
                <Text style={styles.modalStatus}>Esito: {selectedOrder.result}</Text>
              </View>
            ) : (
              <Text style={{ color: '#ef4444' }}>Dati non ancora disponibili sulla chain.</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1E293B' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  shopName: { fontWeight: 'bold', fontSize: 16, color: '#334155', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  addressText: { color: '#64748b', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  dateText: { color: '#94A3B8', fontSize: 12 },
  blockchainBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', padding: 6, borderRadius: 8 },
  blockchainBtnText: { color: '#4F46E5', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  pointsBox: { backgroundColor: '#4F46E5', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', marginBottom: 15 },
  pointsText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  pointsSub: { color: '#C7D2FE', fontSize: 12 },
  modalOrderId: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
  modalStatus: { marginTop: 10, fontWeight: 'bold', color: '#10B981' }
});