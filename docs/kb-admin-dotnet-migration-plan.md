# KB Admin → .NET Full Refactor Plan

## Problem Statement

Build a completely **new .NET 8+ ASP.NET Core** backend with a **React (Vite) frontend**, sharing the same solution as the Guardian Legal AI Semantic Kernel project. This is **not a 1:1 migration** — it is a full refactoring with improved domain modeling, better patterns, and a redesigned database schema. Data will be migrated from the old system via scripts.

The old Next.js system (kb-admin) and the new .NET system will **run side by side**. New app versions will target the new API; old app versions continue using the old backend until deprecated and removed from app stores.

The React Native mobile app (**kb-app**) will be updated to authenticate against the new backend (ASP.NET Core Identity + JWT instead of BetterAuth). **Users will NOT have their passwords migrated** — they will be required to set up new passwords (via a forced password-reset flow) when the new system goes live.

## Current System Analysis

### kb-admin (Next.js) — Legacy
- **Framework**: Next.js 16 with App Router, Turbopack, server actions
- **Auth**: BetterAuth with email/password, Expo plugin, admin plugin, username plugin, custom session (license check)
- **Database**: PostgreSQL via Drizzle ORM (Neon serverless)
- **AI Chat**: Vercel AI SDK + OpenRouter, streaming via `createDataStreamResponse`, tool calling (`fa_noggrann_information`)
- **RAG**: Upstash Vector (4 indexes: books, laws, legalcases, other) + custom Swedish BERT embedding service
- **Storage**: AWS S3 for documents, SQS for processing queue
- **Telemetry**: Azure Application Insights + OpenTelemetry
- **Email**: SendGrid
- **Roles**: `admin` | `user` with fine-grained RBAC via BetterAuth access control

### Key Feature Domains (Admin)
| Domain | Description |
|---|---|
| **AI Chat (Lena)** | Streaming chat with RAG, configurable Lena profiles (threshold, topK, model), tool-calling agentic loop |
| **Knowledge Base** | File upload to S3 → SQS processing → chunking/embedding → Upstash Vector indexing; CRUD management |
| **News** | Rich text editor (TipTap), featured images, PDF attachments, draft/published status, customer exclusion targeting |
| **Education/Courses** | Course CRUD with chapters, video URLs, multiple-choice questions, customer sharing, purchases (RevenueCat), certificates (pdf-lib) |
| **Customer Management** | Organizations with license allocation, user-customer linking |
| **License Management** | License CRUD per customer, activation/deactivation, user assignment |
| **User Management** | User CRUD, roles, ban/unban, invitation flow, security numbers |
| **Lena Analytics** | Knowledge base invocation logging, token usage tracking, quality metrics |
| **Push Notifications** | Expo push token management, notification sending |
| **Lena Profile Config** | Configurable AI profiles (model, topK, thresholds) with audit trail |
| **Starter Questions** | Configurable starter questions for chat UI |

### kb-app (React Native / Expo) — Existing
- **Framework**: Expo 53, React Native 0.79, Expo Router
- **Auth**: BetterAuth Expo client → `kb.intressebevakaren.se` (kb-admin) auth endpoints
- **Data fetching**: Axios + TanStack React Query, direct API calls to kb-admin
- **Features**: Chat (Lena), News, Education (courses, certificates, purchases), Profile, Settings
- **Payments**: RevenueCat (`react-native-purchases`)
- **Notifications**: Expo Notifications
- **i18n**: i18next
- **Styling**: NativeWind (Tailwind for RN)

### Legacy API Surface Used by kb-app (for reference only — will be redesigned)
| Endpoint | Purpose |
|---|---|
| `/api/auth/*` | BetterAuth endpoints (login, signup, session, password reset, delete account) |
| `/api/chat` | POST (stream chat), DELETE (delete chat) |
| `/api/expo/chats` | GET chats list (User-ID header auth) |
| `/api/expo/news` | GET news list (with customer targeting) |
| `/api/expo/news/[id]` | GET single news |
| `/api/expo/users` | User-related operations |
| `/api/expo/push-tokens` | Push token registration |
| `/api/history` | Chat history |
| `/api/course-catalog` | Course browsing |
| `/api/courses/*` | Course operations |
| `/api/invitations` | Invitation handling |
| `/api/purchase` | RevenueCat purchase verification |
| `/api/vote` | Message voting |
| `/api/llm` | LLM chunk scoring endpoint |

### Legacy Database Schema (PostgreSQL — 20+ tables, for data migration reference)
- **Auth**: `user`, `session`, `account`, `verification`
- **Business**: `customers`, `licenses`
- **Chat/AI**: `chat`, `message`, `vote`, `token_usage`, `knowledge_base_invocations`, `lena_profiles`, `lena_starter_questions`
- **Knowledge Base**: `ibben_lena_knowledge_files`
- **Content**: `news`
- **Education**: `courses`, `chapters`, `questions`, `question_options`, `customer_courses`, `user_courses`, `user_question_answers`, `course_purchases`, `chat_tokens_purchases`
- **Notifications**: `push_tokens`

---

## Coexistence Strategy

```
┌────────────────────────────────────────────────────────────────┐
│                     kb-app (React Native)                       │
│                                                                  │
│  ┌──────────────────┐          ┌──────────────────────┐         │
│  │  Old App Version │          │  New App Version     │         │
│  │  (BetterAuth)    │          │  (JWT + new API)     │         │
│  └────────┬─────────┘          └──────────┬───────────┘         │
└───────────┼────────────────────────────────┼────────────────────┘
            │                                │
            ▼                                ▼
┌───────────────────────┐    ┌───────────────────────────────────┐
│  kb-admin (Next.js)   │    │  GuardianLegalAI (.NET 8+)        │
│  Legacy — unchanged   │    │  New — separate domain/port       │
│  ───────────────────  │    │  ────────────────────────────────  │
│  BetterAuth           │    │  ASP.NET Core Identity + JWT      │
│  Drizzle / Neon PG    │    │  EF Core / new PostgreSQL DB      │
│  Vercel AI SDK        │    │  Semantic Kernel + SSE streaming   │
│  AWS S3 + Upstash     │    │  Azure Blob + Azure AI Search     │
│  SendGrid             │    │  Resend                            │
└───────────────────────┘    └───────────────────────────────────┘
       ▼ (reads)                     ▼ (new DB)
┌───────────────────────┐    ┌───────────────────────────────────┐
│  Old PostgreSQL DB    │───►│  New PostgreSQL DB                 │
│  (Neon / existing)    │ migration │  (Redesigned schema)        │
└───────────────────────┘  scripts  └───────────────────────────────┘
```

**Key principles:**
- Old and new systems are **completely independent** — separate databases, separate deployments
- New app version targets new API only; old app version targets old API only
- Data migration scripts run once to seed the new DB from the old one
- Old system stays live until all old app versions are sunsetted (forced update or app store removal)
- No shared auth — users must set up new passwords on first login to new system

---

## Architecture: New System

```
┌─────────────────────────────────────────────────────────────────┐
│                kb-app (React Native / Expo)                      │
│  Lena Chat · News · Education · Profile · Push Notifications     │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST API + Bearer Token (JWT)
                        │ Chat streaming via SSE
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│              GuardianLegalAI.Api (ASP.NET Core 8+)               │
│                                                                   │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────────┐  │
│  │ Identity &  │ │  Chat API    │ │  Content API              │  │
│  │ Auth (JWT)  │ │  (SSE)       │ │  News, Courses, etc.      │  │
│  └─────────────┘ └──────┬───────┘ └───────────────────────────┘  │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐   │
│  │                Admin API (Minimal APIs)                     │   │
│  │  Organizations · Members · Subscriptions · KB Files ·      │   │
│  │  Articles · Courses · AI Profiles · Analytics · Devices    │   │
│  └───────────────────────┬───────────────────────────────────┘   │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐   │
│  │           Semantic Kernel Orchestration (AI Module)         │   │
│  │  RAG Plugin · Confidence Scoring · Citation Verification   │   │
│  └───────────────────────┬───────────────────────────────────┘   │
│                          │                                        │
│  ┌───────────────────────▼───────────────────────────────────┐   │
│  │                  Infrastructure Layer                       │   │
│  │  EF Core (PostgreSQL) · Azure Blob · Azure AI Search       │   │
│  │  Resend · Expo Push · Azure App Insights                   │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│             GuardianLegalAI.Web (React SPA — Vite)               │
│  Admin Dashboard · Chat UI · Document Upload · Article Editor ·  │
│  Course Editor · Org Mgmt · Member Mgmt · Analytics              │
└──────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Mobile App** | Expo 53 + React Native (kb-app, updated auth + API) |
| **Admin Frontend** | React (Vite) + TypeScript + TailwindCSS + shadcn/ui |
| **Backend API** | ASP.NET Core 8+ Minimal APIs |
| **Chat Streaming** | Server-Sent Events (SSE) |
| **Auth** | ASP.NET Core Identity + JWT Bearer tokens |
| **AI Orchestration** | Microsoft Semantic Kernel |
| **Document Ingestion** | Microsoft Kernel Memory |
| **Vector Store** | Azure AI Search (hybrid: vector + semantic ranking) |
| **LLM Providers** | Azure OpenAI + OpenAI (configurable) |
| **Database** | PostgreSQL (EF Core) — **new database, redesigned schema** |
| **File Storage** | Azure Blob Storage |
| **Email** | Resend |
| **Push Notifications** | Expo Server SDK (.NET) |
| **Payments** | RevenueCat (webhook + API validation) |
| **Telemetry** | Application Insights + OpenTelemetry |
| **Rich Text** | TipTap (frontend) — stored as HTML |

---

## Redesigned Domain Model

The new database schema is **not** a 1:1 copy of the old Drizzle schema. It uses proper DDD-inspired bounded contexts, better naming, and improved relationships.

### Domain Terminology Changes
| Old (Legacy) | New (Refactored) | Rationale |
|---|---|---|
| `user` | `AppUser` (Identity) + `UserProfile` | Separate Identity concerns from business profile |
| `customers` | `Organizations` | "Customer" is overloaded; "Organization" is the actual domain concept |
| `licenses` | `Subscriptions` | Licenses represent subscription seats, not software licenses |
| `news` | `Articles` | More generic, future-proof |
| `ibben_lena_knowledge_files` | `Documents` | Cleaner naming; part of KnowledgeBase bounded context |
| `lena_profiles` | `AiProfiles` | Decouple from "Lena" branding |
| `lena_starter_questions` | `ConversationStarters` | More descriptive |
| `knowledge_base_invocations` | `AiInvocations` | Generic AI invocation logging |
| `push_tokens` | `DeviceRegistrations` | More precise — tracks devices, not just tokens |
| `chat` / `message` | `Conversation` / `ConversationMessage` | Avoid collision with generic "chat" |
| `vote` | `MessageFeedback` | Clearer intent (thumbs up/down) |
| `token_usage` | `UsageRecord` | Tracks all usage, not just tokens |

### Bounded Contexts & Entities

#### Identity Context (ASP.NET Core Identity tables)
```
AspNetUsers (ApplicationUser)
  ├── Id (Guid — NOT the old text ID)
  ├── Email, UserName, PasswordHash, etc. (Identity defaults)
  ├── FirstName, LastName
  ├── SecurityNumber
  ├── Role (admin | user)
  ├── IsBanned, BanReason, BanExpiresAt
  ├── IsInvited, InvitationAcceptedAt
  ├── MustResetPassword (bool) — forced reset for migrated users
  ├── LegacyUserId (string, nullable) — reference to old system for data migration
  └── CreatedAt, UpdatedAt

AspNetRoles, AspNetUserRoles, AspNetUserClaims, AspNetUserTokens, etc. (standard Identity)

RefreshTokens
  ├── Id (Guid)
  ├── UserId → AspNetUsers
  ├── Token (hashed)
  ├── ExpiresAt
  ├── CreatedAt
  ├── RevokedAt (nullable)
  └── ReplacedByToken (nullable) — for rotation chain
```

#### Organization Context
```
Organizations
  ├── Id (Guid)
  ├── Name
  ├── ContactInfo (JSON or structured)
  ├── InvoiceInfo (JSON or structured)
  ├── MaxSeats (int) — replaces "licenses" count
  ├── IsActive
  └── CreatedAt, UpdatedAt

Subscriptions (replaces "licenses")
  ├── Id (Guid)
  ├── OrganizationId → Organizations
  ├── UserId → AspNetUsers (nullable — unassigned seat)
  ├── IsActive
  ├── ActivatedAt, DeactivatedAt
  └── CreatedAt, UpdatedAt

  UNIQUE(UserId, OrganizationId)
```

#### Conversation Context (AI Chat)
```
Conversations (replaces "chat")
  ├── Id (Guid)
  ├── UserId → AspNetUsers
  ├── Title
  ├── AiProfileId → AiProfiles (snapshot which profile was used)
  └── CreatedAt, UpdatedAt

ConversationMessages (replaces "message")
  ├── Id (Guid)
  ├── ConversationId → Conversations
  ├── Role (system | user | assistant | tool)
  ├── Content (text) — plain text content
  ├── Parts (JSON) — structured parts for tool calls etc.
  ├── AiProfileSnapshot (JSON, nullable) — profile at time of message
  └── CreatedAt

MessageFeedback (replaces "vote")
  ├── Id (Guid)
  ├── ConversationId → Conversations
  ├── MessageId → ConversationMessages
  ├── UserId → AspNetUsers
  ├── IsPositive (bool)
  └── CreatedAt

UsageRecords (replaces "token_usage")
  ├── Id (Guid)
  ├── UserId → AspNetUsers
  ├── ConversationId → Conversations (nullable)
  ├── MessageId → ConversationMessages (nullable)
  ├── PromptTokens, CompletionTokens, TotalTokens
  ├── Model (string)
  ├── AiProfileSnapshot (JSON, nullable)
  └── CreatedAt

ConversationStarters (replaces "lena_starter_questions")
  ├── Id (Guid)
  ├── Text
  ├── SortOrder (int)
  ├── IsActive (bool)
  └── CreatedAt
```

#### AI Context
```
AiProfiles (replaces "lena_profiles")
  ├── Id (Guid)
  ├── Name (unique)
  ├── IsActive
  ├── Model (string)
  ├── TopK (int)
  ├── MinRelevanceThreshold (decimal) — replaces "threshold" (int)
  ├── MinRelevanceChunksRequired (int)
  ├── HighConfidenceThreshold (decimal)
  ├── HighConfidenceChunksRequired (int)
  ├── CreatedByUserId → AspNetUsers
  ├── UpdatedByUserId → AspNetUsers
  └── CreatedAt, UpdatedAt

AiInvocations (replaces "knowledge_base_invocations")
  ├── Id (Guid)
  ├── ConversationId → Conversations
  ├── MessageId → ConversationMessages
  ├── UserId → AspNetUsers
  ├── SearchQuery (text)
  ├── ConversationSummary (text)
  ├── Outcome (enum: Success | InsufficientData | Error)
  ├── OutcomeReason (text)
  ├── RetrievedChunks (JSON)
  ├── QualityMetrics (JSON)
  ├── InputTokens, OutputTokens
  ├── Model (string)
  ├── AiProfileSnapshot (JSON)
  └── CreatedAt
```

#### Knowledge Base Context
```
Documents (replaces "ibben_lena_knowledge_files")
  ├── Id (Guid)
  ├── FileName, FileSize, ContentType
  ├── Category (enum: Books | Laws | LegalCases | Other)
  ├── BlobPath (string) — Azure Blob Storage path
  ├── ContentHash (string, unique) — SHA-256 for dedup
  ├── ChunkingPreset (string) — e.g., "set_a", "set_d"
  ├── ProcessingStatus (enum: Uploaded | Processing | Completed | Failed)
  ├── ProcessingProgress (JSON, nullable) — stage, %, message
  ├── ProcessingMetrics (JSON, nullable) — per-stage timing, chunk stats
  ├── ErrorMessage (text, nullable)
  ├── TotalChunks, IndexedChunks, FailedChunks
  ├── UploadedByUserId → AspNetUsers
  └── CreatedAt, UpdatedAt
```

#### Content Context (News / Articles)
```
Articles (replaces "news")
  ├── Id (Guid)
  ├── Title
  ├── Content (HTML — TipTap)
  ├── FeaturedImagePath (string, nullable) — Azure Blob
  ├── Attachments (JSON) — [{fileName, blobPath, fileSize}]
  ├── Status (enum: Draft | Published)
  ├── ExcludedOrganizationIds (JSON) — list of Guid
  ├── AuthorUserId → AspNetUsers
  └── CreatedAt, UpdatedAt, PublishedAt
```

#### Education Context
```
Courses
  ├── Id (Guid)
  ├── Title, Description
  ├── ImagePath (string, nullable) — Azure Blob
  ├── Price (decimal), Currency (string)
  ├── Status (enum: Draft | Published)
  ├── CertificateEnabled (bool)
  ├── CreatedByUserId → AspNetUsers
  └── CreatedAt, UpdatedAt

Chapters
  ├── Id (Guid)
  ├── CourseId → Courses
  ├── Title, Description
  ├── VideoUrl
  ├── SortOrder (int)
  └── CreatedAt, UpdatedAt

Questions
  ├── Id (Guid)
  ├── ChapterId → Chapters
  ├── Type (enum: MultipleChoice)
  ├── Text, Description, Feedback
  └── CreatedAt, UpdatedAt

QuestionOptions
  ├── Id (Guid)
  ├── QuestionId → Questions
  ├── Text
  ├── IsCorrect (bool)
  └── SortOrder (int)

OrganizationCourses (replaces "customer_courses")
  ├── OrganizationId → Organizations
  ├── CourseId → Courses
  ├── SharedByUserId → AspNetUsers
  └── CreatedAt
  PK(OrganizationId, CourseId)

Enrollments (replaces "user_courses" — better name)
  ├── Id (Guid)
  ├── UserId → AspNetUsers
  ├── CourseId → Courses
  ├── OrganizationId → Organizations (nullable — null = self-enrolled)
  ├── Status (enum: NotStarted | InProgress | Completed)
  ├── AccessType (enum: Free | Purchase | Organization)
  ├── LastChapterId → Chapters (nullable)
  ├── CompletedAt (nullable)
  ├── CertificateId (string, nullable, unique)
  └── CreatedAt, UpdatedAt
  UNIQUE(UserId, CourseId)

QuestionAnswers (replaces "user_question_answers")
  ├── UserId → AspNetUsers
  ├── QuestionId → Questions
  ├── SelectedOptionId → QuestionOptions
  └── CreatedAt, UpdatedAt
  PK(UserId, QuestionId)

Purchases (unified — replaces "course_purchases" + "chat_tokens_purchases")
  ├── Id (Guid)
  ├── UserId → AspNetUsers
  ├── Type (enum: Course | ChatTokens)
  ├── CourseId → Courses (nullable)
  ├── TokenAmount (int, nullable) — for ChatTokens type
  ├── Price (decimal), PriceInLocalCurrency (decimal)
  ├── Currency (string)
  ├── Source (string) — "revenuecat"
  ├── TransactionId (string)
  └── CreatedAt
```

#### Device Context
```
DeviceRegistrations (replaces "push_tokens")
  ├── Id (Guid)
  ├── UserId → AspNetUsers
  ├── PushToken (string, unique) — Expo push token
  ├── Platform (string) — ios | android
  ├── AppVersion (string, nullable)
  └── CreatedAt, UpdatedAt
```

---

## Authentication Design

### Password-Free Migration Strategy
Users will **not** have their passwords migrated from the old system. Instead:

1. **Data migration** creates user records in the new DB with `MustResetPassword = true` and `PasswordHash = null`
2. The new login flow checks `MustResetPassword`:
   - If `true` → reject login attempt with a specific error code
   - Frontend/app shows "Your account has been migrated. Please set a new password."
   - User enters email → receives password-reset link via Resend → sets new password → `MustResetPassword = false`
3. **New users** (registered after migration) go through normal registration flow
4. **Admin users** are manually provisioned with passwords before go-live

### Auth API Endpoints
```
POST /api/auth/register          — Register (email + password)
POST /api/auth/login             — Login → JWT + refresh token (rejects if MustResetPassword)
POST /api/auth/refresh           — Refresh token rotation
POST /api/auth/logout            — Revoke refresh token
POST /api/auth/forgot-password   — Send reset email via Resend
POST /api/auth/reset-password    — Reset with token (clears MustResetPassword)
DELETE /api/auth/account         — Delete account
GET  /api/auth/me                — Get current user profile + organization info
PUT  /api/auth/me                — Update profile
```

### JWT Structure
```json
{
  "sub": "<user-guid>",
  "email": "user@example.com",
  "role": "admin",           // or "user"
  "org": "<org-guid>",       // nullable — organization membership
  "sub_active": true,        // has active subscription
  "iat": 1708000000,
  "exp": 1708003600          // 1 hour
}
```

Refresh tokens: 30-day lifetime, rotation on each use, stored hashed in `RefreshTokens` table.

### Policy-Based Authorization
Instead of BetterAuth's granular access control statements, use ASP.NET Core policies:
```csharp
// Role-based (simple)
[Authorize(Roles = "admin")]

// Policy-based (for finer control)
options.AddPolicy("ManageOrganizations", p => p.RequireRole("admin"));
options.AddPolicy("ManageContent", p => p.RequireRole("admin"));
options.AddPolicy("ManageAiProfiles", p => p.RequireRole("admin"));
options.AddPolicy("RequireActiveSubscription", p => p.RequireAssertion(ctx => ...));
```

### kb-app Auth Changes
- Remove `@better-auth/expo` + `better-auth/react` entirely
- New auth module: JWT stored in `expo-secure-store`, axios interceptor for `Authorization: Bearer`
- Refresh token rotation: 401 → call `/api/auth/refresh` → retry original request
- Handle `MustResetPassword` error → redirect to password-reset flow
- No more insecure `User-ID` header pattern

---

## Implementation Plan

### Phase 1: .NET Solution & Infrastructure Foundation

**1.1 — solution-setup**: Create unified .NET solution structure
- Extend the GuardianLegalAI solution from guardian-legal-ai-plan.md
- Projects: `GuardianLegalAI.Api`, `GuardianLegalAI.Core`, `GuardianLegalAI.AI`, `GuardianLegalAI.Infrastructure`, `GuardianLegalAI.Web`
- NuGet packages: Semantic Kernel, Identity, EF Core, Resend SDK, Azure Blob, Azure AI Search, App Insights, OpenTelemetry

**1.2 — domain-model**: Design new EF Core domain model
- Implement all entities from the "Redesigned Domain Model" section above
- New PostgreSQL database — EF Core Code-First migrations
- `ApplicationUser : IdentityUser` with `FirstName`, `LastName`, `SecurityNumber`, `IsBanned`, `MustResetPassword`, `LegacyUserId`, etc.
- Proper bounded context separation in project structure
- Fluent API configuration for relationships, indexes, constraints
- Use `Guid` primary keys throughout (not text IDs from old system)

**1.3 — auth-setup**: Configure ASP.NET Core Identity + JWT
- Identity with custom `ApplicationUser`
- JWT Bearer authentication with configurable lifetimes
- Refresh token rotation with `RefreshTokens` table
- `MustResetPassword` flow for migrated users
- Role-based + policy-based authorization
- Password-reset email via Resend
- No bcrypt migration needed — passwords are NOT migrated

**1.4 — config-system**: Strongly-typed configuration
- `AISettings`, `ConfidenceThresholds` (from guardian plan)
- `StorageSettings` (Azure Blob containers, connection strings)
- `ResendSettings` (API key, sender address, templates)
- `PushNotificationSettings` (Expo)
- `AuthSettings` (JWT secret, token lifetimes, issuer/audience)
- `RevenueCatSettings` (API key, webhook secret)

**1.5 — blob-storage-service**: Azure Blob Storage abstraction
- `IBlobStorageService` interface with Upload, Download, Delete, Exists, GetUrl
- Container management: `documents`, `article-images`, `article-attachments`, `course-images`
- Content hash deduplication support
- Metadata tagging (category, uploader, hash)

### Phase 2: Core Business API

> **Note:** API design is completely refactored — not a port of old endpoints. Uses proper REST conventions, consistent response envelopes, and domain-driven naming.

**2.1 — organization-api**: Organization management
- `GET    /api/organizations` — list with pagination, search
- `POST   /api/organizations` — create
- `GET    /api/organizations/{id}` — detail with seat usage stats
- `PUT    /api/organizations/{id}` — update
- `DELETE /api/organizations/{id}` — soft-delete or hard-delete
- `GET    /api/organizations/{id}/members` — list members with subscription status
- `GET    /api/organizations/{id}/courses` — shared courses

**2.2 — subscription-api**: Subscription (seat) management
- `GET    /api/organizations/{orgId}/subscriptions` — list seats
- `POST   /api/organizations/{orgId}/subscriptions` — create seat(s)
- `PUT    /api/subscriptions/{id}` — update (activate/deactivate)
- `DELETE /api/subscriptions/{id}` — remove seat
- `POST   /api/subscriptions/{id}/assign` — assign user to seat
- `POST   /api/subscriptions/{id}/unassign` — remove user from seat

**2.3 — member-api**: User/member administration
- `GET    /api/members` — list all users (admin only), filterable by org/role/status
- `GET    /api/members/{id}` — detail with org, subscription, usage stats
- `PUT    /api/members/{id}` — update profile fields
- `DELETE /api/members/{id}` — delete user (cascading)
- `POST   /api/members/{id}/ban` — ban with reason + optional expiry
- `POST   /api/members/{id}/unban`
- `POST   /api/members/invite` — send invitation email via Resend
- `GET    /api/members/{id}/usage` — token usage summary

**2.4 — article-api**: Article (news) management
- `GET    /api/articles` — list with pagination, status filter, org targeting
- `POST   /api/articles` — create (draft)
- `GET    /api/articles/{id}` — detail
- `PUT    /api/articles/{id}` — update
- `DELETE /api/articles/{id}` — delete
- `POST   /api/articles/{id}/publish` — transition draft → published
- `POST   /api/articles/{id}/unpublish` — revert to draft
- `POST   /api/articles/upload-image` — upload featured image to Blob
- `POST   /api/articles/upload-attachment` — upload PDF attachment to Blob
- Content stored as HTML (TipTap output)
- Organization exclusion targeting via `ExcludedOrganizationIds`

**2.5 — course-api**: Education / course management
- `GET    /api/courses` — list (admin: all; user: accessible catalog)
- `POST   /api/courses` — create
- `GET    /api/courses/{id}` — detail with chapters, questions
- `PUT    /api/courses/{id}` — update
- `DELETE /api/courses/{id}` — delete
- `POST   /api/courses/{id}/publish` / `unpublish`
- `POST   /api/courses/{id}/chapters` — add chapter
- `PUT    /api/chapters/{id}` — update chapter
- `DELETE /api/chapters/{id}` — delete chapter
- `POST   /api/chapters/{id}/questions` — add question with options
- `PUT    /api/questions/{id}` — update question
- `DELETE /api/questions/{id}` — delete question
- `POST   /api/courses/{id}/share` — share with organization
- `POST   /api/courses/upload-image` — upload course image

**2.6 — ai-profile-api**: AI profile configuration
- `GET    /api/ai-profiles` — list all
- `POST   /api/ai-profiles` — create
- `GET    /api/ai-profiles/{id}` — detail
- `PUT    /api/ai-profiles/{id}` — update
- `DELETE /api/ai-profiles/{id}` — delete
- `POST   /api/ai-profiles/{id}/activate` — set as active (deactivates others)
- `GET    /api/conversation-starters` — list
- `POST   /api/conversation-starters` — create/update (bulk replace)

**2.7 — analytics-api**: AI analytics & observability
- `GET /api/analytics/invocations` — paginated AI invocation log with filters
- `GET /api/analytics/usage` — token usage aggregated by user/period/model
- `GET /api/analytics/quality` — confidence score distributions, success/failure rates
- `GET /api/analytics/dashboard` — summary stats for admin dashboard

### Phase 3: AI / Semantic Kernel (from guardian-legal-ai-plan.md)

**3.1 — sk-kernel-setup**: Configure Semantic Kernel
- Dual provider: Azure OpenAI + OpenAI (configurable per AI profile)
- Register plugins, configure DI
- Kernel builder with configurable services

**3.2 — rag-plugin**: Knowledge Base search plugin
- Azure AI Search with multi-index (books, laws, legalcases, other)
- Hybrid search (vector + keyword + semantic ranking)
- Configurable topK, relevance thresholds from AI profile

**3.3 — document-ingestion**: Kernel Memory pipeline
- Upload → Chunk → Embed → Index pipeline (replacing SQS + Python)
- Custom chunking strategies for Swedish legal docs
- Background processing with status tracking on `Documents` entity
- Re-chunking / re-indexing support

**3.4 — chat-service**: Conversation orchestration
- Semantic Kernel `ChatCompletionService` with tool calling
- **SSE streaming** via ASP.NET Core `IResult` streaming response
- Knowledge base tool (equivalent to `fa_noggrann_information`)
- Swedish Lena system prompt
- Token usage tracking → `UsageRecords`
- AI invocation logging → `AiInvocations`
- Configurable max steps for agentic loop

**3.5 — confidence-scoring**: 4-layer confidence pipeline
- Layer 1: Chunk-level relevance scoring
- Layer 2: LLM-based chunk evaluation
- Layer 3: LLM-as-Judge response verification
- Layer 4: Citation verification
- (Detailed in guardian-legal-ai-plan.md)

**3.6 — document-management-api**: Knowledge base CRUD
- `GET    /api/knowledge-bases` — list knowledge bases
- `POST   /api/knowledge-bases` — create knowledge base (provisions isolated storage)
- `GET    /api/knowledge-bases/{knowledgeBaseId}/documents` — list docs with status/category filters
- `POST   /api/knowledge-bases/{knowledgeBaseId}/documents/upload` — upload + trigger ingestion pipeline
- `GET    /api/knowledge-bases/{knowledgeBaseId}/documents/{id}` — detail with processing status & metrics
- `DELETE /api/knowledge-bases/{knowledgeBaseId}/documents/{id}` — delete file + vectors + blob
- `POST   /api/knowledge-bases/{knowledgeBaseId}/documents/{id}/reprocess` — re-trigger ingestion

### Phase 4: Consumer API (for kb-app + web users)

> These endpoints serve both the mobile app and non-admin web users. Unified API — no separate "mobile" or "expo" prefix.

**4.1 — conversation-api**: Chat for end-users
- `POST   /api/conversations` — create new conversation
- `GET    /api/conversations` — list user's conversations (paginated)
- `GET    /api/conversations/{id}` — get conversation with messages
- `DELETE /api/conversations/{id}` — delete conversation
- `POST   /api/conversations/{id}/messages` — send message → SSE stream response
- `POST   /api/conversations/{id}/messages/{msgId}/feedback` — thumbs up/down
- `GET    /api/conversations/quota` — remaining token quota for user

**4.2 — content-api**: Articles & courses for end-users
- `GET /api/feed/articles` — published articles (filtered by user's org)
- `GET /api/feed/articles/{id}` — single article
- `GET /api/catalog/courses` — available courses for user (org-shared + purchasable)
- `GET /api/catalog/courses/{id}` — course detail with chapters/questions
- `POST /api/enrollments` — enroll in course
- `PUT  /api/enrollments/{id}/progress` — update chapter progress
- `POST /api/enrollments/{id}/complete` — mark complete + generate certificate
- `GET  /api/enrollments/{id}/certificate` — download certificate PDF
- `GET  /api/enrollments` — user's enrolled courses

**4.3 — device-api**: Push notification management
- `POST   /api/devices` — register device (push token, platform, app version)
- `DELETE /api/devices/{token}` — unregister on logout

**4.4 — purchase-api**: In-app purchase verification
- `POST /api/purchases/verify` — RevenueCat webhook receiver
- `POST /api/purchases` — record purchase (course or chat tokens)
- `GET  /api/purchases` — user's purchase history

**4.5 — profile-api**: User self-service
- `GET  /api/profile` — current user profile + org info + subscription status
- `PUT  /api/profile` — update own profile
- `GET  /api/profile/invitations` — pending invitations
- `POST /api/profile/invitations/{id}/accept` — accept invitation

### Phase 5: React Frontend (Admin Dashboard)

**5.1 — react-project-setup**: Vite + React + TypeScript
- TailwindCSS v4 + shadcn/ui
- React Router v7 for navigation
- API client with JWT auth interceptor (axios)
- SSE client utility for chat streaming
- Form handling with React Hook Form + Zod (matching current patterns)

**5.2 — admin-auth-ui**: Authentication pages
- Login page (handles `MustResetPassword` redirect)
- Forgot password / reset password flow
- Logout

**5.3 — admin-layout-ui**: Dashboard shell
- Sidebar navigation organized by bounded context:
  - **AI**: Chat, AI Profiles, Conversation Starters, Analytics
  - **Content**: Articles, Courses, Knowledge Base
  - **Management**: Organizations, Members, Subscriptions
  - **Account**: Profile, Settings

**5.4 — admin-chat-ui**: Lena chat interface
- SSE streaming with word-by-word rendering
- AI profile selector
- Conversation history sidebar
- Conversation starters
- Confidence indicators on responses

**5.5 — admin-content-ui**: Content management pages
- Article editor (TipTap rich text, image upload, PDF attachment, org targeting)
- Course editor (chapters with video URLs, question editor with options, org sharing)
- Knowledge base: file upload with category + chunk preset selection, processing status tracker

**5.6 — admin-management-ui**: Entity management pages
- Organizations: CRUD, seat allocation, member list, shared courses
- Members: list, detail, ban/unban, invite
- Subscriptions: assign/unassign users to seats

**5.7 — admin-analytics-ui**: Analytics dashboard
- AI invocation log with filters (date, user, outcome)
- Token usage charts (by user, by model, by period)
- Confidence score histograms
- Summary cards (total conversations, success rate, avg confidence)

### Phase 6: kb-app Update (Auth + New API)

**6.1 — app-auth-rewrite**: New authentication module
- Remove `@better-auth/expo` and `better-auth/react` dependencies
- New `AuthService` class:
  - `login(email, password)` → stores JWT + refresh token in SecureStore
  - `register(email, password, name, lastName)` → auto-login
  - `logout()` → revoke refresh token, clear SecureStore, unregister device
  - `deleteAccount()` → call DELETE `/api/auth/account`
  - `forgotPassword(email)` → trigger Resend email
  - `resetPassword(token, password)` → set new password (handles `MustResetPassword`)
- Axios interceptor: attach `Authorization: Bearer <accessToken>` to all requests
- Refresh interceptor: on 401 → call `/api/auth/refresh` → retry → on failure → logout
- Handle `MUST_RESET_PASSWORD` error code → show password reset screen
- Update `AuthProvider` context to use new service

**6.2 — app-api-rewrite**: Point to new API
- New base URL for new backend (separate domain/port during coexistence)
- Remove all `User-ID` header usage
- Update all feature hooks to new endpoint paths:
  - Chats → `/api/conversations/*`
  - News → `/api/feed/articles/*`
  - Courses → `/api/catalog/courses/*` + `/api/enrollments/*`
  - Push tokens → `/api/devices`
  - Purchases → `/api/purchases`
  - Profile → `/api/profile`
- Update TanStack React Query keys to match new structure

**6.3 — app-chat-sse**: SSE streaming for chat
- Implement SSE client for React Native (using `fetch` with `ReadableStream` or `EventSource` polyfill)
- Replace Vercel AI SDK streaming patterns
- Display streaming responses word-by-word
- Token quota check via `/api/conversations/quota`

### Phase 7: Data Migration & Production

**7.1 — data-migration-scripts**: One-time migration from old DB to new DB
- **Users**: Migrate user records → new `ApplicationUser` with `MustResetPassword = true`, `PasswordHash = null`, `LegacyUserId = old.id`
- **Organizations**: Migrate `customers` → `Organizations` with field mapping
- **Subscriptions**: Migrate `licenses` → `Subscriptions`
- **Conversations**: Migrate `chat` + `message` → `Conversations` + `ConversationMessages` (preserve chat history)
- **Articles**: Migrate `news` → `Articles`
- **Courses**: Migrate `courses`, `chapters`, `questions`, `question_options` → new entities
- **Enrollments**: Migrate `user_courses` → `Enrollments`
- **Purchases**: Merge `course_purchases` + `chat_tokens_purchases` → unified `Purchases`
- **AI Profiles**: Migrate `lena_profiles` → `AiProfiles`
- **Documents**: Migrate `ibben_lena_knowledge_files` → `Documents` (file references only — actual files migrate via blob migration)
- **Blob migration**: Copy files from AWS S3 → Azure Blob Storage (batch script with progress tracking)
- **Vector re-indexing**: Re-embed and re-index all documents into Azure AI Search (full pipeline run)
- **Validation**: Row count checks, FK integrity, spot-check data quality

**7.2 — telemetry-setup**: Observability
- Application Insights + OpenTelemetry (from guardian plan)
- Serilog structured logging
- Health check endpoints (`/health`, `/health/ready`)
- Custom metrics: conversation count, AI invocation success rate, SSE connection count

**7.3 — rate-limiting**: Usage controls
- Per-user daily token limits (configurable)
- Purchased token tracking (from `Purchases` table)
- ASP.NET `System.Threading.RateLimiting` middleware
- Sliding window per-user, fixed window global

**7.4 — testing**: Test suite
- Unit tests: domain services, confidence scoring, auth flows
- Integration tests: API endpoints with test database
- Architecture tests: ensure bounded context boundaries
- SSE streaming tests

**7.5 — deployment**: CI/CD & infrastructure
- Azure App Service or Container Apps (separate from old system)
- GitHub Actions CI/CD pipeline
- Environment-specific configuration (dev/staging/prod)
- New domain or subdomain during coexistence (e.g., `api-v2.intressebevakaren.se`)
- Eventually migrate DNS when old system is decommissioned

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **User friction from forced password reset** | Clear in-app messaging + email campaign before go-live explaining the transition. Admin users provisioned manually beforehand. |
| **Data migration integrity** | Migration scripts with validation checks, row counts, FK integrity. Run in staging first. Keep old DB read-only as backup. |
| **SSE in React Native** | Use `fetch` with `ReadableStream` (supported in modern RN); fallback to `EventSource` polyfill if needed. Test thoroughly on iOS + Android. |
| **Old app versions lingering** | Force-update mechanism via Expo Updates or app store minimum version. Old backend stays live with minimal maintenance until sunset. |
| **Swedish BERT → text-embedding-3-large** | Benchmark quality on Swedish legal text before full re-indexing. Old system keeps working independently during evaluation. |
| **Two systems running simultaneously** | Clear operational runbooks. Independent monitoring for each. No shared state = no coordination issues. |

## Phase Dependencies

```
Phase 1 (Foundation) ─┬─► Phase 2 (Business API) ─────────► Phase 5 (React Frontend)
                      ├─► Phase 3 (AI / SK) ──────────────► Phase 5.4 (Chat UI)
                      └─► Phase 4 (Consumer API) ─────────► Phase 6 (kb-app Update)
                           ▲                                     │
                           └─── Phase 3.4 (Chat Service) ───────┘

Phase 7 (Migration & Production) depends on Phases 1-6 being complete
  - 7.1 (Data Migration) can begin in parallel with Phase 5-6 once schema is stable
  - 7.2 (Telemetry) can begin alongside Phase 1
  - 7.5 (Deployment) is the final gate
```
