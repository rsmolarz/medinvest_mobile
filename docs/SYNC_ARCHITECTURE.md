# Web & Mobile Sync Architecture

## Overview

This document outlines strategies to keep the MedInvest web and mobile applications in sync, ensuring consistent behavior, shared business logic, and efficient development.

---

## Table of Contents

1. [Architecture Options](#architecture-options)
2. [Recommended Approach](#recommended-approach)
3. [Shared Code Structure](#shared-code-structure)
4. [API Contract Enforcement](#api-contract-enforcement)
5. [Real-time Sync](#real-time-sync)
6. [Feature Parity Tracking](#feature-parity-tracking)
7. [Testing Strategy](#testing-strategy)
8. [CI/CD Pipeline](#cicd-pipeline)

---

## Architecture Options

### Option 1: Monorepo (Recommended)

```
medinvest/
├── apps/
│   ├── web/                 # Next.js/React web app
│   ├── mobile/              # React Native app
│   └── api/                 # Backend API
├── packages/
│   ├── shared-types/        # TypeScript types
│   ├── shared-utils/        # Common utilities
│   ├── shared-validators/   # Zod schemas
│   ├── ui-primitives/       # Cross-platform components
│   └── api-client/          # Shared API client
├── package.json
├── turbo.json              # Turborepo config
└── pnpm-workspace.yaml
```

**Pros:**
- Single source of truth
- Atomic changes across platforms
- Shared dependencies
- Easy refactoring

**Cons:**
- Larger repository
- More complex CI/CD
- Learning curve for team

### Option 2: Separate Repos + Shared Package

```
# Three separate repositories
medinvest-web/
medinvest-mobile/
medinvest-api/

# Published npm package
@medinvest/shared (types, utils, validators)
```

**Pros:**
- Independent deployments
- Smaller repos
- Team autonomy

**Cons:**
- Version synchronization overhead
- Possible drift between platforms

### Option 3: API-First with OpenAPI

```
# API spec drives everything
openapi.yaml → Generate types for all platforms
```

**Pros:**
- API is single source of truth
- Auto-generated clients
- Documentation included

**Cons:**
- Less flexibility
- Generated code can be verbose

---

## Recommended Approach

### Monorepo with Turborepo

```bash
# Setup
npx create-turbo@latest medinvest
cd medinvest

# Structure
pnpm init
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

**pnpm-workspace.yaml:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## Shared Code Structure

### 1. Shared Types Package

```
packages/shared-types/
├── src/
│   ├── index.ts
│   ├── user.ts
│   ├── post.ts
│   ├── message.ts
│   ├── notification.ts
│   ├── deal.ts
│   ├── api.ts
│   └── websocket.ts
├── package.json
└── tsconfig.json
```

**package.json:**
```json
{
  "name": "@medinvest/shared-types",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

**Usage in apps:**
```typescript
// apps/web/src/types.ts
export * from '@medinvest/shared-types';

// apps/mobile/src/types.ts
export * from '@medinvest/shared-types';
```

### 2. Shared Validators Package

```typescript
// packages/shared-validators/src/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
  specialty: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  full_name: z.string().min(2, 'Name is required'),
  specialty: z.string().optional(),
});

export const postSchema = z.object({
  content: z.string().min(1).max(5000),
  room_id: z.number().optional(),
  is_anonymous: z.boolean().optional(),
  images: z.array(z.string().url()).max(10).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PostInput = z.infer<typeof postSchema>;
```

**Usage:**
```typescript
// Both web and mobile use same validation
import { loginSchema, LoginInput } from '@medinvest/shared-validators';

const validateLogin = (data: unknown): LoginInput => {
  return loginSchema.parse(data);
};
```

### 3. Shared API Client Package

```typescript
// packages/api-client/src/client.ts
import type { 
  User, 
  Post, 
  LoginRequest, 
  LoginResponse,
  ApiResponse,
  PaginatedResponse,
} from '@medinvest/shared-types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.config.getToken();
    
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      this.config.onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request('POST', '/auth/login', data);
  }

  // Users
  async getUser(id: number): Promise<User> {
    return this.request('GET', `/users/${id}`);
  }

  async getCurrentUser(): Promise<User> {
    return this.request('GET', '/users/me');
  }

  // Posts
  async getFeed(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    return this.request('GET', `/posts/feed?page=${page}&limit=${limit}`);
  }

  async getPost(id: number): Promise<Post> {
    return this.request('GET', `/posts/${id}`);
  }

  async createPost(data: PostInput): Promise<Post> {
    return this.request('POST', '/posts', data);
  }

  async likePost(id: number): Promise<void> {
    return this.request('POST', `/posts/${id}/like`);
  }

  async unlikePost(id: number): Promise<void> {
    return this.request('DELETE', `/posts/${id}/like`);
  }

  // ... more methods
}
```

**Web usage:**
```typescript
// apps/web/src/lib/api.ts
import { ApiClient } from '@medinvest/api-client';

export const api = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  getToken: async () => localStorage.getItem('token'),
  onUnauthorized: () => {
    window.location.href = '/login';
  },
});
```

**Mobile usage:**
```typescript
// apps/mobile/src/lib/api.ts
import { ApiClient } from '@medinvest/api-client';
import * as SecureStore from 'expo-secure-store';

export const api = new ApiClient({
  baseUrl: Constants.expoConfig?.extra?.apiUrl,
  getToken: async () => SecureStore.getItemAsync('token'),
  onUnauthorized: () => {
    // Navigate to login
  },
});
```

### 4. Shared Utilities Package

```typescript
// packages/shared-utils/src/index.ts

// Date formatting
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  
  return then.toLocaleDateString();
}

// Number formatting
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Content parsing
export function extractMentions(content: string): string[] {
  const regex = /@(\w+)/g;
  const matches = content.match(regex);
  return matches ? matches.map(m => m.slice(1)) : [];
}

export function extractHashtags(content: string): string[] {
  const regex = /#(\w+)/g;
  const matches = content.match(regex);
  return matches ? matches.map(m => m.slice(1)) : [];
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[0-9]/.test(password);
}

// Content filtering
export function containsMutedKeywords(
  content: string, 
  keywords: string[]
): boolean {
  const lowerContent = content.toLowerCase();
  return keywords.some(kw => lowerContent.includes(kw.toLowerCase()));
}
```

---

## API Contract Enforcement

### OpenAPI Specification

```yaml
# api/openapi.yaml
openapi: 3.0.0
info:
  title: MedInvest API
  version: 1.0.0

paths:
  /auth/login:
    post:
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'

components:
  schemas:
    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
    
    LoginResponse:
      type: object
      properties:
        token:
          type: string
        refresh_token:
          type: string
        user:
          $ref: '#/components/schemas/User'
```

### Generate Types from OpenAPI

```bash
# Generate TypeScript types
npx openapi-typescript api/openapi.yaml -o packages/shared-types/src/generated.ts

# Generate API client
npx openapi-generator-cli generate \
  -i api/openapi.yaml \
  -g typescript-fetch \
  -o packages/api-client/src/generated
```

### Contract Testing

```typescript
// packages/api-client/src/__tests__/contract.test.ts
import { api } from '../client';
import { loginSchema } from '@medinvest/shared-validators';

describe('API Contract Tests', () => {
  it('login response matches schema', async () => {
    const response = await api.login({
      email: 'test@example.com',
      password: 'Password123!',
    });

    // Validate response matches expected shape
    expect(response).toHaveProperty('token');
    expect(response).toHaveProperty('user');
    expect(response.user).toHaveProperty('id');
    expect(response.user).toHaveProperty('email');
  });

  it('validates login input', () => {
    expect(() => loginSchema.parse({ email: 'invalid' })).toThrow();
    expect(() => loginSchema.parse({ 
      email: 'valid@email.com', 
      password: '12345678' 
    })).not.toThrow();
  });
});
```

---

## Real-time Sync

### Shared WebSocket Handler

```typescript
// packages/shared-utils/src/websocket.ts
import type { WebSocketEvent } from '@medinvest/shared-types';

export type WebSocketHandler = (event: WebSocketEvent) => void;

export interface WebSocketClientConfig {
  url: string;
  getToken: () => Promise<string | null>;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketClientConfig;
  private handlers: Set<WebSocketHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: WebSocketClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const token = await this.config.getToken();
    if (!token) return;

    const url = `${this.config.url}?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.config.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketEvent;
        this.handlers.forEach(handler => handler(data));
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.ws.onclose = () => {
      this.config.onDisconnect?.();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      this.config.onError?.(new Error('WebSocket error'));
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(), delay);
    }
  }

  subscribe(handler: WebSocketHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(event: WebSocketEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
```

---

## Feature Parity Tracking

### Feature Matrix

```markdown
# features.md - Keep in root of monorepo

| Feature | Web | Mobile | API | Notes |
|---------|-----|--------|-----|-------|
| **Auth** |
| Login | ✅ | ✅ | ✅ | |
| Register | ✅ | ✅ | ✅ | |
| Biometric | ❌ | ✅ | N/A | Mobile only |
| OAuth | 🚧 | 🚧 | ✅ | In progress |
| **Posts** |
| Create | ✅ | ✅ | ✅ | |
| Edit | ✅ | ✅ | ✅ | |
| Delete | ✅ | ✅ | ✅ | |
| Polls | ✅ | ✅ | ✅ | |
| Reactions | ✅ | ✅ | ✅ | |
| Pin | ✅ | ✅ | ✅ | |
| **Messaging** |
| Send | ✅ | ✅ | ✅ | |
| Typing indicator | ✅ | ✅ | ✅ | |
| Read receipts | ✅ | ✅ | ✅ | |
| **Platform Specific** |
| Push notifications | N/A | ✅ | ✅ | |
| iOS widgets | N/A | ✅ | N/A | |
| App shortcuts | N/A | ✅ | N/A | |
| Offline queue | ❌ | ✅ | N/A | Mobile priority |
```

### Automated Feature Sync Check

```typescript
// scripts/check-feature-parity.ts
import * as fs from 'fs';
import * as path from 'path';

interface Feature {
  name: string;
  web: boolean;
  mobile: boolean;
  api: boolean;
}

function checkFeatureParity(): void {
  const webScreens = fs.readdirSync('apps/web/src/pages');
  const mobileScreens = fs.readdirSync('apps/mobile/src/screens');
  const apiRoutes = fs.readdirSync('apps/api/src/routes');

  // Compare and report
  console.log('=== Feature Parity Report ===\n');
  
  // Check for screens in mobile but not web
  const mobileOnly = mobileScreens.filter(s => !webScreens.includes(s));
  if (mobileOnly.length > 0) {
    console.log('Mobile only screens:', mobileOnly);
  }

  // Check for pages in web but not mobile
  const webOnly = webScreens.filter(s => !mobileScreens.includes(s));
  if (webOnly.length > 0) {
    console.log('Web only pages:', webOnly);
  }
}

checkFeatureParity();
```

---

## Testing Strategy

### Shared Test Utilities

```typescript
// packages/test-utils/src/index.ts
import type { User, Post } from '@medinvest/shared-types';

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    is_verified: false,
    is_premium: false,
    is_admin: false,
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockPost(overrides?: Partial<Post>): Post {
  return {
    id: 1,
    author: {
      id: 1,
      full_name: 'Test User',
      is_verified: false,
    },
    content: 'Test post content',
    is_anonymous: false,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    views_count: 0,
    is_liked: false,
    is_bookmarked: false,
    is_pinned: false,
    reactions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
```

### E2E Tests (Shared Scenarios)

```typescript
// packages/e2e-tests/src/scenarios/auth.ts
export const authScenarios = {
  login: {
    validCredentials: {
      email: 'test@medinvest.com',
      password: 'TestPassword123!',
    },
    invalidPassword: {
      email: 'test@medinvest.com',
      password: 'wrongpassword',
    },
  },
  
  steps: {
    login: [
      'Navigate to login page',
      'Enter email',
      'Enter password',
      'Tap login button',
      'Verify redirected to home',
    ],
  },
};

// Use in both web (Playwright) and mobile (Detox) tests
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Shared packages
  shared:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter "@medinvest/*" build
      - run: pnpm --filter "@medinvest/*" test
      - run: pnpm --filter "@medinvest/*" typecheck

  # Web app
  web:
    needs: shared
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter web build
      - run: pnpm --filter web test
      - run: pnpm --filter web lint

  # Mobile app
  mobile:
    needs: shared
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter mobile typecheck
      - run: pnpm --filter mobile lint
      - run: pnpm --filter mobile test

  # API
  api:
    needs: shared
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm --filter api build
      - run: pnpm --filter api test
      
  # Contract tests
  contract-tests:
    needs: [web, mobile, api]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter api start &
      - run: sleep 10
      - run: pnpm --filter api-client test:contract

  # Feature parity check
  feature-parity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm run check-feature-parity
```

---

## Summary

### Key Sync Strategies

1. **Shared Types Package** - Single source of truth for all TypeScript types
2. **Shared Validators** - Same validation rules (Zod) across platforms
3. **Shared API Client** - Consistent API calls with platform-specific config
4. **Shared Utilities** - Common functions (date formatting, parsing, etc.)
5. **OpenAPI Spec** - API contract enforcement
6. **Feature Matrix** - Track what's implemented where
7. **Contract Tests** - Verify API responses match expected types
8. **CI/CD Pipeline** - Automated checks on every PR

### Quick Start

```bash
# 1. Create monorepo
npx create-turbo@latest medinvest

# 2. Add shared packages
mkdir -p packages/{shared-types,shared-validators,shared-utils,api-client}

# 3. Copy existing code
cp -r web-app apps/web
cp -r mobile-app apps/mobile

# 4. Update imports to use shared packages
# @medinvest/shared-types
# @medinvest/shared-validators
# @medinvest/api-client

# 5. Run everything
pnpm install
pnpm build
pnpm test
```

This architecture ensures your web and mobile apps stay in sync while allowing platform-specific features where needed.
