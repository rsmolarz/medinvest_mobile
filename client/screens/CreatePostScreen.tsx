/**
 * CreatePost Screen
 * Create new posts with media, mentions, and hashtags
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { postsApi, roomsApi, searchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Room } from '@/types';

type CreatePostRouteParams = {
  CreatePost: {
    roomSlug?: string;
  };
};

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  duration?: number;
}

const MAX_MEDIA = 10;
const MAX_VIDEOS = 1; // Limit videos per post
const MAX_CONTENT_LENGTH = 5000;

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CreatePostRouteParams, 'CreatePost'>>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [hashtagQuery, setHashtagQuery] = useState<string | null>(null);

  // Legacy support
  const images = media.filter(m => m.type === 'image').map(m => m.uri);
  const videos = media.filter(m => m.type === 'video');
  const setImages = (uris: string[]) => {
    setMedia([...videos, ...uris.map(uri => ({ uri, type: 'image' as const }))]);
  };

  // Fetch rooms
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await roomsApi.getRooms();
      return response.data?.rooms || [];
    },
  });

  // Autocomplete for mentions
  const { data: mentionSuggestions } = useQuery({
    queryKey: ['autocomplete', 'users', mentionQuery],
    queryFn: async () => {
      if (!mentionQuery) return [];
      const response = await searchApi.autocomplete(mentionQuery, 'users');
      return response.data?.suggestions || [];
    },
    enabled: !!mentionQuery && mentionQuery.length > 0,
  });

  // Autocomplete for hashtags
  const { data: hashtagSuggestions } = useQuery({
    queryKey: ['autocomplete', 'hashtags', hashtagQuery],
    queryFn: async () => {
      if (!hashtagQuery) return [];
      const response = await searchApi.autocomplete(hashtagQuery, 'hashtags');
      return response.data?.suggestions || [];
    },
    enabled: !!hashtagQuery && hashtagQuery.length > 0,
  });

  // Set initial room if provided
  React.useEffect(() => {
    if (route.params?.roomSlug && roomsData) {
      const room = roomsData.find(r => r.slug === route.params.roomSlug);
      if (room) setSelectedRoom(room);
    }
  }, [route.params?.roomSlug, roomsData]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoom) throw new Error('Please select a room');
      if (!content.trim()) throw new Error('Please add some content');

      const imageUris = media.filter(m => m.type === 'image').map(m => m.uri);
      const videoUri = media.find(m => m.type === 'video')?.uri;

      const response = await postsApi.createPost({
        content: content.trim(),
        room_id: selectedRoom.id,
        is_anonymous: isAnonymous,
        images: imageUris.length > 0 ? imageUris : undefined,
        video: videoUri,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create post');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  // Handle image picking
  const handlePickImages = async () => {
    if (media.length >= MAX_MEDIA) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_MEDIA} media items`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_MEDIA - media.length,
    });

    if (!result.canceled) {
      const newMedia: MediaItem[] = result.assets.map(asset => ({
        uri: asset.uri,
        type: 'image',
      }));
      setMedia([...media, ...newMedia].slice(0, MAX_MEDIA));
    }
  };

  // Handle video picking
  const handlePickVideo = async () => {
    if (videos.length >= MAX_VIDEOS) {
      Alert.alert('Limit Reached', `You can only add ${MAX_VIDEOS} video per post`);
      return;
    }
    if (media.length >= MAX_MEDIA) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_MEDIA} media items`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newVideo: MediaItem = {
        uri: asset.uri,
        type: 'video',
        duration: asset.duration ?? undefined,
      };
      setMedia([...media, newVideo]);
    }
  };

  // Handle camera capture
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newMedia: MediaItem = {
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        duration: asset.duration ?? undefined,
      };
      
      if (newMedia.type === 'video' && videos.length >= MAX_VIDEOS) {
        Alert.alert('Limit Reached', `You can only add ${MAX_VIDEOS} video per post`);
        return;
      }
      
      setMedia([...media, newMedia].slice(0, MAX_MEDIA));
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Handle text change with autocomplete detection
  const handleContentChange = (text: string) => {
    setContent(text);

    // Detect @mentions
    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setHashtagQuery(null);
    } 
    // Detect #hashtags
    else {
      const hashtagMatch = text.match(/#(\w*)$/);
      if (hashtagMatch) {
        setHashtagQuery(hashtagMatch[1]);
        setMentionQuery(null);
      } else {
        setMentionQuery(null);
        setHashtagQuery(null);
      }
    }
  };

  // Insert suggestion
  const handleInsertSuggestion = (suggestion: string, type: 'mention' | 'hashtag') => {
    const prefix = type === 'mention' ? '@' : '#';
    const pattern = type === 'mention' ? /@\w*$/ : /#\w*$/;
    
    setContent(content.replace(pattern, `${prefix}${suggestion} `));
    setMentionQuery(null);
    setHashtagQuery(null);
    inputRef.current?.focus();
  };

  const canPost = content.trim().length > 0 && selectedRoom !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}
            onPress={() => createPostMutation.mutate()}
            disabled={!canPost || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.postButtonText}>Post</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Room Selector */}
          <TouchableOpacity
            style={styles.roomSelector}
            onPress={() => setShowRoomPicker(!showRoomPicker)}
          >
            {selectedRoom ? (
              <>
                <ThemedText style={styles.roomIcon}>{selectedRoom.icon}</ThemedText>
                <ThemedText style={[styles.roomName, { color: selectedRoom.color }]}>
                  {selectedRoom.name}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.roomPlaceholder}>Select a room</ThemedText>
            )}
            <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Room Picker Dropdown */}
          {showRoomPicker && (
            <View style={styles.roomPicker}>
              {roomsData?.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    styles.roomOption,
                    selectedRoom?.id === room.id && styles.roomOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedRoom(room);
                    setShowRoomPicker(false);
                  }}
                >
                  <ThemedText style={styles.roomIcon}>{room.icon}</ThemedText>
                  <ThemedText style={styles.roomOptionName}>{room.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Author Info */}
          <View style={styles.authorRow}>
            {isAnonymous ? (
              <View style={[styles.avatar, styles.anonymousAvatar]}>
                <Ionicons name="person" size={20} color={Colors.textSecondary} />
              </View>
            ) : user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ThemedText style={styles.avatarText}>
                  {user?.name?.[0]}
                </ThemedText>
              </View>
            )}
            <ThemedText style={styles.authorName}>
              {isAnonymous ? 'Anonymous' : user?.name}
            </ThemedText>
          </View>

          {/* Content Input */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.textSecondary}
            multiline
            value={content}
            onChangeText={handleContentChange}
            maxLength={MAX_CONTENT_LENGTH}
            autoFocus
          />

          {/* Character Count */}
          <View style={styles.charCount}>
            <ThemedText style={[
              styles.charCountText,
              content.length > MAX_CONTENT_LENGTH * 0.9 && styles.charCountWarning,
            ]}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </ThemedText>
          </View>

          {/* Autocomplete Suggestions */}
          {(mentionQuery !== null && mentionSuggestions && mentionSuggestions.length > 0) && (
            <View style={styles.suggestions}>
              {mentionSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleInsertSuggestion(suggestion, 'mention')}
                >
                  <Ionicons name="at" size={16} color={Colors.primary} />
                  <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(hashtagQuery !== null && hashtagSuggestions && hashtagSuggestions.length > 0) && (
            <View style={styles.suggestions}>
              {hashtagSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleInsertSuggestion(suggestion, 'hashtag')}
                >
                  <ThemedText style={styles.hashtagIcon}>#</ThemedText>
                  <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Media Preview (Images & Videos) */}
          {media.length > 0 && (
            <ScrollView horizontal style={styles.imagesContainer} showsHorizontalScrollIndicator={false}>
              {media.map((item, index) => (
                <View key={index} style={styles.imageWrapper}>
                  {item.type === 'video' ? (
                    <View style={styles.videoPreviewContainer}>
                      <View style={[styles.previewImage, styles.videoPlaceholder]}>
                        <Ionicons name="videocam" size={40} color={Colors.textSecondary} />
                      </View>
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={32} color="white" />
                        {item.duration ? (
                          <ThemedText style={styles.videoDuration}>
                            {Math.floor(item.duration / 1000)}s
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: item.uri }} style={styles.previewImage} />
                  )}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveMedia(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </ScrollView>

        {/* Bottom Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <TouchableOpacity style={styles.toolbarButton} onPress={handlePickImages}>
              <Ionicons name="image-outline" size={24} color={Colors.primary} />
              {images.length > 0 && (
                <View style={styles.imageBadge}>
                  <ThemedText style={styles.imageBadgeText}>{images.length}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toolbarButton, videos.length >= MAX_VIDEOS && styles.toolbarButtonDisabled]} 
              onPress={handlePickVideo}
              disabled={videos.length >= MAX_VIDEOS}
            >
              <Ionicons 
                name="videocam-outline" 
                size={24} 
                color={videos.length >= MAX_VIDEOS ? Colors.textSecondary : Colors.primary} 
              />
              {videos.length > 0 && (
                <View style={[styles.imageBadge, styles.videoBadge]}>
                  <ThemedText style={styles.imageBadgeText}>{videos.length}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleCamera}>
              <Ionicons name="camera-outline" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.anonymousToggle, isAnonymous && styles.anonymousToggleActive]}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <Ionicons
              name={isAnonymous ? 'eye-off' : 'eye-off-outline'}
              size={18}
              color={isAnonymous ? Colors.primary : Colors.textSecondary}
            />
            <ThemedText style={[
              styles.anonymousText,
              isAnonymous && styles.anonymousTextActive,
            ]}>
              Anonymous
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  postButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  roomSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  roomIcon: {
    fontSize: 16,
  },
  roomName: {
    ...Typography.body,
    fontWeight: '500',
    flex: 1,
  },
  roomPlaceholder: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  roomPicker: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  roomOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roomOptionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  roomOptionName: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  anonymousAvatar: {
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
  charCountText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  charCountWarning: {
    color: Colors.warning,
  },
  suggestions: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hashtagIcon: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  suggestionText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  imagesContainer: {
    marginTop: Spacing.md,
  },
  imageWrapper: {
    marginRight: Spacing.sm,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
  },
  videoPlaceholder: {
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDuration: {
    ...Typography.small,
    color: 'white',
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toolbarButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  imageBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    backgroundColor: Colors.secondary,
  },
  imageBadgeText: {
    ...Typography.small,
    color: 'white',
    fontWeight: '600',
    fontSize: 10,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    gap: Spacing.xs,
  },
  anonymousToggleActive: {
    backgroundColor: Colors.primary + '15',
  },
  anonymousText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  anonymousTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
