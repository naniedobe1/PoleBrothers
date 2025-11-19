import {supabase} from './supabase';
import DeviceInfo from 'react-native-device-info';

/**
 * Get device identifier for vendor (iOS) or unique ID (Android)
 * @returns {Promise<string>} - Device identifier
 */
export const getDeviceId = async () => {
  try {
    const deviceId = await DeviceInfo.getUniqueId();
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return 'unknown-device';
  }
};

/**
 * Pole types mapping
 */
const POLE_TYPES = {
  NORMAL: 'normal_pole',
  LEANING: 'leaning_pole',
  CRACKED: 'cracked_pole',
  WARPED: 'warped_pole',
  VEGETATION: 'vegetation_pole',
};

const STATUS_MAP = {
  [POLE_TYPES.NORMAL]: 'Normal',
  [POLE_TYPES.LEANING]: 'Leaning',
  [POLE_TYPES.CRACKED]: 'Cracked',
  [POLE_TYPES.WARPED]: 'Warped',
  [POLE_TYPES.VEGETATION]: 'Vegetation',
};

/**
 * Randomly select one pole type
 * @returns {object} - {poleType, status, booleanFields}
 */
export const getRandomPoleType = () => {
  const types = Object.values(POLE_TYPES);
  const randomType = types[Math.floor(Math.random() * types.length)];

  // Create boolean fields object (all false except the selected one)
  const booleanFields = {
    normal_pole: randomType === POLE_TYPES.NORMAL,
    leaning_pole: randomType === POLE_TYPES.LEANING,
    cracked_pole: randomType === POLE_TYPES.CRACKED,
    warped_pole: randomType === POLE_TYPES.WARPED,
    vegetation_pole: randomType === POLE_TYPES.VEGETATION,
  };

  return {
    poleType: randomType,
    status: STATUS_MAP[randomType],
    booleanFields,
  };
};

/**
 * Save pole capture to Supabase PolesCaptured table
 * @param {object} poleData - Pole data to save
 * @param {string} poleData.image_uri - R2 URL of the image
 * @param {number} poleData.latitude - GPS latitude
 * @param {number} poleData.longitude - GPS longitude
 * @returns {Promise<object>} - Returns the created pole record
 */
export const savePoleToDatabase = async (poleData) => {
  try {
    // Get device ID (taker_id)
    const takerId = await getDeviceId();

    // Get random pole type
    const {status, booleanFields} = getRandomPoleType();

    // Prepare the record
    const record = {
      taker_id: takerId,
      created_at: new Date().toISOString(),
      latitude: poleData.latitude || 0,
      longitude: poleData.longitude || 0,
      image_uri: poleData.image_uri,
      status: status,
      lower_confidence: 0,
      upper_confidence: 0,
      ...booleanFields,
    };

    console.log('Saving to PolesCaptured:', record);

    const {data, error} = await supabase
      .from('PolesCaptured')
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error('Error saving to database:', error);
      throw error;
    }

    console.log('Pole saved to database successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in savePoleToDatabase:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Fetch poles for current device from Supabase PolesCaptured table with pagination
 * @param {number} limit - Number of items to fetch (default 20)
 * @param {number} offset - Offset for pagination (default 0)
 * @param {string} sortBy - Sort option: 'recent', 'oldest', or 'nearest' (default 'recent')
 * @param {object} userLocation - User's current location {latitude, longitude} (required for 'nearest')
 * @param {Array<string>} statusFilter - Array of status values to filter by (e.g., ['Normal', 'Leaning'])
 * @returns {Promise<Array>} - Returns array of pole records for this device
 */
export const fetchPolesFromDatabase = async (
  limit = 20,
  offset = 0,
  sortBy = 'recent',
  userLocation = null,
  statusFilter = null,
) => {
  try {
    const deviceId = await getDeviceId();
    console.log(
      `Fetching poles for device: ${deviceId}, limit: ${limit}, offset: ${offset}, sortBy: ${sortBy}, statusFilter: ${statusFilter?.join(', ')}`,
    );

    let query = supabase
      .from('PolesCaptured')
      .select('*')
      .eq('taker_id', deviceId);

    // Apply status filter if provided and not empty
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    // Apply sorting based on sortBy parameter
    if (sortBy === 'recent') {
      query = query.order('created_at', {ascending: false});
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', {ascending: true});
    } else if (sortBy === 'nearest') {
      // For nearest, fetch all data and sort client-side
      // Supabase doesn't support distance-based sorting without PostGIS
      query = query.order('created_at', {ascending: false});
    }

    query = query.range(offset, offset + limit - 1);

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching poles:', error);
      throw error;
    }

    // If sorting by nearest and we have user location, sort by distance
    if (sortBy === 'nearest' && userLocation) {
      const {latitude: userLat, longitude: userLon} = userLocation;
      data.sort((a, b) => {
        const distanceA = calculateDistance(
          userLat,
          userLon,
          a.latitude,
          a.longitude,
        );
        const distanceB = calculateDistance(
          userLat,
          userLon,
          b.latitude,
          b.longitude,
        );
        return distanceA - distanceB;
      });
    }

    console.log(`Fetched ${data?.length || 0} poles from database`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchPolesFromDatabase:', error);
    return [];
  }
};

/**
 * Delete a pole record from Supabase
 * @param {string} takerId - taker_id (device ID)
 * @param {string} createdAt - created_at timestamp
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const deletePoleFromDatabase = async (takerId, createdAt) => {
  try {
    const {error} = await supabase
      .from('PolesCaptured')
      .delete()
      .eq('taker_id', takerId)
      .eq('created_at', createdAt);

    if (error) {
      console.error('Error deleting pole:', error);
      throw error;
    }

    console.log('Pole deleted from database');
    return true;
  } catch (error) {
    console.error('Error in deletePoleFromDatabase:', error);
    return false;
  }
};

/**
 * Generate a random 16-character alphanumeric string
 * @returns {string} - Random 16-character string
 */
export const generateRandomUsername = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Fetch or create user data for the current device
 * @returns {Promise<object>} - Returns user data object {taker_id, taker_name, profile_pic_url}
 */
export const fetchOrCreateUserData = async () => {
  try {
    const deviceId = await getDeviceId();
    console.log(`Fetching user data for device: ${deviceId}`);

    const {data, error} = await supabase
      .from('user_data')
      .select('*')
      .eq('taker_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }

    if (data) {
      console.log('User data found:', data);
      return data;
    }

    console.log('No user data found, creating new user...');
    const randomUsername = generateRandomUsername();

    const {data: newData, error: insertError} = await supabase
      .from('user_data')
      .insert([
        {
          taker_id: deviceId,
          taker_name: randomUsername,
          profile_pic_url: null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user data:', insertError);
      throw insertError;
    }

    console.log('User data created:', newData);
    return newData;
  } catch (error) {
    console.error('Error in fetchOrCreateUserData:', error);
    throw error;
  }
};

/**
 * Update username for the current device
 * @param {string} newUsername - New username to set
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const updateUsername = async (newUsername) => {
  try {
    const deviceId = await getDeviceId();
    console.log(`Updating username for device: ${deviceId} to: ${newUsername}`);

    const {error} = await supabase
      .from('user_data')
      .update({taker_name: newUsername})
      .eq('taker_id', deviceId);

    if (error) {
      console.error('Error updating username:', error);
      throw error;
    }

    console.log('Username updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateUsername:', error);
    return false;
  }
};

/**
 * Update profile picture URL for the current device
 * @param {string} profilePicUrl - New profile picture URL (R2 URL)
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const updateProfilePicture = async (profilePicUrl) => {
  try {
    const deviceId = await getDeviceId();
    console.log(`Updating profile picture for device: ${deviceId}`);

    const {error} = await supabase
      .from('user_data')
      .update({profile_pic_url: profilePicUrl})
      .eq('taker_id', deviceId);

    if (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }

    console.log('Profile picture updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateProfilePicture:', error);
    return false;
  }
};
