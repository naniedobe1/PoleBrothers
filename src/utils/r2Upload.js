import {CLOUDFLARE_WORKER_URL} from '@env';
import RNFS from 'react-native-fs';

/**
 * Upload image to Cloudflare R2 via presigned URL
 * @param {string} imageUri - Local file URI of the image
 * @param {string} filename - Desired filename
 * @returns {Promise<string>} - Returns the public URL of the uploaded image
 */
export const uploadToR2 = async (imageUri, filename) => {
  try {
    // Step 1: Request presigned URL from Cloudflare Worker
    console.log('Requesting presigned URL from worker...');
    console.log('Worker URL:', CLOUDFLARE_WORKER_URL);
    console.log('Worker URL type:', typeof CLOUDFLARE_WORKER_URL);

    const presignedResponse = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: filename,
        contentType: 'image/jpeg',
      }),
    });

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text();
      throw new Error(`Failed to get presigned URL: ${errorText}`);
    }

    const {uploadUrl, publicUrl} = await presignedResponse.json();
    console.log('Received presigned URL');
    console.log('Upload URL:', uploadUrl.substring(0, 100) + '...');
    console.log('Public URL:', publicUrl);

    // Step 2: Read the image file directly from camera temp path
    // Remove file:// prefix if present for RNFS
    let filePath = imageUri.replace('file://', '');
    console.log('Reading image file from:', filePath);

    const fileExists = await RNFS.exists(filePath);
    console.log('File exists:', fileExists);

    if (!fileExists) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const fileBase64 = await RNFS.readFile(filePath, 'base64');
    console.log('File read successfully, base64 length:', fileBase64.length);

    // Step 3: Upload to R2 using fetch with proper binary handling
    console.log('Starting R2 upload with fetch...');

    // Convert base64 to Uint8Array (proper binary data)
    const binaryString = atob(fileBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    console.log('Binary data size:', bytes.length, 'bytes');

    // Upload using fetch with ArrayBuffer
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: bytes.buffer,
    });

    console.log('R2 upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log('R2 upload error:', errorText);
      throw new Error(`R2 upload failed: ${uploadResponse.status} ${errorText}`);
    }

    console.log('Upload completed successfully');

    console.log('Upload successful!', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
};

/**
 * Generate a unique filename for the image
 * @returns {string} - Unique filename with timestamp
 */
export const generateFilename = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `pole_${timestamp}_${random}.jpg`;
};
