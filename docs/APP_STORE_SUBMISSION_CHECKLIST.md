# MedInvest Mobile - App Store Submission Checklist

## Overview

This checklist covers everything needed to submit MedInvest to the Apple App Store and Google Play Store.

---

## Pre-Submission Requirements

### ✅ App Configuration

- [ ] **Bundle Identifier**: `com.medinvest.app`
- [ ] **Version Number**: Semantic versioning (e.g., `1.0.0`)
- [ ] **Build Number**: Incremental integer
- [ ] **App Name**: MedInvest (max 30 characters)
- [ ] **Subtitle**: Medical Professional Investment Network (max 30 characters)

### ✅ Code Signing

#### iOS
- [ ] Apple Developer Account ($99/year)
- [ ] App ID registered in Apple Developer Portal
- [ ] Distribution certificate created
- [ ] Provisioning profile (App Store distribution)
- [ ] Push notification certificate (APNs)

#### Android
- [ ] Google Play Developer Account ($25 one-time)
- [ ] Keystore file created and securely stored
- [ ] SHA-256 fingerprint registered for Firebase

---

## App Store Assets

### ✅ App Icon

| Platform | Size | Requirements |
|----------|------|--------------|
| iOS | 1024x1024 | PNG, no alpha, no rounded corners |
| Android | 512x512 | PNG, 32-bit with alpha |

- [ ] Icon created at required sizes
- [ ] No text on icon (except logo)
- [ ] Recognizable at small sizes

### ✅ Screenshots

#### iOS (Required sizes)
- [ ] 6.7" (iPhone 15 Pro Max): 1290 x 2796
- [ ] 6.5" (iPhone 14 Plus): 1284 x 2778
- [ ] 5.5" (iPhone 8 Plus): 1242 x 2208
- [ ] 12.9" iPad Pro: 2048 x 2732

#### Android
- [ ] Phone: 1080 x 1920 minimum
- [ ] 7" Tablet: 1200 x 1920
- [ ] 10" Tablet: 1920 x 1200

#### Screenshot Requirements
- [ ] Minimum 3 screenshots per device type
- [ ] Maximum 10 screenshots
- [ ] PNG or JPEG format
- [ ] Show key features: Feed, Posts, Messaging, Deals, Profile
- [ ] Use device frames (optional but recommended)
- [ ] Localize for each supported language

### ✅ App Preview Videos (Optional)

- [ ] 15-30 seconds duration
- [ ] H.264 codec
- [ ] Show app in action
- [ ] No hands visible
- [ ] Background music licensed

---

## App Store Metadata

### ✅ Description

**Short Description** (80 characters):
```
Connect with medical professionals. Discover exclusive healthcare investments.
```

**Full Description** (4000 characters max):
```
MedInvest is the premier social network and investment platform exclusively for medical professionals.

CONNECT WITH YOUR PEERS
• Join specialty-specific rooms (Cardiology, Oncology, Surgery, and more)
• Share cases, insights, and questions with fellow physicians
• Build your professional network within the medical community

EXCLUSIVE INVESTMENT OPPORTUNITIES
• Access vetted healthcare investment deals
• Connect with other physician investors
• Track your portfolio performance

KEY FEATURES
• Secure, verified medical professional community
• Real-time messaging with colleagues
• Anonymous posting for sensitive discussions
• AI-powered insights and recommendations
• Premium tier with advanced features

PRIVACY & SECURITY
• HIPAA-compliant infrastructure
• End-to-end encrypted messaging
• Biometric authentication support
• Full data export capability

Join thousands of medical professionals already using MedInvest to advance their careers and financial futures.

Download now and connect with your medical community!
```

### ✅ Keywords (iOS - 100 characters)

```
medical,physician,doctor,healthcare,investment,networking,social,community,deals,portfolio
```

### ✅ Categories

**iOS:**
- Primary: Medical
- Secondary: Finance

**Android:**
- Category: Medical
- Tags: Medical, Finance, Social, Networking

### ✅ Content Rating

Complete content rating questionnaires:
- [ ] iOS: Age Rating in App Store Connect
- [ ] Android: Content rating questionnaire in Play Console

**Expected Rating:** 
- iOS: 17+ (medical content, financial information)
- Android: Teen or Mature

### ✅ Privacy Information

#### iOS App Privacy Labels

**Data Collected:**
- [ ] Contact Info (Email, Name)
- [ ] Identifiers (User ID, Device ID)
- [ ] Usage Data (App interactions)
- [ ] Financial Info (Investment data)
- [ ] Health & Fitness (Medical specialty - professional, not personal health)

**Data Usage:**
- [ ] Analytics
- [ ] Product Personalization
- [ ] App Functionality

#### Privacy Policy URL
```
https://medinvest.com/privacy
```

#### Terms of Service URL
```
https://medinvest.com/terms
```

---

## Technical Requirements

### ✅ iOS Specific

- [ ] Supports iOS 14.0+
- [ ] Universal app (iPhone + iPad)
- [ ] Supports all screen sizes
- [ ] Dark mode support
- [ ] Dynamic Type support
- [ ] VoiceOver accessibility
- [ ] No private API usage
- [ ] No UIWebView (deprecated)
- [ ] IPv6 network support

### ✅ Android Specific

- [ ] Minimum SDK: 24 (Android 7.0)
- [ ] Target SDK: 34 (Android 14)
- [ ] 64-bit support
- [ ] Adaptive icons
- [ ] Supports various screen densities
- [ ] ProGuard/R8 enabled for release
- [ ] No sensitive permissions without justification

### ✅ Universal Requirements

- [ ] App works offline (graceful degradation)
- [ ] No crashes on launch
- [ ] All features functional
- [ ] No placeholder content
- [ ] No "test" or "demo" text
- [ ] All links work
- [ ] All images load

---

## Testing Checklist

### ✅ Functionality Testing

- [ ] User registration flow
- [ ] User login flow
- [ ] Password reset flow
- [ ] Email verification
- [ ] Profile creation/editing
- [ ] Post creation with text
- [ ] Post creation with images
- [ ] Post creation with video
- [ ] Post creation with poll
- [ ] Commenting on posts
- [ ] Liking/reacting to posts
- [ ] Following/unfollowing users
- [ ] Direct messaging
- [ ] Push notifications received
- [ ] Search functionality
- [ ] Room filtering
- [ ] Deal viewing
- [ ] Investment flow (if applicable)
- [ ] Settings changes persist
- [ ] Logout functionality
- [ ] Account deletion

### ✅ Performance Testing

- [ ] App launches in < 3 seconds
- [ ] Feed loads in < 2 seconds
- [ ] Images load progressively
- [ ] No memory leaks
- [ ] Battery usage reasonable
- [ ] Network usage optimized

### ✅ Security Testing

- [ ] Authentication tokens stored securely
- [ ] No sensitive data in logs
- [ ] Certificate pinning (optional)
- [ ] Biometric authentication works
- [ ] Session timeout works
- [ ] Deep links validated

### ✅ Compatibility Testing

- [ ] Tested on oldest supported iOS version
- [ ] Tested on latest iOS version
- [ ] Tested on oldest supported Android version
- [ ] Tested on latest Android version
- [ ] Tested on various screen sizes
- [ ] Tested on tablets (if supported)

### ✅ Accessibility Testing

- [ ] VoiceOver/TalkBack navigable
- [ ] Sufficient color contrast
- [ ] Touch targets ≥ 44pt
- [ ] Text scalable
- [ ] No information conveyed by color alone

---

## App Store Connect Setup (iOS)

### ✅ App Information

- [ ] App name
- [ ] Subtitle
- [ ] Privacy policy URL
- [ ] Category
- [ ] Content rights
- [ ] Age rating

### ✅ Pricing and Availability

- [ ] Price (Free)
- [ ] Available in all territories (or select)
- [ ] Pre-order (optional)

### ✅ App Privacy

- [ ] Privacy policy URL
- [ ] Data collection declarations
- [ ] Third-party SDK disclosures

### ✅ In-App Purchases (if applicable)

- [ ] Premium subscription created
- [ ] Pricing tiers set
- [ ] Subscription group configured
- [ ] Promotional offers (optional)

### ✅ App Review Information

- [ ] Demo account credentials
- [ ] Contact information
- [ ] Notes for reviewer
- [ ] Attachment (if needed for verification)

**Demo Account:**
```
Email: reviewer@medinvest.com
Password: AppReview2024!
Notes: This account has full access to all features including premium tier.
```

---

## Google Play Console Setup (Android)

### ✅ Store Listing

- [ ] App name
- [ ] Short description
- [ ] Full description
- [ ] Screenshots
- [ ] Feature graphic (1024 x 500)
- [ ] App icon

### ✅ Content Rating

- [ ] Complete questionnaire
- [ ] Receive rating certificate

### ✅ Pricing & Distribution

- [ ] Free app
- [ ] Countries selected
- [ ] Content guidelines acknowledged

### ✅ App Content

- [ ] Privacy policy
- [ ] Ads declaration
- [ ] Target audience
- [ ] News app declaration (No)
- [ ] COVID-19 app declaration (No)
- [ ] Data safety section

### ✅ Release Management

- [ ] Internal testing track
- [ ] Closed testing track
- [ ] Open testing track (optional)
- [ ] Production release

---

## Common Rejection Reasons & Fixes

### iOS

| Reason | Fix |
|--------|-----|
| Crashes on launch | Test on multiple devices, fix startup errors |
| Broken links | Verify all URLs work |
| Placeholder content | Remove all test/demo content |
| Incomplete information | Fill all required metadata |
| Login required without explanation | Add "Why sign up" explanation |
| No demo account | Provide test credentials |
| Privacy policy missing | Add privacy policy URL |
| Guideline 4.2 - Minimum functionality | Ensure app provides value |

### Android

| Reason | Fix |
|--------|-----|
| Crashes | Fix all crash reports |
| Policy violation | Review content policies |
| Misleading claims | Ensure description matches features |
| Improper permissions | Justify all permissions |
| Target API too low | Update to latest target SDK |

---

## Post-Launch Checklist

### ✅ Monitoring

- [ ] Crash reporting active (Sentry/Crashlytics)
- [ ] Analytics tracking (Mixpanel/Amplitude)
- [ ] Performance monitoring
- [ ] User feedback monitoring
- [ ] Review responses

### ✅ Marketing

- [ ] App Store Optimization (ASO)
- [ ] Social media announcement
- [ ] Press release (optional)
- [ ] Email to waitlist
- [ ] In-app referral program

### ✅ Support

- [ ] Support email active
- [ ] FAQ page live
- [ ] Help center ready
- [ ] Bug reporting flow

---

## Submission Commands

### iOS (using EAS)

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Or using Fastlane
fastlane ios release
```

### Android (using EAS)

```bash
# Build for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android

# Or using Fastlane
fastlane android release
```

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Preparation | 1-2 weeks | Assets, metadata, testing |
| Internal Testing | 1 week | Bug fixes, polish |
| Beta Testing | 1-2 weeks | TestFlight/Play Beta |
| Submission | 1-3 days | Upload and submit |
| Review | 1-7 days | Apple/Google review |
| Launch | 1 day | Release to public |

---

## Contacts

- **App Store Team Lead**: [Name] - [email]
- **Android Team Lead**: [Name] - [email]
- **Legal/Privacy**: [Name] - [email]
- **Marketing**: [Name] - [email]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | TBD | Initial release |
