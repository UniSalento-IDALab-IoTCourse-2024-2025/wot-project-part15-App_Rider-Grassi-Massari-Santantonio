import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Map, User } from 'lucide-react-native';
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
        name="explore" 
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }} 
      />
    </Tabs>
  );
}
