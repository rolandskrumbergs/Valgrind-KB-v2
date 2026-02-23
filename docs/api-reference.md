# KB Platform — API Reference

This document defines every API endpoint in the new system, organized by bounded context. Use this as the reference when implementing Minimal API endpoints in KB.Server and CQRS handlers in KB.Core.

---

## Authentication API

All auth endpoints are public (no JWT required) unless noted.

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/register` | Register new user (email + password) | Public |
| POST | `/api/auth/login` | Login → JWT + refresh token. Rejects if `MustResetPassword` | Public |
| POST | `/api/auth/refresh` | Refresh token rotation → new JWT + refresh token | Public (refresh token) |
| POST | `/api/auth/logout` | Revoke refresh token | Bearer |
| POST | `/api/auth/forgot-password` | Send password reset email via Resend | Public |
| POST | `/api/auth/reset-password` | Reset password with token (clears `MustResetPassword`) | Public (reset token) |
| DELETE | `/api/auth/account` | Delete own account | Bearer |
| GET | `/api/auth/me` | Current user profile + org info | Bearer |
| PUT | `/api/auth/me` | Update own profile | Bearer |

### JWT Structure
```json
{
  "sub": "<user-guid>",
  "email": "user@example.com",
  "role": "admin",
  "org": "<org-guid>",
  "sub_active": true,
  "iat": 1708000000,
  "exp": 1708003600
}
```

### Auth Flows
- **Normal login**: POST `/login` → 200 with JWT + refresh token
- **Migrated user**: POST `/login` → 403 with `MUST_RESET_PASSWORD` error → user calls `/forgot-password` → `/reset-password`
- **Token refresh**: POST `/refresh` with refresh token → new JWT + new refresh token (old revoked)

---

## Admin API (Requires `admin` role)

### Organizations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/organizations` | List with pagination, search |
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/{id}` | Detail with seat usage stats |
| PUT | `/api/organizations/{id}` | Update |
| DELETE | `/api/organizations/{id}` | Soft-delete |
| GET | `/api/organizations/{id}/members` | Members with subscription status |
| GET | `/api/organizations/{id}/courses` | Shared courses |

### Subscriptions (Seats)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/organizations/{orgId}/subscriptions` | List seats |
| POST | `/api/organizations/{orgId}/subscriptions` | Create seat(s) |
| PUT | `/api/subscriptions/{id}` | Update (activate/deactivate) |
| DELETE | `/api/subscriptions/{id}` | Remove seat |
| POST | `/api/subscriptions/{id}/assign` | Assign user to seat |
| POST | `/api/subscriptions/{id}/unassign` | Remove user from seat |

### Members (Users)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/members` | List all users, filterable by org/role/status |
| GET | `/api/members/{id}` | Detail with org, subscription, usage stats |
| PUT | `/api/members/{id}` | Update profile fields |
| DELETE | `/api/members/{id}` | Delete user (cascading) |
| POST | `/api/members/{id}/ban` | Ban with reason + optional expiry |
| POST | `/api/members/{id}/unban` | Unban |
| POST | `/api/members/invite` | Send invitation email via Resend |
| GET | `/api/members/{id}/usage` | Token usage summary |

### Articles

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/articles` | List with pagination, status filter |
| POST | `/api/articles` | Create (draft) |
| GET | `/api/articles/{id}` | Detail |
| PUT | `/api/articles/{id}` | Update |
| DELETE | `/api/articles/{id}` | Delete |
| POST | `/api/articles/{id}/publish` | Draft → Published |
| POST | `/api/articles/{id}/unpublish` | Published → Draft |
| POST | `/api/articles/upload-image` | Upload featured image to Blob |
| POST | `/api/articles/upload-attachment` | Upload PDF attachment to Blob |

### Courses

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create course |
| GET | `/api/courses/{id}` | Detail with chapters, questions |
| PUT | `/api/courses/{id}` | Update course |
| DELETE | `/api/courses/{id}` | Delete course |
| POST | `/api/courses/{id}/publish` | Publish |
| POST | `/api/courses/{id}/unpublish` | Unpublish |
| POST | `/api/courses/{id}/chapters` | Add chapter |
| PUT | `/api/chapters/{id}` | Update chapter |
| DELETE | `/api/chapters/{id}` | Delete chapter |
| POST | `/api/chapters/{id}/questions` | Add question with options |
| PUT | `/api/questions/{id}` | Update question |
| DELETE | `/api/questions/{id}` | Delete question |
| POST | `/api/courses/{id}/share` | Share with organization |
| POST | `/api/courses/upload-image` | Upload course image |

### AI Profiles

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/ai-profiles` | List all |
| POST | `/api/ai-profiles` | Create |
| GET | `/api/ai-profiles/{id}` | Detail |
| PUT | `/api/ai-profiles/{id}` | Update |
| DELETE | `/api/ai-profiles/{id}` | Delete |
| POST | `/api/ai-profiles/{id}/activate` | Set as active (deactivates others) |

### Conversation Starters

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/conversation-starters` | List all |
| POST | `/api/conversation-starters` | Create/update (bulk replace) |

### Knowledge Bases

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/knowledge-bases` | List knowledge bases |
| POST | `/api/knowledge-bases` | Create knowledge base (provisions isolated storage) |
| GET | `/api/knowledge-bases/{id}` | Detail |
| PUT | `/api/knowledge-bases/{id}` | Update |
| DELETE | `/api/knowledge-bases/{id}` | Soft-delete |

### Documents (Knowledge Base)

Documents are always scoped to a specific KnowledgeBase.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/knowledge-bases/{knowledgeBaseId}/documents` | List with status/category filters |
| POST | `/api/knowledge-bases/{knowledgeBaseId}/documents/upload` | Upload + trigger ingestion pipeline |
| GET | `/api/knowledge-bases/{knowledgeBaseId}/documents/{id}` | Detail with processing status & metrics |
| DELETE | `/api/knowledge-bases/{knowledgeBaseId}/documents/{id}` | Delete file + vectors + blob |
| POST | `/api/knowledge-bases/{knowledgeBaseId}/documents/{id}/reprocess` | Re-trigger ingestion |

### Analytics

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/analytics/invocations` | Paginated AI invocation log with filters |
| GET | `/api/analytics/usage` | Token usage by user/period/model |
| GET | `/api/analytics/quality` | Confidence score distributions |
| GET | `/api/analytics/dashboard` | Summary stats for admin dashboard |

---

## Consumer API (Requires authenticated user)

These endpoints serve both the mobile app and non-admin web users.

### Conversations (Chat)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/conversations` | Create new conversation |
| GET | `/api/conversations` | List user's conversations (paginated) |
| GET | `/api/conversations/{id}` | Get conversation with messages |
| DELETE | `/api/conversations/{id}` | Delete conversation |
| POST | `/api/conversations/{id}/messages` | Send message → SSE stream response |
| POST | `/api/conversations/{id}/messages/{msgId}/feedback` | Thumbs up/down |
| GET | `/api/conversations/quota` | Remaining token quota |

### Feed (Articles for users)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/feed/articles` | Published articles (filtered by user's org) |
| GET | `/api/feed/articles/{id}` | Single article |

### Catalog (Courses for users)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/catalog/courses` | Available courses (org-shared + purchasable) |
| GET | `/api/catalog/courses/{id}` | Course detail with chapters/questions |

### Enrollments

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/enrollments` | Enroll in course |
| GET | `/api/enrollments` | User's enrolled courses |
| PUT | `/api/enrollments/{id}/progress` | Update chapter progress |
| POST | `/api/enrollments/{id}/complete` | Mark complete + generate certificate |
| GET | `/api/enrollments/{id}/certificate` | Download certificate PDF |

### Devices

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/devices` | Register device (push token, platform, version) |
| DELETE | `/api/devices/{token}` | Unregister on logout |

### Purchases

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/purchases/verify` | RevenueCat webhook receiver |
| POST | `/api/purchases` | Record purchase |
| GET | `/api/purchases` | User's purchase history |

### Profile

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/profile` | Current user profile + org + subscription |
| PUT | `/api/profile` | Update own profile |
| GET | `/api/profile/invitations` | Pending invitations |
| POST | `/api/profile/invitations/{id}/accept` | Accept invitation |

---

## Common Patterns

### Pagination
All list endpoints accept: `?page=1&pageSize=20&sortBy=createdAt&sortDir=desc`

### Error Responses
Standard Problem Details (RFC 7807):
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Not Found",
  "status": 404,
  "detail": "Organization with ID abc123 not found."
}
```

### Validation Errors (422)
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Error",
  "status": 422,
  "errors": {
    "Name": ["Name is required."],
    "MaxSeats": ["MaxSeats must be greater than 0."]
  }
}
```

### SSE Streaming (Chat)
`POST /api/conversations/{id}/messages` returns `Content-Type: text/event-stream`:
```
data: {"type":"text","content":"Hej! "}
data: {"type":"text","content":"Jag kan "}
data: {"type":"tool_call","name":"fa_noggrann_information","args":{...}}
data: {"type":"tool_result","content":"..."}
data: {"type":"text","content":"Enligt lagtext..."}
data: {"type":"usage","promptTokens":150,"completionTokens":200}
data: [DONE]
```
