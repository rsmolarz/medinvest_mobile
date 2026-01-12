# MedInvest Mobile - API Integration Guide

## Overview

This guide covers integrating the MedInvest mobile app with your backend API. The app is built with React Native/Expo and uses a RESTful API architecture.

---

## Table of Contents

1. [API Configuration](#api-configuration)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Real-time Features](#real-time-features)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Testing](#testing)

---

## API Configuration

### Base Setup

Configure the API base URL in `client/lib/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.medinvest.com/v1';
```

### Environment Variables

Create a `.env` file:

```env
API_URL=https://api.medinvest.com/v1
WS_URL=wss://api.medinvest.com/ws
SENTRY_DSN=your-sentry-dsn
```

---

## Authentication

### JWT Token Flow

The app uses JWT tokens stored in secure storage:

```typescript
// Login
POST /auth/login
Body: { email: string, password: string }
Response: { token: string, refreshToken: string, user: User }

// Register
POST /auth/register
Body: { email: string, password: string, full_name: string, specialty?: string }
Response: { token: string, user: User }

// Refresh Token
POST /auth/refresh
Body: { refreshToken: string }
Response: { token: string, refreshToken: string }

// Logout
POST /auth/logout
Headers: { Authorization: 'Bearer <token>' }
```

### Token Storage

Tokens are stored using `expo-secure-store`:

```typescript
import * as SecureStore from 'expo-secure-store';

// Store token
await SecureStore.setItemAsync('auth_token', token);

// Retrieve token
const token = await SecureStore.getItemAsync('auth_token');
```

### Request Interceptor

All authenticated requests include the token:

```typescript
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## Core Endpoints

### Users

```typescript
// Get current user
GET /users/me
Response: User

// Update profile
PUT /users/me
Body: { full_name?: string, bio?: string, specialty?: string, avatar_url?: string }

// Get user by ID
GET /users/:id
Response: User

// Follow user
POST /users/:id/follow

// Unfollow user
DELETE /users/:id/follow

// Get followers
GET /users/:id/followers?page=1&limit=20
Response: { users: User[], hasMore: boolean }

// Get following
GET /users/:id/following?page=1&limit=20
Response: { users: User[], hasMore: boolean }

// Block user
POST /users/:id/block

// Unblock user
DELETE /users/:id/block

// Mute user
POST /users/:id/mute
Body: { mute_posts: boolean, mute_comments: boolean, mute_messages: boolean, duration: string }

// Search users
GET /users/search?q=query&page=1&limit=20
Response: { users: User[], hasMore: boolean }
```

### Posts

```typescript
// Get feed
GET /posts/feed?page=1&limit=20&room_id=optional
Response: { posts: Post[], hasMore: boolean }

// Get post by ID
GET /posts/:id
Response: Post

// Create post
POST /posts
Body: { 
  content: string, 
  room_id?: number, 
  is_anonymous?: boolean,
  images?: string[],
  video_url?: string,
  poll?: PollData
}
Response: Post

// Update post
PUT /posts/:id
Body: { content?: string }

// Delete post
DELETE /posts/:id

// Like post
POST /posts/:id/like

// Unlike post
DELETE /posts/:id/like

// React to post
POST /posts/:id/react
Body: { type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'fire' | 'thinking' | 'clap' }

// Remove reaction
DELETE /posts/:id/react

// Bookmark post
POST /posts/:id/bookmark

// Remove bookmark
DELETE /posts/:id/bookmark

// Get bookmarks
GET /posts/bookmarks?page=1&limit=20
Response: { posts: Post[], hasMore: boolean }

// Report post
POST /posts/:id/report
Body: { reason: string, details?: string }

// Pin post to profile
POST /posts/:id/pin

// Unpin post
DELETE /posts/:id/pin
```

### Comments

```typescript
// Get comments
GET /posts/:postId/comments?page=1&limit=20
Response: { comments: Comment[], hasMore: boolean }

// Create comment
POST /posts/:postId/comments
Body: { content: string, parent_id?: number }
Response: Comment

// Update comment
PUT /comments/:id
Body: { content: string }

// Delete comment
DELETE /comments/:id

// Like comment
POST /comments/:id/like

// Unlike comment
DELETE /comments/:id/like
```

### Rooms

```typescript
// Get all rooms
GET /rooms
Response: Room[]

// Get room by ID
GET /rooms/:id
Response: Room

// Get room posts
GET /rooms/:id/posts?page=1&limit=20
Response: { posts: Post[], hasMore: boolean }

// Join room
POST /rooms/:id/join

// Leave room
DELETE /rooms/:id/join

// Get user's rooms
GET /rooms/joined
Response: Room[]
```

### Messages

```typescript
// Get conversations
GET /conversations?page=1&limit=20
Response: { conversations: Conversation[], hasMore: boolean }

// Get conversation messages
GET /conversations/:id/messages?page=1&limit=50
Response: { messages: Message[], hasMore: boolean }

// Send message
POST /conversations/:id/messages
Body: { content: string, attachments?: string[] }
Response: Message

// Create conversation
POST /conversations
Body: { user_id: number }
Response: Conversation

// Mark as read
POST /conversations/:id/read

// Delete conversation
DELETE /conversations/:id
```

### Notifications

```typescript
// Get notifications
GET /notifications?page=1&limit=20
Response: { notifications: Notification[], hasMore: boolean, unreadCount: number }

// Mark as read
POST /notifications/:id/read

// Mark all as read
POST /notifications/read-all

// Get unread count
GET /notifications/unread-count
Response: { count: number }
```

### Deals

```typescript
// Get deals
GET /deals?page=1&limit=20&stage=optional&sector=optional
Response: { deals: Deal[], hasMore: boolean }

// Get deal by ID
GET /deals/:id
Response: Deal

// Watch deal
POST /deals/:id/watch

// Unwatch deal
DELETE /deals/:id/watch

// Express interest
POST /deals/:id/interest
Body: { amount?: number, message?: string }
```

### Search

```typescript
// Global search
GET /search?q=query&type=all|posts|users|rooms|deals&page=1&limit=20
Response: { 
  posts?: Post[], 
  users?: User[], 
  rooms?: Room[], 
  deals?: Deal[],
  hasMore: boolean 
}

// Trending topics
GET /search/trending
Response: { topics: TrendingTopic[] }

// Autocomplete
GET /search/autocomplete?q=query
Response: { suggestions: string[], users: User[], hashtags: string[] }
```

### Polls

```typescript
// Vote on poll
POST /posts/:postId/polls/:pollId/vote
Body: { option_ids: string[] }

// Get poll results
GET /posts/:postId/polls/:pollId
Response: Poll
```

### Reports

```typescript
// Report content
POST /reports
Body: { 
  type: 'user' | 'post' | 'comment' | 'message',
  target_id: number,
  reason: string,
  details?: string
}
```

### Account

```typescript
// Change password
PUT /account/password
Body: { current_password: string, new_password: string }

// Request data export
POST /account/export
Body: { categories: string[], format: 'json' | 'csv' | 'html' }
Response: { exportId: string }

// Get export status
GET /account/export/:id/status
Response: { status: string, progress: number, downloadUrl?: string }

// Delete account
DELETE /account
Body: { password: string }

// Get notification settings
GET /account/notification-settings
Response: NotificationSettings

// Update notification settings
PUT /account/notification-settings
Body: NotificationSettings
```

### App Version

```typescript
// Check for updates
GET /app/version?currentVersion=1.0.0&platform=ios|android
Response: {
  latestVersion: string,
  minimumVersion: string,
  updateRequired: boolean,
  updateRecommended: boolean,
  releaseNotes?: string[]
}
```

---

## Real-time Features

### WebSocket Connection

```typescript
// Connect
const ws = new WebSocket(`wss://api.medinvest.com/ws?token=${authToken}`);

// Events to listen for:
// - 'typing' - User typing indicator
// - 'message' - New message
// - 'notification' - New notification
// - 'message_read' - Message read receipt
// - 'user_online' - User came online
// - 'user_offline' - User went offline

// Send typing indicator
ws.send(JSON.stringify({
  type: 'typing',
  data: { conversationId: 123, isTyping: true }
}));

// Send read receipt
ws.send(JSON.stringify({
  type: 'message_read',
  data: { conversationId: 123, messageId: 456 }
}));
```

### Push Notifications

Firebase Cloud Messaging (FCM) for Android, APNs for iOS.

```typescript
// Register device token
POST /devices/register
Body: { 
  token: string, 
  platform: 'ios' | 'android',
  deviceId: string 
}

// Unregister device
DELETE /devices/:token
```

---

## Error Handling

### Error Response Format

```typescript
{
  error: {
    code: string,        // e.g., 'VALIDATION_ERROR', 'UNAUTHORIZED'
    message: string,     // Human-readable message
    details?: any        // Additional error details
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Client-side Error Handling

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request
        return api.request(error.config);
      }
      // Logout user
      await logout();
    }
    
    if (error.response?.status === 429) {
      // Handle rate limit
      const retryAfter = error.response.headers['retry-after'];
      // Show rate limit message
    }
    
    return Promise.reject(error);
  }
);
```

---

## Rate Limiting

### Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Authentication | 5 requests/minute |
| Read operations | 100 requests/minute |
| Write operations | 30 requests/minute |
| Search | 20 requests/minute |
| File uploads | 10 requests/minute |

### Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Testing

### Mock API Setup

For development, use the mock data in `client/lib/mockData.ts`:

```typescript
// Enable mock mode
const USE_MOCK_API = __DEV__ && true;

if (USE_MOCK_API) {
  // Intercept requests and return mock data
}
```

### Test Users

```
Email: test@medinvest.com
Password: TestPassword123!

Email: premium@medinvest.com  
Password: PremiumUser123!
```

### Postman Collection

Import the provided Postman collection for API testing:
`docs/MedInvest-API.postman_collection.json`

---

## Data Types

### User

```typescript
interface User {
  id: number;
  email: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  specialty?: string;
  is_verified: boolean;
  is_premium: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}
```

### Post

```typescript
interface Post {
  id: number;
  author: User;
  content: string;
  room?: Room;
  is_anonymous: boolean;
  images?: string[];
  video_url?: string;
  poll?: Poll;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_pinned: boolean;
  reactions: ReactionCount[];
  user_reaction?: string;
  created_at: string;
  updated_at: string;
}
```

### Message

```typescript
interface Message {
  id: number;
  conversation_id: number;
  sender: User;
  content: string;
  attachments?: string[];
  status: 'sending' | 'sent' | 'delivered' | 'read';
  read_at?: string;
  created_at: string;
}
```

### Notification

```typescript
interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}
```

---

## Security Considerations

1. **Always use HTTPS** in production
2. **Validate all input** on the server
3. **Sanitize user content** to prevent XSS
4. **Implement proper CORS** headers
5. **Use parameterized queries** to prevent SQL injection
6. **Rate limit** all endpoints
7. **Log security events** for monitoring
8. **Rotate JWT secrets** periodically

---

## Support

For API integration support, contact:
- Email: api-support@medinvest.com
- Documentation: https://docs.medinvest.com/api
