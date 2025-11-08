import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import CameraScreen from '../screens/CameraScreen';
import PolesCapturedScreen from '../screens/PolesCapturedScreen';
import {colors} from '../theme/colors';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Capture') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'PolesCaptured') {
            iconName = focused ? 'grid' : 'grid-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary, // Forest green
        tabBarInactiveTintColor: colors.secondary, // Beige
        tabBarStyle: {
          backgroundColor: colors.accent, // Brown
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: colors.primary, // Forest green header
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}>
      <Tab.Screen
        name="Capture"
        component={CameraScreen}
        options={{
          title: 'Capture',
        }}
      />
      <Tab.Screen
        name="PolesCaptured"
        component={PolesCapturedScreen}
        options={{
          title: 'Poles Captured',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
