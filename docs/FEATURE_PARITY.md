# MedInvest Feature Parity: Web vs Mobile

## Overview

This document tracks feature parity between the MedInvest web application and React Native mobile app. It helps identify gaps, prioritize development, and ensure consistent user experience across platforms.

**Last Updated**: January 2026

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented |
| 🚧 | In progress / Partial |
| ❌ | Not implemented |
| N/A | Not applicable to platform |

---

## Authentication & Onboarding

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Email/Password Login | ✅ | ✅ | ✅ | |
| Email/Password Registration | ✅ | ✅ | ✅ | |
| Google OAuth | ✅ | ✅ | ✅ | Uses expo-auth-session |
| GitHub OAuth | ✅ | ✅ | ✅ | Token exchange via backend |
| Apple Sign-In | N/A | ✅ | ✅ | iOS only via expo-apple-authentication |
| Facebook OAuth | ✅ | ✅ | ✅ | |
| Password Reset | ✅ | 🚧 | ✅ | ForgotPasswordScreen exists |
| Email Verification | ✅ | 🚧 | ✅ | VerifyEmailScreen exists |
| Biometric Login | N/A | ✅ | N/A | FaceID/TouchID via expo-local-authentication |
| Session Persistence | ✅ | ✅ | ✅ | JWT tokens |
| Logout | ✅ | ✅ | ✅ | |
| Logout All Devices | ✅ | 🚧 | ✅ | API exists |
| Onboarding Flow | ✅ | ✅ | N/A | OnboardingScreen |

---

## Main Navigation

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Discover Tab | ✅ | ✅ | Investment opportunities feed |
| Portfolio Tab | ✅ | ✅ | User's investments |
| Research Tab | ✅ | ✅ | Articles and news |
| Profile Tab | ✅ | ✅ | User profile and settings |
| Notifications Tab | ✅ | ✅ | Alerts for all notification types |
| Floating Invest Button | N/A | ✅ | Mobile FAB for quick investment |

---

## Investment Discovery

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Browse Investments | ✅ | ✅ | ✅ | |
| Investment Categories | ✅ | ✅ | ✅ | |
| Search Investments | ✅ | ✅ | ✅ | |
| Investment Detail View | ✅ | ✅ | ✅ | InvestmentDetailScreen |
| Filter by Category | ✅ | ✅ | ✅ | |
| Sort Options | ✅ | 🚧 | ✅ | |
| Watchlist | ✅ | 🚧 | ✅ | |
| Express Interest | ✅ | ✅ | ✅ | InvestModalScreen |

---

## Portfolio Management

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Portfolio Summary | ✅ | ✅ | ✅ | Total value, returns |
| Investment List | ✅ | ✅ | ✅ | |
| Investment Performance | ✅ | ✅ | ✅ | Charts and metrics |
| Transaction History | ✅ | 🚧 | ✅ | TransactionHistoryScreen exists |
| Make Investment | ✅ | ✅ | ✅ | |
| Dividend Tracking | ✅ | 🚧 | ✅ | |

---

## Research & Articles

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Article Feed | ✅ | ✅ | ✅ | |
| Article Categories | ✅ | ✅ | ✅ | |
| Article Detail | ✅ | ✅ | ✅ | ArticleDetailScreen |
| Bookmark Articles | ✅ | ✅ | ✅ | |
| Bookmarked Articles List | ✅ | ✅ | ✅ | BookmarkedArticlesScreen |
| Search Articles | ✅ | 🚧 | ✅ | |

---

## Social Features

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| User Profile View | ✅ | ✅ | ✅ | UserProfileScreen |
| Edit Profile | ✅ | ✅ | ✅ | EditProfileScreen |
| Avatar Upload | ✅ | ✅ | ✅ | |
| Follow Users | ✅ | 🚧 | ✅ | |
| Followers/Following List | ✅ | 🚧 | ✅ | FollowersScreen exists |
| Block Users | ✅ | 🚧 | ✅ | BlockedUsersScreen exists |

---

## Posts & Feed

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Create Post | ✅ | 🚧 | ✅ | CreatePostScreen exists |
| Edit Post | ✅ | 🚧 | ✅ | EditPostScreen exists |
| Delete Post | ✅ | 🚧 | ✅ | |
| Post Detail | ✅ | 🚧 | ✅ | PostDetailScreen exists |
| Like/React | ✅ | 🚧 | ✅ | |
| Comments | ✅ | 🚧 | ✅ | |
| Share Post | ✅ | 🚧 | ✅ | |
| Bookmark Post | ✅ | 🚧 | ✅ | BookmarksScreen exists |
| Hashtags | ✅ | 🚧 | ✅ | HashtagScreen exists |
| Drafts | ✅ | 🚧 | ✅ | DraftsScreen exists |

---

## Rooms (Healthcare Specialty Communities)

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Browse Rooms | ✅ | 🚧 | ✅ | RoomsScreen exists |
| Room Detail | ✅ | 🚧 | ✅ | RoomDetailScreen exists |
| Join/Leave Room | ✅ | 🚧 | ✅ | |
| Room Posts | ✅ | 🚧 | ✅ | |

---

## Messaging

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Conversations List | ✅ | ✅ | ✅ | MessagesScreen |
| Direct Messages | ✅ | ✅ | ✅ | ConversationScreen |
| New Conversation | ✅ | ✅ | ✅ | NewConversationScreen |
| Unread Count | ✅ | ✅ | ✅ | |
| Voice Calls | ✅ | 🚧 | ✅ | VoiceCallScreen exists |
| Video Calls | ✅ | 🚧 | ✅ | |
| Typing Indicators | ✅ | 🚧 | ✅ | WebSocket |
| Read Receipts | ✅ | 🚧 | ✅ | |

---

## Notifications

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Notifications List | ✅ | ✅ | ✅ | NotificationsScreen |
| Mark as Read | ✅ | ✅ | ✅ | |
| Mark All as Read | ✅ | ✅ | ✅ | |
| Filter by Type | ✅ | ✅ | N/A | All/Unread/Mentions |
| Push Notifications | N/A | 🚧 | ✅ | expo-notifications |
| Notification Settings | ✅ | ✅ | ✅ | NotificationSettingsScreen |
| **Notification Types** |
| Like | ✅ | ✅ | ✅ | |
| Comment | ✅ | ✅ | ✅ | |
| Follow | ✅ | ✅ | ✅ | |
| Mention | ✅ | ✅ | ✅ | |
| Reply | ✅ | ✅ | ✅ | |
| Message | ✅ | ✅ | ✅ | |
| AMA Live | ✅ | ✅ | ✅ | |
| Deal Update | ✅ | ✅ | ✅ | |
| Achievement | ✅ | ✅ | ✅ | |
| Friend Request | ✅ | ✅ | ✅ | |
| Friend Accepted | ✅ | ✅ | ✅ | |
| Investment Update | ✅ | ✅ | ✅ | |
| Course Update | ✅ | ✅ | ✅ | |
| Event Reminder | ✅ | ✅ | ✅ | |
| System | ✅ | ✅ | ✅ | |

---

## Deals & Investment Opportunities

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Deals List | ✅ | 🚧 | ✅ | DealsScreen exists |
| Deal Detail | ✅ | 🚧 | ✅ | DealDetailScreen exists |
| Filter Deals | ✅ | 🚧 | ✅ | |
| Watch Deal | ✅ | 🚧 | ✅ | |
| Invest in Deal | ✅ | ✅ | ✅ | InvestModalScreen |

---

## Courses & Learning

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Course List | ✅ | 🚧 | ✅ | |
| Course Detail | ✅ | 🚧 | ✅ | CourseDetailScreen exists |
| Lesson Player | ✅ | 🚧 | ✅ | LessonPlayerScreen exists |
| Progress Tracking | ✅ | 🚧 | ✅ | |

---

## Events & AMAs

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Event List | ✅ | 🚧 | ✅ | |
| Event Detail | ✅ | 🚧 | ✅ | EventDetailScreen exists |
| AMA Sessions | ✅ | 🚧 | ✅ | AMADetailScreen exists |
| RSVP to Event | ✅ | 🚧 | ✅ | |

---

## Gamification

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Achievements | ✅ | 🚧 | ✅ | AchievementsScreen exists |
| Leaderboard | ✅ | 🚧 | ✅ | LeaderboardScreen exists |
| Points System | ✅ | 🚧 | ✅ | |
| Badges | ✅ | 🚧 | ✅ | |

---

## AI Features

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| AI Chat Assistant | ✅ | 🚧 | ✅ | AIChatScreen exists |
| Deal Analysis | ✅ | 🚧 | ✅ | OpenAI integration |
| Content Moderation | ✅ | ✅ | ✅ | |
| Search Enhancement | ✅ | 🚧 | ✅ | |
| Recommendations | ✅ | 🚧 | ✅ | |

---

## Settings

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Settings Menu | ✅ | ✅ | N/A | SettingsScreen |
| Edit Profile | ✅ | ✅ | ✅ | EditProfileScreen |
| Change Password | ✅ | 🚧 | ✅ | ChangePasswordScreen exists |
| Notification Preferences | ✅ | ✅ | ✅ | NotificationsSettingsScreen |
| Appearance/Theme | ✅ | 🚧 | N/A | AppearanceSettingsScreen exists |
| Biometric Settings | N/A | 🚧 | N/A | BiometricSettingsScreen exists |
| Content Preferences | ✅ | 🚧 | ✅ | ContentPreferencesScreen exists |
| Privacy Policy | ✅ | 🚧 | N/A | PrivacyPolicyScreen exists |
| Terms of Service | ✅ | 🚧 | N/A | TermsOfServiceScreen exists |
| Delete Account | ✅ | 🚧 | ✅ | DeleteAccountScreen exists |
| Data Export | ✅ | 🚧 | ✅ | DataExportScreen exists |
| Payment Methods | ✅ | 🚧 | ✅ | PaymentMethodsScreen exists |
| Documents | ✅ | 🚧 | ✅ | DocumentsScreen exists |
| Support | ✅ | 🚧 | ✅ | SupportScreen exists |
| Legal | ✅ | 🚧 | N/A | LegalScreen exists |

---

## Premium/Subscription

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Premium Features | ✅ | 🚧 | ✅ | PremiumScreen exists |
| Subscription Management | ✅ | 🚧 | ✅ | |
| In-App Purchase | N/A | 🚧 | N/A | Requires native build |

---

## Search

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Global Search | ✅ | 🚧 | ✅ | SearchScreen exists |
| Search History | ✅ | 🚧 | ✅ | SavedSearchesScreen exists |
| Filter Results | ✅ | 🚧 | ✅ | |

---

## Reporting

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| Report Content | ✅ | 🚧 | ✅ | ReportScreen exists |
| Report User | ✅ | 🚧 | ✅ | |

---

## Platform-Specific Features

### Mobile Only

| Feature | Status | Notes |
|---------|--------|-------|
| Biometric Authentication | ✅ | FaceID/TouchID |
| Push Notifications | 🚧 | expo-notifications |
| Haptic Feedback | ✅ | expo-haptics |
| Pull to Refresh | ✅ | Native gesture |
| Swipe Navigation | ✅ | React Navigation |
| Camera Access | ✅ | expo-camera/image-picker |
| Offline Support | 🚧 | AsyncStorage caching |
| Deep Linking | 🚧 | Expo linking |

### Web Only

| Feature | Status | Notes |
|---------|--------|-------|
| Keyboard Shortcuts | ✅ | |
| Browser Notifications | 🚧 | |
| Desktop Layout | ✅ | Responsive design |
| Print Support | ✅ | |

---

## API Coverage

All API endpoints are available for both web and mobile:

| Route Group | Endpoints | Mobile Integration |
|-------------|-----------|-------------------|
| `/api/auth/*` | 9 endpoints | ✅ Fully integrated |
| `/api/users/*` | 10 endpoints | ✅ Fully integrated |
| `/api/investments/*` | 4 endpoints | ✅ Fully integrated |
| `/api/portfolio/*` | 4 endpoints | ✅ Fully integrated |
| `/api/articles/*` | 5 endpoints | ✅ Fully integrated |
| `/api/messages/*` | 5 endpoints | ✅ Fully integrated |
| `/api/ai/*` | 6 endpoints | 🚧 Partial integration |

---

## Priority Gaps to Address

### High Priority (Core User Journey)

1. **Push Notifications** - Critical for engagement
2. **Offline Support** - Essential for mobile UX
3. **Deep Linking** - Required for notification tap handling

### Medium Priority (Feature Completion)

1. **Posts & Feed** - Connect existing screens to API
2. **Rooms** - Connect RoomsScreen to API
3. **AI Chat** - Connect AIChatScreen to backend
4. **Deals** - Connect DealsScreen to API

### Low Priority (Polish)

1. **Settings screens** - Connect remaining settings to API
2. **Gamification** - Connect achievements/leaderboard
3. **Courses** - Connect learning features

---

## Sync Architecture

Both platforms use:
- **Shared Types**: `@medinvest/shared` package
- **Shared Validators**: Zod schemas for form/API validation
- **Shared Utilities**: Date formatting, number formatting, text parsing
- **Common API Client**: Platform-specific token storage, unified request handling

See `docs/SYNC_ARCHITECTURE.md` for detailed implementation.

---

## Testing Matrix

See `docs/TESTING_CHECKLIST.md` for comprehensive test cases covering all features.
