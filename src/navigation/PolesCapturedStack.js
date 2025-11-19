import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PolesCapturedScreen from '../screens/PolesCapturedScreen';
import PoleDetailScreen from '../screens/PoleDetailScreen';
import {colors} from '../theme/colors';

const Stack = createStackNavigator();

const PolesCapturedStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="PolesCapturedList"
        component={PolesCapturedScreen}
        options={{
          title: 'Poles Captured',
        }}
      />
      <Stack.Screen
        name="PoleDetail"
        component={PoleDetailScreen}
        options={{
          title: 'Pole Details',
        }}
      />
    </Stack.Navigator>
  );
};

export default PolesCapturedStack;
