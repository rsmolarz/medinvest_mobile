/**
 * Media Picker Utility
 * Handle photo and video selection/capture
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

export interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number; // Video duration in ms
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface MediaPickerOptions {
  mediaTypes?: 'images' | 'videos' | 'all';
  allowsMultipleSelection?: boolean;
  maxSelection?: number;
  quality?: number;
  maxDuration?: number; // Max video duration in seconds
  maxFileSize?: number; // Max file size in bytes
}

const DEFAULT_OPTIONS: MediaPickerOptions = {
  mediaTypes: 'all',
  allowsMultipleSelection: true,
  maxSelection: 10,
  quality: 0.8,
  maxDuration: 60, // 60 seconds
  maxFileSize: 50 * 1024 * 1024, // 50MB
};

/**
 * Request media library permissions
 */
export async function requestMediaPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please grant access to your photo library to upload media.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please grant camera access to take photos and videos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

/**
 * Get media type from ImagePicker
 */
function getMediaType(asset: ImagePicker.ImagePickerAsset): 'image' | 'video' {
  if (asset.type === 'video') return 'video';
  // Check file extension as fallback
  const uri = asset.uri.toLowerCase();
  if (uri.endsWith('.mp4') || uri.endsWith('.mov') || uri.endsWith('.avi') || uri.endsWith('.webm')) {
    return 'video';
  }
  return 'image';
}

/**
 * Get file info
 */
async function getFileInfo(uri: string): Promise<{ size: number; exists: boolean }> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return {
      size: info.exists && 'size' in info ? info.size : 0,
      exists: info.exists,
    };
  } catch {
    return { size: 0, exists: false };
  }
}

/**
 * Convert ImagePicker asset to MediaAsset
 */
async function convertToMediaAsset(asset: ImagePicker.ImagePickerAsset): Promise<MediaAsset> {
  const fileInfo = await getFileInfo(asset.uri);
  const type = getMediaType(asset);
  
  return {
    uri: asset.uri,
    type,
    width: asset.width,
    height: asset.height,
    duration: asset.duration ? asset.duration * 1000 : undefined,
    fileName: asset.fileName || `media_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
    fileSize: fileInfo.size,
    mimeType: type === 'video' ? 'video/mp4' : 'image/jpeg',
  };
}

/**
 * Validate media asset against options
 */
function validateAsset(asset: MediaAsset, options: MediaPickerOptions): string | null {
  // Check file size
  if (options.maxFileSize && asset.fileSize && asset.fileSize > options.maxFileSize) {
    const maxMB = Math.round(options.maxFileSize / (1024 * 1024));
    return `File size exceeds ${maxMB}MB limit`;
  }

  // Check video duration
  if (asset.type === 'video' && options.maxDuration && asset.duration) {
    const durationSeconds = asset.duration / 1000;
    if (durationSeconds > options.maxDuration) {
      return `Video exceeds ${options.maxDuration} seconds limit`;
    }
  }

  return null;
}

/**
 * Pick media from library
 */
export async function pickMedia(options: MediaPickerOptions = {}): Promise<MediaAsset[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Request permissions
  const hasPermission = await requestMediaPermissions();
  if (!hasPermission) return [];

  // Determine media types
  let mediaTypes: ImagePicker.MediaTypeOptions;
  switch (opts.mediaTypes) {
    case 'images':
      mediaTypes = ImagePicker.MediaTypeOptions.Images;
      break;
    case 'videos':
      mediaTypes = ImagePicker.MediaTypeOptions.Videos;
      break;
    default:
      mediaTypes = ImagePicker.MediaTypeOptions.All;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsMultipleSelection: opts.allowsMultipleSelection,
      selectionLimit: opts.maxSelection,
      quality: opts.quality,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      videoMaxDuration: opts.maxDuration,
    });

    if (result.canceled || !result.assets) return [];

    // Convert and validate assets
    const mediaAssets: MediaAsset[] = [];
    const errors: string[] = [];

    for (const asset of result.assets) {
      const mediaAsset = await convertToMediaAsset(asset);
      const error = validateAsset(mediaAsset, opts);
      
      if (error) {
        errors.push(error);
      } else {
        mediaAssets.push(mediaAsset);
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      Alert.alert('Some files skipped', errors.join('\n'));
    }

    return mediaAssets;
  } catch (error) {
    console.error('Error picking media:', error);
    Alert.alert('Error', 'Failed to select media');
    return [];
  }
}

/**
 * Capture photo or video with camera
 */
export async function captureMedia(
  type: 'photo' | 'video',
  options: MediaPickerOptions = {}
): Promise<MediaAsset | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Request permissions
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: type === 'photo' 
        ? ImagePicker.MediaTypeOptions.Images 
        : ImagePicker.MediaTypeOptions.Videos,
      quality: opts.quality,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      videoMaxDuration: opts.maxDuration,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const mediaAsset = await convertToMediaAsset(result.assets[0]);
    const error = validateAsset(mediaAsset, opts);

    if (error) {
      Alert.alert('Error', error);
      return null;
    }

    return mediaAsset;
  } catch (error) {
    console.error('Error capturing media:', error);
    Alert.alert('Error', 'Failed to capture media');
    return null;
  }
}

/**
 * Show media picker action sheet
 */
export function showMediaPickerOptions(
  onPickFromLibrary: () => void,
  onTakePhoto: () => void,
  onTakeVideo: () => void
): void {
  Alert.alert(
    'Add Media',
    'Choose an option',
    [
      { text: 'Photo Library', onPress: onPickFromLibrary },
      { text: 'Take Photo', onPress: onTakePhoto },
      { text: 'Record Video', onPress: onTakeVideo },
      { text: 'Cancel', style: 'cancel' },
    ],
    { cancelable: true }
  );
}

/**
 * Generate thumbnail from video (placeholder - would need native module)
 */
export async function generateVideoThumbnail(videoUri: string): Promise<string | null> {
  // In a real app, you'd use a library like expo-video-thumbnails
  // For now, return null (use first frame or poster)
  return null;
}

/**
 * Compress video before upload (placeholder - would need native module)
 */
export async function compressVideo(
  videoUri: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<string> {
  // In a real app, you'd use a library like react-native-video-processing
  // For now, return original URI
  return videoUri;
}

/**
 * Upload media to server
 */
export async function uploadMedia(
  asset: MediaAsset,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; thumbnailUrl?: string } | null> {
  try {
    const formData = new FormData();
    
    formData.append('file', {
      uri: asset.uri,
      type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      name: asset.fileName || `upload_${Date.now()}`,
    } as any);

    formData.append('type', asset.type);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      url: data.url,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}
