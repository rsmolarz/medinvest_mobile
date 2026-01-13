# MedInvest Apple Watch API Reference

## Overview

This document provides the API reference for integrating the MedInvest Apple Watch app with the backend server. The watch app can access portfolio data, receive deal alerts, and view investment summaries.

## Base URL

**Development:**
```
https://sudx66ludnd9.picard.replit.dev:5000/api
```

**Production:**
```
https://your-app-name.replit.app/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://...",
    "isVerified": true,
    "fullName": "John Doe"
  }
}
```

### Social Login (Google/Apple/GitHub/Facebook)

**Endpoint:** `POST /auth/social`

**Request Body:**
```json
{
  "provider": "google|apple|github|facebook",
  "token": "oauth_id_token",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** Same as login

### Token Notes

- The API uses a single JWT token (no refresh token)
- Tokens expire after 30 days
- When token expires, the API returns `401 Unauthorized`
- The watch app should prompt user to re-authenticate via iPhone companion app
- Store token securely in Keychain

---

## Portfolio Endpoints

All portfolio endpoints require authentication.

### Get Portfolio Summary

Perfect for watch complications and glances.

**Endpoint:** `GET /portfolio/summary`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "totalValue": 27500.00,
  "totalInvested": 25000.00,
  "totalGainLoss": 2500.00,
  "gainLossPercent": 10.0,
  "activeInvestments": 5,
  "completedInvestments": 2,
  "pendingInvestments": 1
}
```

### Get Investments List

**Endpoint:** `GET /portfolio/investments`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)
- `status` (optional): Filter by status (`active`, `completed`, `pending`)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "investmentId": "uuid",
      "name": "BioTech Therapeutics",
      "category": "Biotech",
      "imageUrl": "https://...",
      "amountInvested": 5000.00,
      "currentValue": 6250.00,
      "gainLossPercent": 25.0,
      "status": "active",
      "investedAt": "2025-06-15T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "totalItems": 8,
  "totalPages": 1,
  "hasMore": false
}
```

### Get Transactions

**Endpoint:** `GET /portfolio/transactions`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by type (`investment`, `dividend`, `withdrawal`)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "investment",
      "amount": 5000.00,
      "status": "completed",
      "investmentName": "MedDevice Pro",
      "createdAt": "2026-01-10T14:30:00.000Z",
      "completedAt": "2026-01-10T14:35:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "totalItems": 5,
  "totalPages": 1,
  "hasMore": false
}
```

---

## Investment Deals

### Get Deals List

**Endpoint:** `GET /investments`

**Headers:** `Authorization: Bearer <token>` (optional - affects bookmark status)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `category` (optional): Filter by category
- `riskLevel` (optional): Filter by risk level
- `status` (optional): Filter by status (default: `active`)
- `sortBy` (optional): `newest`, `endingSoon`, `mostFunded`, `highestROI`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "AI Diagnostics Platform",
      "description": "Revolutionary AI-powered medical diagnostics",
      "category": "Digital Health",
      "imageUrl": "https://...",
      "fundingGoal": 500000.00,
      "fundingCurrent": 325000.00,
      "minimumInvestment": 1000.00,
      "expectedROI": "15-25%",
      "riskLevel": "medium",
      "status": "active",
      "daysRemaining": 21,
      "startDate": "2025-12-01T00:00:00.000Z",
      "endDate": "2026-02-03T23:59:59.000Z",
      "investors": 45,
      "createdAt": "2025-12-01T00:00:00.000Z",
      "updatedAt": "2026-01-10T00:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalItems": 15,
  "totalPages": 2,
  "hasMore": true
}
```

### Get Deal Details

**Endpoint:** `GET /investments/:id`

**Headers:** `Authorization: Bearer <token>` (optional)

**Response:** Same structure as list item, plus additional fields available in the investment record.

---

## User Profile

### Get Current User

**Endpoint:** `GET /users/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "avatarUrl": "https://...",
  "isVerified": true,
  "isPremium": false,
  "specialty": "Investor",
  "bio": "Healthcare investor focused on biotech",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Register Push Token

For receiving notifications on the watch.

**Endpoint:** `POST /users/me/push-token`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "token": "apple_push_token_here",
  "platform": "watchos"
}
```

Note: `platform` is optional but recommended for filtering notifications.

**Response:**
```json
{
  "message": "Push token registered"
}
```

### Remove Push Token

**Endpoint:** `DELETE /users/me/push-token`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "token": "apple_push_token_here"
}
```

**Response:**
```json
{
  "message": "Push token unregistered"
}
```

---

## Messages

### Get Unread Count

Perfect for watch badge updates.

**Endpoint:** `GET /messages/unread-count`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "count": 3
}
```

### Get Conversations

**Endpoint:** `GET /messages`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "other_user": {
        "id": "uuid",
        "email": "sarah@example.com",
        "first_name": "Sarah",
        "last_name": "Mitchell",
        "full_name": "Sarah Mitchell",
        "avatar_url": "https://...",
        "is_verified": true
      },
      "last_message": "Thanks for your investment inquiry!",
      "last_message_at": "2026-01-13T10:30:00.000Z",
      "unread_count": 2,
      "is_muted": false
    }
  ]
}
```

**Note:** All fields in messages responses use `snake_case` naming convention.

---

## AI Assistant

### Quick Chat

For watch voice interactions.

**Endpoint:** `POST /ai/chat`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "What's my portfolio performance?",
  "context": "watch"
}
```

**Response:**
```json
{
  "response": "Your portfolio is up 10% this month with a total value of $27,500. Your top performer is BioTech Therapeutics at +25%."
}
```

---

## Error Responses

All endpoints return consistent error formats:

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or expired token |
| 403 | Forbidden - Access denied |
| 404 | Not Found |
| 500 | Server Error |

---

## Watch-Specific Recommendations

### Complications

Use these endpoints for complications:
- **Portfolio Value:** `GET /portfolio/summary` → `totalValue`
- **Daily Change:** `GET /portfolio/summary` → `totalGainLoss`, `gainLossPercent`
- **Unread Messages:** `GET /messages/unread-count` → `count`

### Data Refresh Strategy

- **Background refresh:** Every 15-30 minutes
- **On wrist raise:** Check if data is older than 5 minutes
- **Push notifications:** Use APNs for real-time deal alerts

### Caching

Cache responses locally on the watch for offline access:
- Portfolio summary: 5 minutes
- Deal list: 15 minutes
- User profile: 1 hour

### WatchConnectivity

For seamless authentication, use WatchConnectivity to:
1. Transfer JWT tokens from iPhone to Watch
2. Sync user preferences
3. Handle re-authentication when token expires

---

## Sample Swift Code

### Models

```swift
import Foundation

// MARK: - Portfolio

struct PortfolioSummary: Decodable {
    let totalValue: Double
    let totalInvested: Double
    let totalGainLoss: Double
    let gainLossPercent: Double
    let activeInvestments: Int
    let completedInvestments: Int
    let pendingInvestments: Int
}

struct PortfolioInvestment: Decodable {
    let id: String
    let investmentId: String
    let name: String
    let category: String
    let imageUrl: String?
    let amountInvested: Double
    let currentValue: Double
    let gainLossPercent: Double
    let status: String
    let investedAt: String
}

struct PortfolioInvestmentsResponse: Decodable {
    let data: [PortfolioInvestment]
    let page: Int
    let limit: Int
    let totalItems: Int
    let totalPages: Int
    let hasMore: Bool
}

// MARK: - Investments

struct Investment: Decodable {
    let id: String
    let name: String
    let description: String
    let category: String
    let imageUrl: String?
    let fundingGoal: Double
    let fundingCurrent: Double
    let minimumInvestment: Double
    let expectedROI: String
    let riskLevel: String
    let status: String
    let daysRemaining: Int
    let investors: Int
}

struct InvestmentsResponse: Decodable {
    let data: [Investment]
    let page: Int
    let limit: Int
    let totalItems: Int
    let totalPages: Int
    let hasMore: Bool
}

// MARK: - Messages

struct UnreadCountResponse: Decodable {
    let count: Int
}

struct ConversationUser: Decodable {
    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let fullName: String
    let avatarUrl: String?
    let isVerified: Bool
    
    enum CodingKeys: String, CodingKey {
        case id, email
        case firstName = "first_name"
        case lastName = "last_name"
        case fullName = "full_name"
        case avatarUrl = "avatar_url"
        case isVerified = "is_verified"
    }
}

struct Conversation: Decodable {
    let id: String
    let otherUser: ConversationUser
    let lastMessage: String?
    let lastMessageAt: String?
    let unreadCount: Int
    let isMuted: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case otherUser = "other_user"
        case lastMessage = "last_message"
        case lastMessageAt = "last_message_at"
        case unreadCount = "unread_count"
        case isMuted = "is_muted"
    }
}

struct ConversationsResponse: Decodable {
    let conversations: [Conversation]
}

// MARK: - Errors

enum APIError: Error {
    case invalidResponse
    case unauthorized
    case serverError(Int)
    case decodingError(Error)
}
```

### API Client

```swift
import Foundation

class MedInvestAPI {
    static let shared = MedInvestAPI()
    
    private let baseURL = "https://your-app.replit.app/api"
    private var token: String?
    
    func setToken(_ token: String) {
        self.token = token
        KeychainHelper.save(token, forKey: "medinvest_token")
    }
    
    func loadToken() {
        self.token = KeychainHelper.load(forKey: "medinvest_token")
    }
    
    func clearToken() {
        self.token = nil
        KeychainHelper.delete(forKey: "medinvest_token")
    }
    
    private func makeRequest<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidResponse
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = body
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }
        
        if httpResponse.statusCode >= 400 {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
    
    // MARK: - Portfolio
    
    func getPortfolioSummary() async throws -> PortfolioSummary {
        try await makeRequest(endpoint: "/portfolio/summary")
    }
    
    func getPortfolioInvestments(page: Int = 1, limit: Int = 10) async throws -> PortfolioInvestmentsResponse {
        try await makeRequest(endpoint: "/portfolio/investments?page=\(page)&limit=\(limit)")
    }
    
    // MARK: - Investments
    
    func getInvestments(page: Int = 1, limit: Int = 10) async throws -> InvestmentsResponse {
        try await makeRequest(endpoint: "/investments?page=\(page)&limit=\(limit)")
    }
    
    // MARK: - Messages
    
    func getUnreadCount() async throws -> UnreadCountResponse {
        try await makeRequest(endpoint: "/messages/unread-count")
    }
    
    func getConversations() async throws -> ConversationsResponse {
        try await makeRequest(endpoint: "/messages")
    }
    
    // MARK: - Push Tokens
    
    func registerPushToken(_ token: String, platform: String = "watchos") async throws {
        let body = try JSONEncoder().encode(["token": token, "platform": platform])
        let _: MessageResponse = try await makeRequest(
            endpoint: "/users/me/push-token",
            method: "POST",
            body: body
        )
    }
}

struct MessageResponse: Decodable {
    let message: String
}
```

### Complication Data Provider

```swift
import ClockKit

class ComplicationDataSource: NSObject, CLKComplicationDataSource {
    func getCurrentTimelineEntry(
        for complication: CLKComplication,
        withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void
    ) {
        Task {
            do {
                let summary = try await MedInvestAPI.shared.getPortfolioSummary()
                let template = createTemplate(for: complication, with: summary)
                let entry = CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
                handler(entry)
            } catch {
                handler(nil)
            }
        }
    }
    
    private func createTemplate(
        for complication: CLKComplication,
        with summary: PortfolioSummary
    ) -> CLKComplicationTemplate {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.maximumFractionDigits = 0
        
        let valueText = formatter.string(from: NSNumber(value: summary.totalValue)) ?? "$0"
        let changeText = String(format: "%+.1f%%", summary.gainLossPercent)
        let changeColor = summary.gainLossPercent >= 0 ? UIColor.green : UIColor.red
        
        switch complication.family {
        case .circularSmall:
            let template = CLKComplicationTemplateCircularSmallSimpleText()
            template.textProvider = CLKSimpleTextProvider(text: changeText)
            return template
            
        case .modularSmall:
            let template = CLKComplicationTemplateModularSmallStackText()
            template.line1TextProvider = CLKSimpleTextProvider(text: valueText)
            template.line2TextProvider = CLKSimpleTextProvider(text: changeText)
            return template
            
        case .graphicCircular:
            let template = CLKComplicationTemplateGraphicCircularStackText()
            template.line1TextProvider = CLKSimpleTextProvider(text: valueText)
            template.line2TextProvider = CLKSimpleTextProvider(text: changeText)
            return template
            
        default:
            let template = CLKComplicationTemplateCircularSmallSimpleText()
            template.textProvider = CLKSimpleTextProvider(text: changeText)
            return template
        }
    }
}
```

### WatchConnectivity for Token Sync

```swift
import WatchConnectivity

class WatchSessionManager: NSObject, WCSessionDelegate {
    static let shared = WatchSessionManager()
    
    private var session: WCSession?
    
    func startSession() {
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }
    
    // Receive token from iPhone
    func session(
        _ session: WCSession,
        didReceiveMessage message: [String : Any]
    ) {
        if let token = message["token"] as? String {
            DispatchQueue.main.async {
                MedInvestAPI.shared.setToken(token)
                NotificationCenter.default.post(name: .tokenReceived, object: nil)
            }
        }
    }
    
    // Receive token via application context (persistent)
    func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String : Any]
    ) {
        if let token = applicationContext["token"] as? String {
            DispatchQueue.main.async {
                MedInvestAPI.shared.setToken(token)
            }
        }
    }
    
    // Request token from iPhone when needed
    func requestToken() {
        session?.sendMessage(["request": "token"], replyHandler: { reply in
            if let token = reply["token"] as? String {
                DispatchQueue.main.async {
                    MedInvestAPI.shared.setToken(token)
                }
            }
        }, errorHandler: { error in
            print("Failed to request token: \(error)")
        })
    }
    
    // WCSessionDelegate required methods
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if activationState == .activated {
            // Check for token in application context
            if let token = session.receivedApplicationContext["token"] as? String {
                MedInvestAPI.shared.setToken(token)
            }
        }
    }
}

extension Notification.Name {
    static let tokenReceived = Notification.Name("tokenReceived")
}
```

---

## Contact

For API issues or feature requests, contact the MedInvest development team.
