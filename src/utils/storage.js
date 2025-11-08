import RNFS from 'react-native-fs';

const PHOTO_DIR = `${RNFS.TemporaryDirectoryPath}/photos`;

/**
 * Initialize the photos directory
 */
export const initPhotoDirectory = async () => {
  try {
    const exists = await RNFS.exists(PHOTO_DIR);
    if (!exists) {
      await RNFS.mkdir(PHOTO_DIR);
    }
  } catch (error) {
    console.error('Error initializing photo directory:', error);
  }
};

/**
 * Save a photo to the /tmp/photos directory
 * @param {string} sourceUri - Source path of the photo
 * @returns {Promise<string>} - Returns the saved file path
 */
export const savePhoto = async (sourceUri) => {
  try {
    await initPhotoDirectory();
    const timestamp = Date.now();
    const filename = `photo_${timestamp}.jpg`;
    const destPath = `${PHOTO_DIR}/${filename}`;

    await RNFS.moveFile(sourceUri, destPath);
    return destPath;
  } catch (error) {
    console.error('Error saving photo:', error);
    throw error;
  }
};

/**
 * Load all photos from the /tmp/photos directory
 * @returns {Promise<Array>} - Returns array of photo file paths
 */
export const loadPhotos = async () => {
  try {
    await initPhotoDirectory();
    const files = await RNFS.readDir(PHOTO_DIR);

    // Filter only image files and sort by modification time (newest first)
    const photos = files
      .filter(file => file.name.endsWith('.jpg') || file.name.endsWith('.png'))
      .sort((a, b) => b.mtime - a.mtime)
      .map(file => file.path);

    return photos;
  } catch (error) {
    console.error('Error loading photos:', error);
    return [];
  }
};

/**
 * Get photo metadata from filename
 * @param {string} filepath - Path to photo file
 * @returns {object} - Returns metadata object
 */
export const getPhotoMetadata = (filepath) => {
  try {
    const filename = filepath.split('/').pop();
    const timestampStr = filename.replace('photo_', '').replace('.jpg', '');
    const timestamp = parseInt(timestampStr, 10);

    return {
      filename,
      timestamp,
      filepath,
    };
  } catch (error) {
    console.error('Error getting photo metadata:', error);
    return null;
  }
};
