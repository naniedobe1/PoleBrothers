import React, {useState, useCallback} from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import PhotoCard from '../components/PhotoCard';
import {loadPhotos, getPhotoMetadata} from '../utils/storage';
import {colors} from '../theme/colors';
import {fontSize} from '../theme/styles';

const PolesCapturedScreen = () => {
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = async () => {
    try {
      const loadedPhotos = await loadPhotos();
      setPhotos(loadedPhotos);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  // Load photos when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPhotos();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPhotos();
    setRefreshing(false);
  };

  const renderPhotoCard = ({item}) => {
    const metadata = getPhotoMetadata(item);
    if (!metadata) return null;

    return (
      <PhotoCard
        image={item}
        confidenceInterval={95}
        timestamp={metadata.timestamp}
        status="Healthy Pole"
        location={null} // Location would be stored in a separate metadata file
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No photos yet</Text>
      <Text style={styles.emptySubtext}>
        Capture your first pole using the camera tab
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhotoCard}
        keyExtractor={(item, index) => `photo-${index}`}
        contentContainerStyle={
          photos.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: fontSize.xlarge,
    fontWeight: 'bold',
    color: colors.gray,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: fontSize.medium,
    color: colors.gray,
    textAlign: 'center',
  },
});

export default PolesCapturedScreen;
