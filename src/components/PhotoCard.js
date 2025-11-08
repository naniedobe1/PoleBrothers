import React from 'react';
import {View, Image, Text, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import {colors} from '../theme/colors';
import {fontSize, borderRadius, padding} from '../theme/styles';
import {formatLocation} from '../utils/location';

const PhotoCard = ({
  image,
  confidenceInterval = 95,
  timestamp,
  status = 'Healthy Pole',
  location,
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

  return (
    <View style={styles.card}>
      <FastImage
        source={{uri: `file://${image}`}}
        style={styles.thumbnail}
        resizeMode={FastImage.resizeMode.cover}
      />
      <View style={styles.contentArea}>
        <Text style={styles.statusText}>{status}</Text>
        <Text style={styles.detailText}>
          {confidenceInterval}% confidence
        </Text>
        <Text style={styles.detailText}>
          {formatTimestamp(timestamp)}
        </Text>
        <Text style={styles.detailText}>
          {formatLocation(location)}
        </Text>
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
  },
  contentArea: {
    flex: 1,
    marginLeft: padding.sm,
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.statusGreen, // Green for "Healthy Pole"
  },
  detailText: {
    fontSize: fontSize.small,
    color: colors.black,
    marginTop: 2,
  },
});

export default PhotoCard;
