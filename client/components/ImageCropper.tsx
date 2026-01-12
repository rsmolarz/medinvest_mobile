/**
 * Image Cropper Component
 * Crop images before uploading (profile photos, posts)
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageCropperProps {
  visible: boolean;
  imageUri: string;
  aspectRatio?: number; // width/height, e.g., 1 for square, 16/9 for landscape
  cropShape?: 'rectangle' | 'circle';
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  visible,
  imageUri,
  aspectRatio = 1,
  cropShape = 'rectangle',
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animation values for pan and zoom
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const lastOffset = useRef({ x: 0, y: 0 });

  // Calculate crop area dimensions
  const getCropAreaSize = useCallback(() => {
    const maxWidth = SCREEN_WIDTH - 48;
    const maxHeight = SCREEN_HEIGHT * 0.5;
    
    let cropWidth = maxWidth;
    let cropHeight = cropWidth / aspectRatio;
    
    if (cropHeight > maxHeight) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * aspectRatio;
    }
    
    return { width: cropWidth, height: cropHeight };
  }, [aspectRatio]);

  const cropArea = getCropAreaSize();

  // Load image dimensions
  React.useEffect(() => {
    if (imageUri) {
      Image.getSize(imageUri, (width, height) => {
        setImageSize({ width, height });
      });
    }
  }, [imageUri]);

  // Calculate initial image scale to fill crop area
  const getInitialScale = useCallback(() => {
    if (imageSize.width === 0 || imageSize.height === 0) return 1;
    
    const scaleX = cropArea.width / imageSize.width;
    const scaleY = cropArea.height / imageSize.height;
    
    // Use the larger scale to ensure image fills the crop area
    return Math.max(scaleX, scaleY);
  }, [imageSize, cropArea]);

  const initialScale = getInitialScale();

  // Pan responder for drag and pinch gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastOffset.current.x,
          y: lastOffset.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // Handle pinch zoom with two fingers
        if (evt.nativeEvent.touches.length === 2) {
          // Simple pinch detection
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          // This is a simplified pinch - in production, use react-native-gesture-handler
        }
        
        // Pan movement
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(evt, gestureState);
      },
      
      onPanResponderRelease: () => {
        pan.flattenOffset();
        lastOffset.current = {
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        };
      },
    })
  ).current;

  // Handle zoom buttons
  const handleZoomIn = () => {
    const newScale = Math.min(lastScale.current * 1.2, 5);
    lastScale.current = newScale;
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false,
    }).start();
  };

  const handleZoomOut = () => {
    const minScale = initialScale;
    const newScale = Math.max(lastScale.current / 1.2, minScale);
    lastScale.current = newScale;
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false,
    }).start();
  };

  const handleReset = () => {
    lastScale.current = initialScale;
    lastOffset.current = { x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(scale, { toValue: initialScale, useNativeDriver: false }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }),
    ]).start();
  };

  // Crop the image
  const handleCrop = async () => {
    setIsProcessing(true);
    
    try {
      // Calculate crop region based on current pan and scale
      const currentScale = lastScale.current || initialScale;
      const offsetX = lastOffset.current.x;
      const offsetY = lastOffset.current.y;
      
      // Calculate the visible portion of the image
      const scaledWidth = imageSize.width * currentScale;
      const scaledHeight = imageSize.height * currentScale;
      
      // Center of crop area in image coordinates
      const centerX = (scaledWidth / 2 - offsetX) / currentScale;
      const centerY = (scaledHeight / 2 - offsetY) / currentScale;
      
      // Crop dimensions in original image coordinates
      const cropWidthInImage = cropArea.width / currentScale;
      const cropHeightInImage = cropArea.height / currentScale;
      
      // Origin of crop
      const originX = Math.max(0, centerX - cropWidthInImage / 2);
      const originY = Math.max(0, centerY - cropHeightInImage / 2);
      
      // Ensure crop is within bounds
      const finalWidth = Math.min(cropWidthInImage, imageSize.width - originX);
      const finalHeight = Math.min(cropHeightInImage, imageSize.height - originY);
      
      // Perform the crop
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(finalWidth),
              height: Math.round(finalHeight),
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      onCropComplete(result.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const displayedImageWidth = imageSize.width * initialScale;
  const displayedImageHeight = imageSize.height * initialScale;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Crop Image</ThemedText>
          <TouchableOpacity 
            style={[styles.headerButton, styles.doneButton]} 
            onPress={handleCrop}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ThemedText style={styles.doneText}>Done</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Crop Area */}
        <View 
          style={styles.cropContainer}
          onLayout={(e) => setContainerSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })}
        >
          {/* Image */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.imageContainer,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scale },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: imageUri }}
              style={{
                width: displayedImageWidth,
                height: displayedImageHeight,
              }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Crop Overlay */}
          <View style={styles.overlayContainer} pointerEvents="none">
            {/* Top overlay */}
            <View style={[styles.overlay, { height: (containerSize.height - cropArea.height) / 2 }]} />
            
            {/* Middle row */}
            <View style={styles.middleRow}>
              {/* Left overlay */}
              <View style={[styles.overlay, { width: (containerSize.width - cropArea.width) / 2 }]} />
              
              {/* Crop window */}
              <View 
                style={[
                  styles.cropWindow,
                  {
                    width: cropArea.width,
                    height: cropArea.height,
                    borderRadius: cropShape === 'circle' ? cropArea.width / 2 : BorderRadius.sm,
                  },
                ]}
              >
                {/* Corner guides */}
                <View style={[styles.cornerGuide, styles.topLeft]} />
                <View style={[styles.cornerGuide, styles.topRight]} />
                <View style={[styles.cornerGuide, styles.bottomLeft]} />
                <View style={[styles.cornerGuide, styles.bottomRight]} />
              </View>
              
              {/* Right overlay */}
              <View style={[styles.overlay, { width: (containerSize.width - cropArea.width) / 2 }]} />
            </View>
            
            {/* Bottom overlay */}
            <View style={[styles.overlay, { height: (containerSize.height - cropArea.height) / 2 }]} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
            <Ionicons name="remove" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <ThemedText style={styles.instructions}>
          Drag to reposition • Use buttons to zoom
        </ThemedText>
      </SafeAreaView>
    </Modal>
  );
}

// Preset cropper for profile photos
export function ProfilePhotoCropper({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
}: Omit<ImageCropperProps, 'aspectRatio' | 'cropShape'>) {
  return (
    <ImageCropper
      visible={visible}
      imageUri={imageUri}
      aspectRatio={1}
      cropShape="circle"
      onCropComplete={onCropComplete}
      onCancel={onCancel}
    />
  );
}

// Preset cropper for post images
export function PostImageCropper({
  visible,
  imageUri,
  aspectRatio = 4/3,
  onCropComplete,
  onCancel,
}: Omit<ImageCropperProps, 'cropShape'>) {
  return (
    <ImageCropper
      visible={visible}
      imageUri={imageUri}
      aspectRatio={aspectRatio}
      cropShape="rectangle"
      onCropComplete={onCropComplete}
      onCancel={onCancel}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    minWidth: 60,
  },
  headerTitle: {
    ...Typography.heading,
    color: 'white',
  },
  doneButton: {
    alignItems: 'flex-end',
  },
  doneText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  cropContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
  },
  cropWindow: {
    borderWidth: 2,
    borderColor: 'white',
    position: 'relative',
  },
  cornerGuide: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xl,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    ...Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingBottom: Spacing.lg,
  },
});
