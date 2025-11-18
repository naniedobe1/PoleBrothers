import React, {useState, useCallback} from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import PhotoCard from '../components/PhotoCard';
import {fetchPolesFromDatabase, getDeviceId} from '../utils/database';
import {getCurrentLocation} from '../utils/location';
import {colors} from '../theme/colors';
import {fontSize} from '../theme/styles';

const SORT_OPTIONS = {
  RECENT: 'recent',
  OLDEST: 'oldest',
  NEAREST: 'nearest',
};

const STATUS_OPTIONS = ['Normal', 'Vegetation', 'Warped', 'Cracked', 'Leaning'];

const PolesCapturedScreen = () => {
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.RECENT);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState(STATUS_OPTIONS); // All checked by default
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const PAGE_SIZE = 20;

  const fetchPhotos = async (isRefresh = false) => {
    // Prevent concurrent fetches
    if (refreshing || loadingMore) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    try {
      const newOffset = isRefresh ? 0 : offset;

      // Get user location if sorting by nearest
      let location = userLocation;
      if (sortBy === SORT_OPTIONS.NEAREST && !location) {
        location = await getCurrentLocation();
        setUserLocation(location);
      }

      const poles = await fetchPolesFromDatabase(
        PAGE_SIZE,
        newOffset,
        sortBy,
        location,
        selectedStatuses,
      );

      if (isRefresh) {
        setPhotos(poles);
        setOffset(PAGE_SIZE);
        setHasMore(poles.length === PAGE_SIZE);
      } else {
        // Append to existing photos
        setPhotos(prevPhotos => [...prevPhotos, ...poles]);
        setOffset(newOffset + PAGE_SIZE);
        setHasMore(poles.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  // Load photos when screen comes into focus, sort changes, or filter changes
  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      fetchPhotos(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, selectedStatuses]),
  );

  const handleSortChange = (newSort) => {
    if (newSort === sortBy) return; // Don't refetch if same sort option
    setSortBy(newSort);
    setOffset(0);
    // fetchPhotos will be triggered by useFocusEffect when sortBy changes
  };

  const toggleStatusFilter = (status) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        // Uncheck - remove from array
        return prev.filter((s) => s !== status);
      } else {
        // Check - add to array
        return [...prev, status];
      }
    });
  };

  const selectAllStatuses = () => {
    setSelectedStatuses(STATUS_OPTIONS);
  };

  const clearAllStatuses = () => {
    setSelectedStatuses([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPhotos(true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    await fetchPhotos(false);
    setLoadingMore(false);
  };

  const renderPhotoCard = ({item}) => {
    return (
      <PhotoCard
        image={item.image_uri}
        status={item.status}
        timestamp={item.created_at}
        location={{
          latitude: item.latitude,
          longitude: item.longitude,
        }}
        upperConfidence={item.upper_confidence}
        lowerConfidence={item.lower_confidence}
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

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Sort and Filter */}
      <View style={styles.headerContainer}>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort By:</Text>
          <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === SORT_OPTIONS.RECENT && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange(SORT_OPTIONS.RECENT)}>
            <Text
              style={[
                styles.sortButtonText,
                sortBy === SORT_OPTIONS.RECENT && styles.sortButtonTextActive,
              ]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === SORT_OPTIONS.OLDEST && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange(SORT_OPTIONS.OLDEST)}>
            <Text
              style={[
                styles.sortButtonText,
                sortBy === SORT_OPTIONS.OLDEST && styles.sortButtonTextActive,
              ]}>
              Oldest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === SORT_OPTIONS.NEAREST && styles.sortButtonActive,
            ]}
            onPress={() => handleSortChange(SORT_OPTIONS.NEAREST)}>
            <Text
              style={[
                styles.sortButtonText,
                sortBy === SORT_OPTIONS.NEAREST && styles.sortButtonTextActive,
              ]}>
              Nearest
            </Text>
          </TouchableOpacity>
        </View>
        </View>

        {/* Filter Button (Hamburger Menu) */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterMenu(true)}>
          <View style={styles.hamburgerIcon}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterMenu(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterMenu(false)}>
          <View style={styles.filterMenuContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity onPress={selectAllStatuses}>
                <Text style={styles.actionButton}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAllStatuses}>
                <Text style={styles.actionButton}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.checkboxContainer}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.checkboxItem}
                  onPress={() => toggleStatusFilter(status)}>
                  <View style={styles.checkbox}>
                    {selectedStatuses.includes(status) && (
                      <View style={styles.checkboxChecked} />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{status}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.filterFooter}>
              <Text style={styles.filterCount}>
                {selectedStatuses.length} of {STATUS_OPTIONS.length} selected
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={photos}
        renderItem={renderPhotoCard}
        keyExtractor={(item, index) => {
          // Always include index to ensure absolute uniqueness
          // Even if image_uri is duplicated somehow, this guarantees unique keys
          return `${item.image_uri || 'unknown'}-${index}`;
        }}
        contentContainerStyle={
          photos.length === 0 ? styles.emptyList : styles.list
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
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
    backgroundColor: colors.lightBrown,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  sortContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: {
    width: 24,
    height: 20,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sortLabel: {
    fontSize: fontSize.medium,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
  },
  sortButtonText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: colors.white,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: fontSize.small,
    color: colors.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  filterMenuContainer: {
    backgroundColor: colors.white,
    marginTop: 60,
    marginRight: 8,
    borderRadius: 8,
    width: 250,
    maxHeight: 400,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  filterTitle: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.black,
  },
  closeButton: {
    fontSize: 24,
    color: colors.gray,
    fontWeight: 'bold',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  actionButton: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  checkboxContainer: {
    maxHeight: 240,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: fontSize.medium,
    color: colors.black,
  },
  filterFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
    alignItems: 'center',
  },
  filterCount: {
    fontSize: fontSize.small,
    color: colors.gray,
  },
});

export default PolesCapturedScreen;
