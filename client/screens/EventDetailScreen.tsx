/**
 * EventDetail Screen
 * View event info and RSVP
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { contentApi } from '@/lib/api';
import { Event } from '@/types';
import { formatDate, formatNumber } from '@/lib/utils';

type EventDetailRouteParams = {
  EventDetail: {
    eventId: number;
  };
};

export default function EventDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<EventDetailRouteParams, 'EventDetail'>>();
  const { eventId } = route.params;
  const queryClient = useQueryClient();
  const appColors = useAppColors();

  // Fetch event details
  const {
    data: event,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await contentApi.getEvent(eventId);
      return response.data;
    },
  });

  // Attend/Unattend mutation
  const attendMutation = useMutation({
    mutationFn: async () => {
      if (event?.is_attending) {
        return contentApi.unattendEvent(eventId);
      }
      return contentApi.attendEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const handleAttend = useCallback(() => {
    attendMutation.mutate();
  }, [attendMutation]);

  const handleShare = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Check out this event: ${event.title}`,
        url: event.external_url || undefined,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [event]);

  const handleOpenMap = useCallback(() => {
    if (!event?.location) return;
    const url = `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
    Linking.openURL(url);
  }, [event]);

  const handleHostPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'virtual': return Colors.primary;
      case 'in-person': return Colors.secondary;
      case 'hybrid': return appColors.warning;
      default: return Colors.primary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ThemedText>Event not found</ThemedText>
      </SafeAreaView>
    );
  }

  const eventDate = new Date(event.start_time);
  const isPast = eventDate < new Date();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Event</ThemedText>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cover */}
        {event.cover_image ? (
          <Image source={{ uri: event.cover_image }} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverPlaceholder}
          >
            <MaterialCommunityIcons name="calendar-star" size={64} color="white" />
          </LinearGradient>
        )}

        {/* Event Info */}
        <View style={[styles.eventInfo, { backgroundColor: appColors.surface }]}>
          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: getEventTypeColor(event.type) + '20' }]}>
            <Ionicons
              name={event.type === 'virtual' ? 'videocam' : event.type === 'hybrid' ? 'git-merge' : 'location'}
              size={14}
              color={getEventTypeColor(event.type)}
            />
            <ThemedText style={[styles.typeText, { color: getEventTypeColor(event.type) }]}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </ThemedText>
          </View>

          <ThemedText style={[styles.eventTitle, { color: appColors.textPrimary }]}>{event.title}</ThemedText>

          {/* Date & Time */}
          <View style={styles.dateTimeSection}>
            <View style={styles.dateBox}>
              <ThemedText style={styles.dateMonth}>
                {eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()}
              </ThemedText>
              <ThemedText style={styles.dateDay}>{eventDate.getDate()}</ThemedText>
            </View>
            <View style={styles.timeInfo}>
              <ThemedText style={[styles.timeText, { color: appColors.textPrimary }]}>
                {eventDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </ThemedText>
              <ThemedText style={[styles.timeDetail, { color: appColors.textSecondary }]}>
                {eventDate.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}
                {event.end_time && ` - ${new Date(event.end_time).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })}`}
              </ThemedText>
            </View>
          </View>

          {/* Location */}
          {event.location && (
            <TouchableOpacity style={styles.locationSection} onPress={handleOpenMap}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <ThemedText style={[styles.locationLabel, { color: appColors.textSecondary }]}>Location</ThemedText>
                <ThemedText style={[styles.locationText, { color: appColors.textPrimary }]}>{event.location}</ThemedText>
              </View>
              <Ionicons name="open-outline" size={18} color={appColors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Virtual Link */}
          {event.meeting_url && (
            <TouchableOpacity
              style={styles.virtualSection}
              onPress={() => Linking.openURL(event.meeting_url!)}
            >
              <View style={[styles.locationIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="videocam-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <ThemedText style={[styles.locationLabel, { color: appColors.textSecondary }]}>Join Online</ThemedText>
                <ThemedText style={styles.virtualLink}>Click to join meeting</ThemedText>
              </View>
              <Ionicons name="open-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* Attendees */}
          <View style={styles.attendeesSection}>
            <View style={styles.attendeesAvatars}>
              {/* Placeholder for attendee avatars */}
              <View style={[styles.attendeeAvatar, { backgroundColor: Colors.primary + '20', borderColor: appColors.surface }]} />
              <View style={[styles.attendeeAvatar, { backgroundColor: Colors.secondary + '20', marginLeft: -8, borderColor: appColors.surface }]} />
              <View style={[styles.attendeeAvatar, { backgroundColor: Colors.warning + '20', marginLeft: -8, borderColor: appColors.surface }]} />
            </View>
            <ThemedText style={[styles.attendeesText, { color: appColors.textSecondary }]}>
              {formatNumber(event.attendees_count)} attending
            </ThemedText>
          </View>

          {/* Host */}
          <TouchableOpacity
            style={styles.hostSection}
            onPress={() => handleHostPress(event.host.id)}
          >
            {event.host.avatar_url ? (
              <Image source={{ uri: event.host.avatar_url }} style={styles.hostAvatar} />
            ) : (
              <View style={[styles.hostAvatar, styles.hostAvatarPlaceholder]}>
                <ThemedText style={styles.hostAvatarText}>
                  {event.host.first_name[0]}{event.host.last_name[0]}
                </ThemedText>
              </View>
            )}
            <View style={styles.hostInfo}>
              <ThemedText style={[styles.hostLabel, { color: appColors.textSecondary }]}>Hosted by</ThemedText>
              <ThemedText style={[styles.hostName, { color: appColors.textPrimary }]}>{event.host.full_name}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={appColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={[styles.descriptionSection, { backgroundColor: appColors.surface }]}>
          <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>About This Event</ThemedText>
          <ThemedText style={[styles.descriptionText, { color: appColors.textSecondary }]}>{event.description}</ThemedText>
        </View>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <View style={[styles.tagsSection, { backgroundColor: appColors.surface }]}>
            <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Topics</ThemedText>
            <View style={styles.tagsContainer}>
              {event.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={[styles.tagText, { color: appColors.textSecondary }]}>#{tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* RSVP Button */}
      {!isPast && (
        <View style={[styles.footer, { backgroundColor: appColors.surface, borderTopColor: appColors.border }]}>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              event.is_attending && styles.rsvpButtonAttending,
            ]}
            onPress={handleAttend}
            disabled={attendMutation.isPending}
          >
            {attendMutation.isPending ? (
              <ActivityIndicator color={event.is_attending ? appColors.textSecondary : 'white'} />
            ) : (
              <>
                <Ionicons
                  name={event.is_attending ? 'checkmark-circle' : 'calendar-outline'}
                  size={20}
                  color={event.is_attending ? Colors.secondary : 'white'}
                />
                <ThemedText style={[
                  styles.rsvpButtonText,
                  event.is_attending && styles.rsvpButtonTextAttending,
                ]}>
                  {event.is_attending ? "You're Attending" : 'RSVP - Attend Event'}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  shareButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    padding: Spacing.lg,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  typeText: {
    ...Typography.small,
    fontWeight: '600',
  },
  eventTitle: {
    ...Typography.title,
    marginBottom: Spacing.lg,
  },
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dateMonth: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  dateDay: {
    ...Typography.heading,
    color: Colors.primary,
    fontWeight: '700',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    ...Typography.body,
    fontWeight: '500',
  },
  timeDetail: {
    ...Typography.caption,
    marginTop: 2,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    ...Typography.small,
  },
  locationText: {
    ...Typography.body,
    fontWeight: '500',
  },
  virtualSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  virtualLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '500',
  },
  attendeesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  attendeesAvatars: {
    flexDirection: 'row',
    marginRight: Spacing.sm,
  },
  attendeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  attendeesText: {
    ...Typography.caption,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  hostAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    ...Typography.small,
  },
  hostName: {
    ...Typography.body,
    fontWeight: '600',
  },
  descriptionSection: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    ...Typography.body,
    lineHeight: 24,
  },
  tagsSection: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.caption,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.button,
  },
  rsvpButtonAttending: {
    backgroundColor: Colors.secondary + '15',
  },
  rsvpButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '700',
  },
  rsvpButtonTextAttending: {
    color: Colors.secondary,
  },
});
