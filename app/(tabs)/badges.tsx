import { useAuth } from '@/context/AuthContext';
import { BadgeResponseDto, getRiderBadges } from '@/lib/api';
import { Award, Hexagon, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';

export default function BadgesScreen() {
  const { user } = useAuth(); 
  const [badges, setBadges] = useState<BadgeResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (riderId: string) => {
    setLoading(true);
    const data = await getRiderBadges(riderId);
    //const data = await getRiderBadges("RIDER_PRO_95");
    setBadges(data);
    setLoading(false);
  };

  const getRobohashUrl = (id: string) => `https://robohash.org/${id}.png?set=set1&bgset=bg1&size=512x512`;

  const renderBadge = ({ item }: { item: BadgeResponseDto }) => (
    <View style={styles.badgeCard}>
      <View style={styles.imageContainer}>
    
        <Image 
          source={{ uri: getRobohashUrl(user?.id || 'default') }} 
          style={styles.badgeImage} 
        />
        <View style={styles.levelTag}>
          <Text style={styles.levelText}>{item.level}</Text>
        </View>
      </View>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeTitle}>Rider Badge</Text>
        <Text style={styles.badgeDate}>{new Date(item.assignedAt).toLocaleDateString()}</Text>
        <View style={styles.tokenIdBox}>
          <ShieldCheck size={10} color="#6366F1" />
          <Text style={styles.tokenIdText}>ID: #{item.tokenId}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#6366F1" /></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Award size={32} color="#6366F1" />
        <Text style={styles.title}>I Tuoi NFT Badges</Text>
      </View>

      {badges.length === 0 ? (
        <View style={styles.emptyState}>
          <Hexagon size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>Nessun badge guadagnato finora.</Text>
        </View>
      ) : (
        <FlatList
          data={badges}
          renderItem={renderBadge}
          keyExtractor={item => item.tokenId}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  badgeCard: { backgroundColor: 'white', borderRadius: 16, width: '48%', marginBottom: 16, elevation: 3, overflow: 'hidden' },
  imageContainer: { height: 140, backgroundColor: '#F1F5F9' },
  badgeImage: { width: '100%', height: '100%' },
  levelTag: { position: 'absolute', top: 8, right: 8, backgroundColor: '#4F46E5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  levelText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  badgeInfo: { padding: 10 },
  badgeTitle: { fontWeight: 'bold', fontSize: 14, color: '#334155' },
  badgeDate: { fontSize: 10, color: '#94A3B8' },
  tokenIdBox: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#F5F3FF', padding: 4, borderRadius: 4 },
  tokenIdText: { fontSize: 10, color: '#6366F1', fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748B', marginTop: 12, fontSize: 16 }
});