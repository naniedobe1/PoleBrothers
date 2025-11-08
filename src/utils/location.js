import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform} from 'react-native';

/**
 * Request location permission (iOS and Android)
 * @returns {Promise<boolean>} - Returns true if permission granted
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled via Info.plist
      // Request when in use authorization
      const result = await Geolocation.requestAuthorization('whenInUse');
      return result === 'granted';
    } else if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'PoleBrothers needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current GPS coordinates
 * @returns {Promise<object>} - Returns {latitude, longitude} or null
 */
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted');
      return null;
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          resolve({latitude, longitude});
        },
        error => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  } catch (error) {
    console.error('Error in getCurrentLocation:', error);
    return null;
  }
};

/**
 * Format location for display
 * @param {object} location - {latitude, longitude}
 * @returns {string} - Formatted location string
 */
export const formatLocation = (location) => {
  if (!location || !location.latitude || !location.longitude) {
    return 'Location unavailable';
  }

  const lat = location.latitude.toFixed(3);
  const lon = location.longitude.toFixed(3);
  return `Lat: ${lat}, Lon: ${lon}`;
};
