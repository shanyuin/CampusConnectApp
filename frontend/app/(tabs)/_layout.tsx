import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';
import React from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';


export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8);
  const tabBarBottomPadding = bottomInset + (Platform.OS === 'android' ? 8 : 4);
  const tabBarHeight = (Platform.OS === 'android' ? 65 : 60) + tabBarBottomPadding;
    


  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: '#dbeafe',
        tabBarInactiveTintColor: '#94a3b8',
       // tabBarActiveBackgroundColor: '#1e40af',
       tabBarActiveBackgroundColor: '#e09c15',
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: styles.tabBarItem,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: tabBarBottomPadding,
            overflow: 'hidden',  
          },
        ],
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: ({ color }) => (
            <Text allowFontScaling={false} numberOfLines={1} style={[styles.tabBarLabel, { color }]}>Home</Text>
          ),
          tabBarIcon: ({ color, focused }) => (
          <View
            style={{
              backgroundColor: focused ? '#e09c15' : 'transparent',
              borderRadius: 30,
              paddingVertical: 4,   // 🔽 reduce this
              paddingHorizontal: 5,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={20} // 🔽 slightly smaller
              color={color}
            />
          </View>
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Previous Attendance',
          tabBarLabel: ({ color }) => (
            <Text allowFontScaling={false} numberOfLines={1} style={[styles.tabBarLabel, { color }]}>Attendance</Text>
          ),

           tabBarIcon: ({ color }) => (
             <MaterialIcons name="history" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'relative',
    borderTopWidth: 1,
    backgroundColor:  '#7f1d1d',
    borderRadius: 0,
    elevation: 0,
   
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    paddingTop: 6,
    // paddingHorizontal: 8,
    borderColor: '#1e293b',
  },
  tabBarItem: {
    flex: 1,
    marginVertical: 1,
    borderRadius: 30,
  },
  tabBarIcon: {
     marginTop:2,
  
  },
  tabBarLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
});
