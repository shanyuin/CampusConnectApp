import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#dbeafe',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarActiveBackgroundColor: '#1e40af',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Previous Attendance',
          tabBarLabel: 'Attendance',

           tabBarIcon: ({ color, size, focused }) => (
             <MaterialIcons name="history" color={color} size={size} />
          ),
      
        
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    height: 70,
    borderTopWidth: 0,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    elevation: 12,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabBarItem: {
    borderRadius: 14,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  tabBarIcon: {
    marginTop: 2,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
});
