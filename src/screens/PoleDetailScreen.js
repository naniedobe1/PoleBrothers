import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {colors} from '../theme/colors';
import {fontSize, padding} from '../theme/styles';
import {deletePoleFromDatabase} from '../utils/database';

const PoleDetailScreen = ({route, navigation}) => {
  const {pole} = route.params;
  const [deleting, setDeleting] = useState(false);

  const formatTimestamp = date => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatConfidence = () => {
    if (
      pole.upper_confidence === null ||
      pole.upper_confidence === undefined ||
      pole.lower_confidence === null ||
      pole.lower_confidence === undefined
    ) {
      return 'No confidence data available';
    }
    return `${pole.lower_confidence}% to ${pole.upper_confidence}% confidence`;
  };

  const openInMaps = () => {
    if (!pole.latitude || !pole.longitude) {
      Alert.alert('Error', 'Location data not available');
      return;
    }

    const {latitude, longitude} = pole;
    const label = 'Pole Location';

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    Linking.openURL(url).catch(err => {
      console.error('Error opening maps:', err);
      // Fallback to Google Maps web
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      );
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pole',
      'Are you sure you want to delete this pole capture? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              // Delete using image_uri as the unique identifier
              const success = await deletePoleFromDatabase(pole.image_uri);

              if (success) {
                Alert.alert('Success', 'Pole deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                Alert.alert('Error', 'Failed to delete pole');
                setDeleting(false);
              }
            } catch (error) {
              console.error('Error deleting pole:', error);
              Alert.alert('Error', 'Failed to delete pole');
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const statusColor = pole.status === 'Normal' ? colors.statusGreen : '#DC143C';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Image */}
        <Image source={{uri: pole.image_uri}} style={styles.image} />

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.statusText, {color: statusColor}]}>
            {pole.status}
          </Text>
        </View>

        {/* Confidence Interval */}
        <View style={styles.section}>
          <Text style={styles.label}>Confidence Interval</Text>
          <Text style={styles.value}>{formatConfidence()}</Text>
        </View>

        {/* Timestamp */}
        <View style={styles.section}>
          <Text style={styles.label}>Captured On</Text>
          <Text style={styles.value}>{formatTimestamp(pole.created_at)}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity onPress={openInMaps} style={styles.locationButton}>
            <Text style={styles.locationText}>
              Latitude: {pole.latitude || 'N/A'}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {pole.longitude || 'N/A'}
            </Text>
            <Text style={styles.mapLinkText}>Tap to open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={deleting}>
          {deleting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.deleteButtonText}>DELETE POLE</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBrown,
  },
  content: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: colors.gray,
  },
  section: {
    padding: padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + '40',
  },
  label: {
    fontSize: fontSize.small,
    color: colors.gray,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: fontSize.large,
    color: colors.black,
  },
  statusText: {
    fontSize: fontSize.xlarge,
    fontWeight: 'bold',
  },
  locationButton: {
    backgroundColor: colors.secondary,
    padding: padding.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  locationText: {
    fontSize: fontSize.medium,
    color: colors.black,
    marginBottom: 4,
  },
  mapLinkText: {
    fontSize: fontSize.small,
    color: '#007AFF',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  deleteButton: {
    margin: padding.lg,
    marginTop: padding.xl,
    backgroundColor: '#DC143C',
    padding: padding.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: fontSize.large,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default PoleDetailScreen;
