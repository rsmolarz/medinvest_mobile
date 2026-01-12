# MedInvest Mobile - Testing Checklist

## Overview

Comprehensive testing checklist for the MedInvest mobile application covering all features, screens, and edge cases.

---

## Test Environment Setup

### Devices Required

**iOS:**
- [ ] iPhone SE (smallest screen)
- [ ] iPhone 14/15 (standard)
- [ ] iPhone 14/15 Pro Max (largest)
- [ ] iPad (if supporting tablets)

**Android:**
- [ ] Small phone (5" screen)
- [ ] Standard phone (6" screen)
- [ ] Large phone (6.7"+ screen)
- [ ] Tablet (if supporting)

### OS Versions

- [ ] iOS 14 (minimum supported)
- [ ] iOS 15
- [ ] iOS 16
- [ ] iOS 17 (latest)
- [ ] Android 7 (API 24 - minimum)
- [ ] Android 12
- [ ] Android 13
- [ ] Android 14 (latest)

### Network Conditions

- [ ] Strong WiFi
- [ ] Weak WiFi
- [ ] 4G/LTE
- [ ] 3G (slow)
- [ ] Offline
- [ ] Airplane mode
- [ ] Network transitions

---

## Authentication Tests

### Registration

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Valid registration | Enter valid email, password, name | Account created, verification email sent | ☐ |
| Invalid email format | Enter "notanemail" | Error: Invalid email | ☐ |
| Weak password | Enter "123" | Error: Password requirements | ☐ |
| Password mismatch | Enter different passwords | Error: Passwords don't match | ☐ |
| Existing email | Use registered email | Error: Email already exists | ☐ |
| Empty fields | Leave fields empty | Error: Required fields | ☐ |
| Network error | Disable network, submit | Error: Network unavailable | ☐ |

### Login

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Valid login | Enter correct credentials | Logged in, redirected to home | ☐ |
| Wrong password | Enter incorrect password | Error: Invalid credentials | ☐ |
| Unverified email | Login with unverified account | Prompt to verify email | ☐ |
| Remember me | Enable, close app, reopen | Still logged in | ☐ |
| Biometric login | Enable FaceID/TouchID | Biometric prompt works | ☐ |
| Session expiry | Wait for token expiry | Prompted to re-login | ☐ |

### Password Reset

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Request reset | Enter email, submit | Success message, email sent | ☐ |
| Invalid email | Enter unregistered email | Error or generic success (security) | ☐ |
| Reset link | Click link in email | Opens app, shows reset form | ☐ |
| New password | Enter new password | Password updated, can login | ☐ |

### Logout

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Logout | Tap logout in settings | Logged out, token cleared | ☐ |
| Clear data | Check after logout | Sensitive data removed | ☐ |

---

## Home Feed Tests

### Feed Loading

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Initial load | Open app | Feed loads with posts | ☐ |
| Skeleton loading | Observe during load | Skeleton placeholders shown | ☐ |
| Empty feed | New user, no follows | Empty state with suggestions | ☐ |
| Pull to refresh | Pull down on feed | Feed refreshes, haptic feedback | ☐ |
| Infinite scroll | Scroll to bottom | More posts load | ☐ |
| No more posts | Reach end of feed | "No more posts" indicator | ☐ |

### Room Filtering

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Select room | Tap room filter | Feed filtered to room | ☐ |
| All rooms | Select "All" | All posts shown | ☐ |
| Multiple rooms | Quick switch rooms | Correct filtering each time | ☐ |
| Room persistence | Select room, leave, return | Room selection persisted | ☐ |

### Post Interactions

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Like post | Tap heart icon | Heart fills, count increases | ☐ |
| Unlike post | Tap filled heart | Heart empties, count decreases | ☐ |
| Reaction picker | Long press heart | Emoji picker appears | ☐ |
| Select reaction | Choose emoji | Reaction applied, animation | ☐ |
| Comment | Tap comment icon | Opens post detail | ☐ |
| Share | Tap share icon | Share sheet opens | ☐ |
| Bookmark | Tap bookmark icon | Post saved, icon fills | ☐ |

---

## Post Creation Tests

### Text Posts

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Create post | Enter text, submit | Post created, appears in feed | ☐ |
| Empty post | Try to submit empty | Submit disabled | ☐ |
| Long post | Enter 5000+ characters | Character limit enforced | ☐ |
| Mentions | Type @username | Autocomplete appears | ☐ |
| Select mention | Tap suggestion | Username inserted | ☐ |
| Hashtags | Type #topic | Hashtag highlighted | ☐ |
| Draft auto-save | Enter text, leave | Draft saved | ☐ |
| Restore draft | Return to create | Draft restored | ☐ |

### Media Posts

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Add image | Tap image icon | Picker opens | ☐ |
| Take photo | Select camera | Camera opens | ☐ |
| Select gallery | Choose from library | Image selected | ☐ |
| Crop image | Select crop option | Cropper opens | ☐ |
| Multiple images | Add up to 10 | All images attach | ☐ |
| Remove image | Tap X on image | Image removed | ☐ |
| Add video | Select video | Video attaches | ☐ |
| Video limit | Select long video | Trimmed or error | ☐ |

### Poll Posts

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Create poll | Add question + options | Poll preview shown | ☐ |
| Add option | Tap add option | New option added (max 6) | ☐ |
| Remove option | Tap X on option | Option removed (min 2) | ☐ |
| Set duration | Select duration | Duration applied | ☐ |
| Anonymous poll | Enable anonymous | Setting applied | ☐ |
| Multi-select | Enable multi-select | Setting applied | ☐ |

### Post Settings

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Select room | Choose room | Room attached to post | ☐ |
| Anonymous post | Enable toggle | Username hidden on post | ☐ |
| Post visibility | Check on feed | Post appears correctly | ☐ |

---

## Comments Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| View comments | Open post | Comments load | ☐ |
| Add comment | Enter text, submit | Comment added | ☐ |
| Reply to comment | Tap reply | Reply attached to parent | ☐ |
| Threaded view | Multiple replies | Thread structure correct | ☐ |
| Like comment | Tap heart on comment | Comment liked | ☐ |
| Edit comment | Own comment, edit | Comment updated | ☐ |
| Delete comment | Own comment, delete | Comment removed | ☐ |
| Report comment | Tap report | Report flow opens | ☐ |

---

## Profile Tests

### View Profile

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Own profile | Tap profile tab | Profile loads with stats | ☐ |
| Other's profile | Tap username | Their profile loads | ☐ |
| Posts tab | View posts | User's posts shown | ☐ |
| Followers list | Tap followers count | Followers list opens | ☐ |
| Following list | Tap following count | Following list opens | ☐ |
| Pinned posts | Check pinned section | Pinned posts shown at top | ☐ |

### Edit Profile

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Edit name | Change name, save | Name updated | ☐ |
| Edit bio | Change bio, save | Bio updated | ☐ |
| Edit specialty | Select specialty | Specialty updated | ☐ |
| Change avatar | Select new image | Avatar updated | ☐ |
| Crop avatar | Crop selected image | Cropped image saved | ☐ |

### Follow Actions

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Follow user | Tap follow button | Button changes to Following | ☐ |
| Unfollow user | Tap Following button | Confirmation, unfollowed | ☐ |
| Block user | Tap more, block | User blocked | ☐ |
| Mute user | Tap more, mute | Mute options shown | ☐ |
| Report user | Tap more, report | Report flow opens | ☐ |

---

## Messaging Tests

### Conversations List

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| View messages | Open messages tab | Conversations list loads | ☐ |
| Unread indicator | Have unread messages | Badge shown on tab | ☐ |
| New conversation | Tap compose | User search opens | ☐ |
| Search users | Enter name | Users filtered | ☐ |
| Select user | Tap user | Conversation opens | ☐ |

### Chat

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Send message | Enter text, send | Message sent, appears | ☐ |
| Receive message | Other user sends | Message appears, notification | ☐ |
| Read receipts | Open conversation | Messages marked as read | ☐ |
| Typing indicator | Other types | "Typing..." shown | ☐ |
| Send image | Attach image | Image sent | ☐ |
| Image preview | Tap sent image | Full screen preview | ☐ |
| Scroll history | Scroll up | Older messages load | ☐ |
| Online status | Check user status | Online/offline shown | ☐ |

---

## Search Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Search posts | Enter query | Relevant posts shown | ☐ |
| Search users | Search username | Users found | ☐ |
| Search hashtags | Search #topic | Posts with hashtag | ☐ |
| Filters | Apply filters | Results filtered | ☐ |
| Save search | Tap save | Search saved | ☐ |
| Recent searches | Check history | Recent shown | ☐ |
| Clear search | Tap clear | Query cleared | ☐ |
| No results | Search nonsense | Empty state shown | ☐ |

---

## Notifications Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| View notifications | Open notifications | List loads | ☐ |
| Unread badge | Have unread | Badge shows count | ☐ |
| Mark as read | Open notification | Marked as read | ☐ |
| Mark all read | Tap mark all | All marked read | ☐ |
| Like notification | Someone likes | Notification appears | ☐ |
| Comment notification | Someone comments | Notification appears | ☐ |
| Follow notification | Someone follows | Notification appears | ☐ |
| Mention notification | Someone mentions | Notification appears | ☐ |
| Push notification | App backgrounded | Push received | ☐ |
| Tap notification | Tap push | Opens correct screen | ☐ |

---

## Settings Tests

### Account Settings

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Change password | Enter new password | Password changed | ☐ |
| Enable biometric | Toggle on | Biometric enabled | ☐ |
| Disable biometric | Toggle off | Biometric disabled | ☐ |
| Delete account | Go through flow | Account deleted | ☐ |

### Notification Settings

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Toggle all off | Disable master toggle | All notifications off | ☐ |
| Individual toggles | Toggle specific types | Only those disabled | ☐ |
| Quiet hours | Enable and set times | Applied correctly | ☐ |

### Content Preferences

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Hide NSFW | Enable | Sensitive content hidden | ☐ |
| Blur images | Enable | Sensitive images blurred | ☐ |
| Add muted keyword | Enter keyword | Posts with word hidden | ☐ |
| Autoplay videos | Set to WiFi only | Videos don't autoplay on cellular | ☐ |

### Appearance

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Dark mode | Enable | App switches to dark | ☐ |
| Light mode | Enable | App switches to light | ☐ |
| System default | Select | Follows system setting | ☐ |

---

## Deals Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| View deals | Open deals tab | Deals list loads | ☐ |
| Filter deals | Apply filters | Deals filtered | ☐ |
| Deal detail | Tap deal | Detail page opens | ☐ |
| Watch deal | Tap watch | Deal added to watchlist | ☐ |
| Express interest | Tap interested | Interest form opens | ☐ |
| Submit interest | Fill form, submit | Confirmation shown | ☐ |

---

## Offline Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Offline indicator | Disable network | Offline banner appears | ☐ |
| View cached feed | Go offline | Cached posts visible | ☐ |
| Create post offline | Write post offline | Queued for later | ☐ |
| Queue indicator | Have queued items | Pending count shown | ☐ |
| Sync on reconnect | Enable network | Queued items sync | ☐ |
| Failed sync | Item fails | Retry option shown | ☐ |

---

## Accessibility Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| VoiceOver navigation | Enable VoiceOver | All elements announced | ☐ |
| Touch targets | Check buttons | Min 44pt touch area | ☐ |
| Color contrast | Check text | WCAG AA compliant | ☐ |
| Dynamic type | Increase text size | Text scales properly | ☐ |
| Reduce motion | Enable setting | Animations reduced | ☐ |

---

## Performance Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Cold start | Force close, reopen | < 3 seconds to interactive | ☐ |
| Feed scroll | Scroll rapidly | 60fps, no jank | ☐ |
| Image loading | Load image-heavy feed | Progressive loading | ☐ |
| Memory usage | Use for 10 minutes | No memory leaks | ☐ |
| Battery | Use for 1 hour | Reasonable battery usage | ☐ |

---

## Edge Cases

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Deep link | Tap external link | Opens correct screen | ☐ |
| Universal link | Tap web URL | Opens in app | ☐ |
| Background refresh | Background for 1 hour | Data refreshes on foreground | ☐ |
| Low storage | Fill device storage | Graceful handling | ☐ |
| Orientation | Rotate device | Layout adapts (if supported) | ☐ |
| Interrupted upload | Kill during upload | Recovers gracefully | ☐ |

---

## Security Tests

| Test Case | Steps | Expected | Pass |
|-----------|-------|----------|------|
| Token storage | Check storage | Token in secure storage | ☐ |
| SSL pinning | Use proxy | Connection refused (if enabled) | ☐ |
| Session timeout | Leave app idle | Session expires | ☐ |
| Sensitive screenshots | Take screenshot on sensitive screen | Content protected (if enabled) | ☐ |
| Biometric bypass | Cancel biometric | Falls back to password | ☐ |

---

## Regression Tests

After each release, verify:

- [ ] All authentication flows work
- [ ] Feed loads and scrolls
- [ ] Posts can be created
- [ ] Comments work
- [ ] Messages send and receive
- [ ] Notifications appear
- [ ] Profile edits save
- [ ] Settings persist
- [ ] No new crashes in analytics

---

## Test Reporting

### Bug Report Template

```markdown
**Title**: [Brief description]

**Environment**:
- Device: [e.g., iPhone 14 Pro]
- OS: [e.g., iOS 17.0]
- App Version: [e.g., 1.0.0 (build 42)]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [And so on...]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Video**:
[Attach if applicable]

**Severity**: [Critical/High/Medium/Low]

**Additional Notes**:
[Any other relevant information]
```

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Manager | | | |
