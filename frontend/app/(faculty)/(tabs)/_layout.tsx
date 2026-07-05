import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DrawerContent from '../../../components/Navigation/DrawerContent';

export default function FacultyDrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContent {...props} />
      )}
      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor: '#7f1d1d',
        },

        headerTintColor: '#FFF8F0',

        headerTitleStyle: {
          fontWeight: '700',
        },

        drawerActiveTintColor: '#dbeafe',
        drawerInactiveTintColor: '#94a3b8',
        drawerActiveBackgroundColor: '#e09c15',

        drawerStyle: styles.drawer,
        drawerItemStyle: styles.drawerItem,
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: 'Home',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          drawerLabel: 'Attendance',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons
              name="history"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="gate-pass-request"
        options={{
          title: 'Gate Pass',
          drawerLabel: 'Gate Pass',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons
              name="qr-code-2"
              color={color}
              size={size}
            />
          ),
        }}
      />

       <Drawer.Screen
        name="StudentAttendance"
        options={{
          title: 'Student Attendance',
          drawerLabel: 'Student Attendance',
          drawerIcon: ({ color, size }) => (
       <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />

           </Drawer>

     

        
    


  );
}

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: '#7f1d1d',
  },

  drawerItem: {
    marginVertical: 4,
    borderRadius: 12,
  },
});