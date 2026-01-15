# MedInvest Production Setup Guide

This guide covers the steps required to prepare MedInvest for publishing to the Apple App Store and Google Play Store.

## Prerequisites

### Required Accounts
- **Apple Developer Program** ($99/year) - [developer.apple.com](https://developer.apple.com)
- **Google Play Developer** ($25 one-time) - [play.google.com/console](https://play.google.com/console)
- **Expo Account** (free) - [expo.dev](https://expo.dev)

---

## OAuth Provider Setup

### 1. Google Sign-In

**Google Cloud Console Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable "Google Sign-In" API
4. Create OAuth 2.0 Client IDs for each platform:

| Platform | Client Type | Configuration |
|----------|-------------|---------------|
| Web | Web application | Authorized redirect URI: `https://your-production-domain.com/` |
| iOS | iOS | Bundle ID: `com.medinvest.app` |
| Android | Android | Package name: `com.medinvest.app`, SHA-1 fingerprint required |
| Expo Go (dev) | Web application | Redirect URI: `https://auth.expo.io/@your-expo-username/medinvest` |

**Frontend Environment Variables:**
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

**Backend Environment Variables (for server-side token verification):**
```
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_WEB_CLIENT_SECRET=your-web-client-secret
```

> **Note:** The client secret is required for server-side token exchange. Store securely as a secret in Replit.

### 2. GitHub Sign-In

> **Important:** Web and mobile apps require **separate** GitHub OAuth apps because they use different redirect URIs.

#### Web OAuth App (for browser-based login)

**GitHub Developer Settings:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App for **Web**
3. Set Homepage URL: `https://your-production-domain.com`
4. Set Authorization callback URL: `https://your-production-domain.com`

**Web Environment Variables:**
```
EXPO_PUBLIC_GITHUB_CLIENT_ID=your-web-github-client-id
GITHUB_CLIENT_ID=your-web-github-client-id
GITHUB_CLIENT_SECRET=your-web-github-client-secret
```

#### Mobile OAuth App (for iOS/Android)

**GitHub Developer Settings:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a **second** OAuth App for **Mobile**
3. Set Homepage URL: `https://your-production-domain.com`
4. Set Authorization callback URL: `medinvest://` (deep link scheme)

**Mobile Environment Variables:**
```
EXPO_PUBLIC_GITHUB_MOBILE_CLIENT_ID=your-mobile-github-client-id
GITHUB_MOBILE_CLIENT_ID=your-mobile-github-client-id
GITHUB_MOBILE_CLIENT_SECRET=your-mobile-github-client-secret
```

> **Why separate apps?** GitHub OAuth only allows one callback URL per app. Web uses `https://domain.com` while mobile uses the `medinvest://` deep link scheme. Using the same credentials causes authentication failures.

### 3. Apple Sign-In

**Apple Developer Portal Setup:**
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to Certificates, Identifiers & Profiles
3. Create an App ID with "Sign In with Apple" capability
4. Bundle ID must match: `com.medinvest.app`

**Server-Side Configuration (for web and token verification):**
1. Create a Services ID in Apple Developer Portal
2. Generate a private key for Sign In with Apple
3. Download the .p8 key file

**Backend Environment Variables:**
```
APPLE_TEAM_ID=your-team-id
APPLE_SERVICE_ID=your-service-id (for web sign-in)
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=contents-of-p8-file (base64 encoded)
```

> **Note:** The private key is used for server-side token generation and validation. Store the .p8 file contents as a secret.

### 4. Facebook Sign-In

**Meta for Developers:**
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new app or select existing
3. Add Facebook Login product
4. Configure iOS and Android platforms with bundle ID/package name

**Frontend Environment Variables:**
```
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

**Backend Environment Variables:**
```
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

> **Note:** The app secret is required for server-side token verification. Never expose the app secret in client code.

---

## App Store Requirements

### iOS (Apple App Store)

**Required Assets:**
- [ ] App Icon: 1024x1024 PNG (no transparency)
- [ ] Screenshots: Various sizes for different devices
  - iPhone 6.7" (1290x2796)
  - iPhone 6.5" (1284x2778)
  - iPhone 5.5" (1242x2208)
  - iPad Pro 12.9" (2048x2732) - if supporting tablets

**Required Information:**
- [ ] App Name: MedInvest
- [ ] Bundle ID: com.medinvest.app
- [ ] Privacy Policy URL (required)
- [ ] App Description (4000 characters max)
- [ ] Keywords (100 characters max)
- [ ] Primary Category: Finance
- [ ] Secondary Category: Health & Fitness

**Privacy Questionnaire:**
Apple requires disclosure of data collection practices. MedInvest collects:
- Contact info (email, name)
- User content (posts, messages)
- Usage data (analytics)
- Identifiers (user ID)

### Android (Google Play Store)

**Required Assets:**
- [ ] App Icon: 512x512 PNG
- [ ] Feature Graphic: 1024x500
- [ ] Screenshots: At least 2 (max 8 per device type)
  - Phone screenshots
  - 7-inch tablet (optional)
  - 10-inch tablet (optional)

**Required Information:**
- [ ] App Name: MedInvest
- [ ] Package Name: com.medinvest.app
- [ ] Short Description (80 characters max)
- [ ] Full Description (4000 characters max)
- [ ] Privacy Policy URL (required)
- [ ] Category: Finance
- [ ] Content Rating (complete questionnaire)

---

## Push Notifications Setup

Push notifications require Expo Application Services (EAS) configuration.

### Step 1: Initialize EAS Project
```bash
npx eas project:init
```
This creates a project on Expo's servers and adds your project ID to app.json.

### Step 2: Verify Configuration
After running the command above, your app.json will have:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### Step 3: Configure Credentials (for Production)

**iOS:**
- Push notifications work automatically with EAS Build
- For bare workflow: Configure APNs key in Apple Developer Portal

**Android:**
- Push notifications work automatically with EAS Build
- For bare workflow: Configure FCM in Firebase Console

### How Push Notifications Work
1. User grants notification permission on device
2. App receives Expo Push Token from Expo's servers
3. Token is registered with MedInvest backend
4. Backend sends notifications via Expo Push API (`https://exp.host/--/api/v2/push/send`)
5. Expo routes notifications to Apple/Google

### Testing Push Notifications
- Push notifications only work on physical devices
- They do NOT work in simulators, emulators, or web browsers
- Use Expo Go app on a physical device to test

---

## Database & Backend

### Production Database
- Ensure production PostgreSQL database is set up
- Run all migrations before launch
- Set up database backups

### Environment Variables (Production)
```
DATABASE_URL=your-production-database-url
SESSION_SECRET=your-secure-session-secret
NODE_ENV=production
```

---

## Security Checklist

- [ ] All OAuth secrets are stored securely (not in code)
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Session tokens are secure
- [ ] Sensitive data is encrypted at rest
- [ ] No debug/development code in production

---

## Testing Before Launch

1. **Test all authentication flows** on real devices
2. **Test deep links** work correctly
3. **Test push notifications** (if applicable)
4. **Test in-app purchases** (if applicable)
5. **Performance testing** on various devices
6. **Accessibility testing**

---

## Publishing from Replit

### iOS
1. In Replit, select "Publish to App Store"
2. Connect your Apple Developer account
3. Replit builds the app in the cloud
4. Submit to TestFlight for testing
5. Submit to App Store for review

### Android
1. Build APK/AAB using Expo EAS
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review

---

## Post-Launch

- Monitor crash reports (App Store Connect / Play Console)
- Respond to user reviews
- Track analytics and user engagement
- Plan update cycles

---

## Support

For technical questions about the MedInvest app:
- Email: support@medinvest.com
- Privacy: privacy@medinvest.com
- Legal: legal@medinvest.com
