import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  fetchOrCreateUserData,
  updateUsername,
  updateProfilePicture,
} from '../utils/database';
import {uploadToR2, generateFilename} from '../utils/r2Upload';
import {colors} from '../theme/colors';
import {fontSize, padding} from '../theme/styles';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await fetchOrCreateUserData();
      setUserData(data);
      setTempUsername(data.taker_name || '');
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeProfilePicture = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        console.error('ImagePicker Error:', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
        return;
      }

      if (response.assets && response.assets[0]) {
        try {
          setUploading(true);
          const asset = response.assets[0];
          const filename = generateFilename();

          console.log('Uploading profile picture...');
          const r2Url = await uploadToR2(asset.uri, filename);

          console.log('Updating profile picture in database...');
          await updateProfilePicture(r2Url);

          setUserData(prev => ({...prev, profile_pic_url: r2Url}));
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          Alert.alert('Error', 'Failed to upload profile picture');
        } finally {
          setUploading(false);
        }
      }
    });
  };

  const handleSaveUsername = async () => {
    if (!tempUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateUsername(tempUsername.trim());
      setUserData(prev => ({...prev, taker_name: tempUsername.trim()}));
      setEditingUsername(false);
      Alert.alert('Success', 'Username updated!');
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setTempUsername(userData?.taker_name || '');
    setEditingUsername(false);
  };

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const profileImage = userData?.profile_pic_url
    ? {uri: userData.profile_pic_url}
    : require('../../assets/blankpfp.png');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            <Image source={profileImage} style={styles.profilePicture} />
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleChangeProfilePicture}
            disabled={uploading}>
            <Text style={styles.changePhotoText}>
              {uploading ? 'Uploading...' : 'Change Profile Picture'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Username Section */}
        <View style={styles.usernameSection}>
          <Text style={styles.sectionLabel}>Username</Text>
          {editingUsername ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.usernameInput}
                value={tempUsername}
                onChangeText={setTempUsername}
                placeholder="Enter username"
                placeholderTextColor={colors.gray}
                maxLength={50}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancelEdit}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveUsername}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.usernameDisplay}>
              <Text style={styles.usernameText}>
                {userData?.taker_name || 'No username'}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditingUsername(true)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBrown,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBrown,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSize.medium,
    color: colors.gray,
  },
  content: {
    padding: padding.lg,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.gray,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: fontSize.medium,
    color: colors.white,
    fontWeight: '600',
  },
  usernameSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: fontSize.medium,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
  },
  usernameDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: padding.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  usernameText: {
    fontSize: fontSize.large,
    color: colors.black,
    flex: 1,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: fontSize.small,
    color: colors.white,
    fontWeight: '600',
  },
  editContainer: {
    backgroundColor: colors.secondary,
    padding: padding.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  usernameInput: {
    fontSize: fontSize.large,
    color: colors.black,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 8,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: colors.gray,
  },
  cancelButtonText: {
    fontSize: fontSize.medium,
    color: colors.white,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: fontSize.medium,
    color: colors.white,
    fontWeight: '600',
  },
});

export default ProfileScreen;
