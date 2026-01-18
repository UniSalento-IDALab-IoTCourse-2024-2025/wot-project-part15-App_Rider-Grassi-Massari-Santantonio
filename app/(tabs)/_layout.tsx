import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Award, History, Map } from 'lucide-react-native';
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
   <Tabs screenOptions={{ tabBarActiveTintColor: '#2563EB', headerShown: false }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Mappa',
          tabBarIcon: ({ color }) => <Map color={color} size={24} />,
        }} 
      />
     
      <Tabs.Screen 
        name="history" 
        options={{
          title: 'Storico',
          tabBarIcon: ({ color }) => <History color={color} size={24} />,
        }} 
      />
    <Tabs.Screen 
        name="badges" 
        options={{
          title: 'Badges',
          tabBarIcon: ({ color }) => <Award color={color} size={24} />,
        }} 
      />
    </Tabs>
  );
}
