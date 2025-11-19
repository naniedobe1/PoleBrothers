import React, {useState} from 'react';
import {View, Text, StyleSheet, Linking, TouchableOpacity, Platform, Image} from 'react-native';
import FastImage from 'react-native-fast-image';
import {colors} from '../theme/colors';
import {fontSize, borderRadius, padding} from '../theme/styles';
import Logger from '../utils/logger';

const PhotoCard = ({
  image,
  status,
  timestamp,
  location,
  upperConfidence,
  lowerConfidence,
}) => {
  // Format timestamp to readable date
  const formatTimestamp = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return d.toLocaleString('en-US', options);
  };

  // Format confidence interval
  const formatConfidence = () => {
    if (upperConfidence === null || upperConfidence === undefined ||
        lowerConfidence === null || lowerConfidence === undefined) {
      return 'No confidence data';
    }
    return `${lowerConfidence} to ${upperConfidence} confidence`;
  };

  // Open location in maps
  const openInMaps = () => {
    if (!location || !location.latitude || !location.longitude) {
      return;
    }

    const {latitude, longitude} = location;
    const label = 'Pole Location';

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    Linking.openURL(url).catch(err => {
      Logger.error('Error opening maps:', err);
      // Fallback to Google Maps web
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      );
    });
  };

  // Determine status color (green for Normal, red for others)
  const statusColor = status === 'Normal' ? colors.statusGreen : '#DC143C'; // Crimson red

  // Format location for display
  const formatLocation = () => {
    if (!location || !location.latitude || !location.longitude) {
      return 'Location unavailable';
    }
    const lat = location.latitude.toFixed(3);
    const lon = location.longitude.toFixed(3);
    return `${lat}, ${lon}`;
  };

  const [imageError, setImageError] = useState(false);

  // Debug: Log image URL
  Logger.log('PhotoCard image URL:', image);
  Logger.log('Image URL type:', typeof image);
  Logger.log('Image URL length:', image?.length);

  return (
    <View style={styles.card}>
      {/* Using standard Image component for debugging - better error messages */}
      <Image
        source={{uri: image}}
        style={styles.thumbnail}
        resizeMode="cover"
        onLoadStart={() => {
          Logger.log('✓ Image loading started:', image);
          setImageError(false);
        }}
        onLoad={(event) => {
          Logger.log('✓ Image loaded successfully:', image);
          Logger.log('Image dimensions:', event.nativeEvent.source);
        }}
        onError={(error) => {
          Logger.error('✗ Image load error for URL:', image);
          Logger.error('Error nativeEvent:', error?.nativeEvent);
          Logger.error('Error message:', error?.nativeEvent?.error);
          setImageError(true);
        }}
      />
      {imageError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Failed to load</Text>
        </View>
      )}
      <View style={styles.contentArea}>
        <Text style={[styles.statusText, {color: statusColor}]}>{status}</Text>
        <Text style={styles.detailText}>{formatConfidence()}</Text>
        <Text style={styles.detailText}>{formatTimestamp(timestamp)}</Text>
        <TouchableOpacity onPress={openInMaps} disabled={!location?.latitude}>
          <Text style={[styles.detailText, styles.linkText]}>
            {formatLocation()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.secondary, // Beige
    borderWidth: 1,
    borderColor: colors.primary, // Forest green
    borderRadius: borderRadius.card,
    padding: padding.sm, // 12px
    marginHorizontal: 8,
    marginVertical: 4,
    // Shadow for depth
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: colors.gray, // Placeholder while loading
  },
  errorOverlay: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  errorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
    marginLeft: padding.sm,
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: fontSize.small,
    color: colors.black,
    marginTop: 2,
  },
  linkText: {
    color: '#007AFF', // iOS blue
    textDecorationLine: 'underline',
  },
});

export default PhotoCard;
