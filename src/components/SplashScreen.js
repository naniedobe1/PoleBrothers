import React, {useEffect, useRef} from 'react';
import {View, Image, Animated, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

const SplashScreen = ({onFinish}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation sequence:
    // 1. Fade in to opacity 1 over 1.5 seconds
    // 2. Hold for 0.5 seconds
    // 3. Navigate to main app
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      // Hold for 0.5 seconds before calling onFinish
      setTimeout(() => {
        if (onFinish) {
          onFinish();
        }
      }, 500);
    });
  }, [fadeAnim, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, {opacity: fadeAnim}]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary, // Beige background
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default SplashScreen;
