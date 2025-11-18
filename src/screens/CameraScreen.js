import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {colors} from '../theme/colors';
import {savePhoto} from '../utils/storage';
import {getCurrentLocation} from '../utils/location';
import {uploadToR2, generateFilename} from '../utils/r2Upload';
import {savePoleToDatabase} from '../utils/database';

const CameraScreen = () => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleCapture = async () => {
    if (!camera.current || isCapturing) return;

    try {
      setIsCapturing(true);

      // Take photo
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
      });

      console.log('Photo object:', JSON.stringify(photo, null, 2));

      // Get GPS coordinates
      const location = await getCurrentLocation();

      // Save photo locally as backup
      const savedPath = await savePhoto(photo.path);
      console.log('Photo saved locally:', savedPath);

      // Generate unique filename
      const filename = generateFilename();

      // Upload to R2 - use the saved path instead of photo.path
      console.log('Uploading to R2...');
      console.log('Using saved path:', savedPath);
      const r2Url = await uploadToR2(savedPath, filename);

      // Save to Supabase database
      console.log('Saving to Supabase...');
      const savedRecord = await savePoleToDatabase({
        image_uri: r2Url,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      // Log the complete data
      console.log('===== PHOTO CAPTURED =====');
      console.log('R2 Image URL:', r2Url);
      console.log('Location:', location);
      console.log('Database Record:', savedRecord);
      console.log('Timestamp:', new Date().toISOString());
      console.log('==========================');

      Alert.alert(
        'Success',
        `Photo uploaded!\nStatus: ${savedRecord.status}\nURL: ${r2Url}`,
      );
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert(
        'Error',
        `Failed to capture photo: ${error.message || 'Unknown error'}`,
      );
    } finally {
      setIsCapturing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        onInitialized={() => setIsCameraReady(true)}
      />

      {isCameraReady && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCapturing}>
            {isCapturing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
  },
});

export default CameraScreen;
