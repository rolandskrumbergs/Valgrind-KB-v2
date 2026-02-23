# KB Platform — System Overview

## What Is This Project?

A full-stack platform for **Intressebevakaren** (Swedish guardianship organization) that provides:

- **AI-Powered Legal Assistant ("Lena")** — RAG-based chat with Swedish legal knowledge, confidence scoring, and citation verification
- **Knowledge Base Management** — Document ingestion, chunking, embedding, and vector indexing pipeline
- **Content Management** — Articles (news) with rich text editing, organization-targeted publishing
- **Education Platform** — Courses with chapters, video content, quizzes, certificates, and in-app purchases
- **Organization & Subscription Management** — B2B customer management with seat-based licensing
- **Mobile App Backend** — API serving a React Native / Expo mobile app (kb-app)

## Migration Context

This is a **ground-up rewrite** of an existing Next.js + Python system (found in `old_system/`). It is **not** a 1:1 port — the domain model, naming, patterns, and architecture are completely redesigned.

| Aspect | Old System | New System |
|--------|-----------|------------|
| Backend | Next.js (kb-admin) + FastAPI microservices | ASP.NET Core 10 (.NET) |
| Frontend | Next.js SSR/App Router | React SPA (Vite) |
| Mobile | Expo + BetterAuth | Expo + JWT (same app, updated auth + API) |
| Database | PostgreSQL (Drizzle ORM, Neon) | PostgreSQL (EF Core, redesigned schema) |
| Auth | BetterAuth | ASP.NET Core Identity + JWT |
| AI/LLM | Vercel AI SDK + OpenRouter | Semantic Kernel + Azure OpenAI / OpenAI |
| Vector Store | Upstash Vector (4 indexes) | Azure AI Search (hybrid search) |
| Embeddings | KBLab/sentence-bert-swedish-cased (768d) | text-embedding-3-large (configurable) |
| Doc Processing | FastAPI + unstructured (Python) | Microsoft Kernel Memory (.NET) |
| File Storage | AWS S3 | Azure Blob Storage |
| Email | SendGrid | Resend |
| Streaming | Vercel AI SDK streaming | Server-Sent Events (SSE) |

**Coexistence**: Old and new systems run independently side-by-side. Old app versions hit the old backend; new app versions hit the new backend. Data is migrated once via scripts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                kb-app (React Native / Expo)                      │
│  Lena Chat · News · Education · Profile · Push Notifications     │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST API + Bearer Token (JWT)
                        │ Chat streaming via SSE
┌───────────────────────▼─────────────────────────────────────────┐
│              KB.Server (ASP.NET Core 10)                          │
│                                                                   │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────────┐  │
│  │ Identity &  │ │  Chat API    │ │  Content API              │  │
│  │ Auth (JWT)  │ │  (SSE)       │ │  Articles, Courses, etc.  │  │
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
│             kb.client (React SPA — Vite)                         │
│  Admin Dashboard · Chat UI · Document Upload · Article Editor ·  │
│  Course Editor · Org Mgmt · Member Mgmt · Analytics              │
└──────────────────────────────────────────────────────────────────┘
```

## Solution Structure

```
KB.slnx
├── KB.Domain          — Entities, enums, interfaces, value objects (zero dependencies)
├── KB.Core            — Use cases, CQRS handlers, Result pattern (depends on Domain)
├── KB.Infrastructure  — EF Core, Dapper, interceptors, events (depends on Domain + Core)
├── KB.Operations      — Data seeding, migration tasks (depends on Domain + Core + Infra)
├── KB.Server          — ASP.NET Core API host, DI wiring (depends on all)
└── kb.client          — React + Vite SPA frontend
```

Dependencies flow inward only: Server → Infrastructure → Core → Domain.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | Expo 53 + React Native 0.79 (existing kb-app, updated auth + API) |
| **Admin Frontend** | React 19 + Vite 7 + TypeScript + TailwindCSS v4 + shadcn/ui |
| **Backend API** | ASP.NET Core 10 Minimal APIs |
| **Chat Streaming** | Server-Sent Events (SSE) |
| **Auth** | ASP.NET Core Identity + JWT Bearer tokens |
| **AI Orchestration** | Microsoft Semantic Kernel |
| **Document Ingestion** | Microsoft Kernel Memory |
| **Vector Store** | Azure AI Search (hybrid: vector + keyword + semantic ranking) |
| **LLM Providers** | Azure OpenAI + OpenAI (configurable per AI profile) |
| **Database** | PostgreSQL (EF Core) — new database, redesigned schema |
| **File Storage** | Azure Blob Storage |
| **Email** | Resend |
| **Push Notifications** | Expo Server SDK (.NET) |
| **Payments** | RevenueCat (webhook + API validation) |
| **Telemetry** | Application Insights + OpenTelemetry |
| **Rich Text** | TipTap (frontend) — stored as HTML |
| **Testing** | xUnit + NSubstitute |

---

## Key Features

### 1. AI Chat ("Lena")
- Streaming chat via SSE with RAG (Retrieval-Augmented Generation)
- Tool-calling agentic loop (knowledge base search tool)
- 4-layer confidence scoring pipeline (chunk relevance → LLM eval → LLM-as-judge → citation verification)
- Configurable AI profiles (model, topK, thresholds)
- Swedish-language system prompts
- Token usage tracking and per-user quotas

### 2. Knowledge Bases
- Multiple knowledge bases (per app/product) managed by admins
- Each KnowledgeBase has isolated storage: dedicated Azure Blob container + dedicated set of Azure AI Search indexes
- Document upload → Azure Blob → Kernel Memory pipeline (routed by KnowledgeBase)
- Chunking (configurable presets) → Embedding → Azure AI Search indexing
- 4 category-specific indexes per KnowledgeBase: books, laws, legalcases, other
- Processing status tracking with per-stage metrics
- Content hash deduplication (within a KnowledgeBase)

### 3. Articles (News)
- Rich text editor (TipTap) with HTML storage
- Featured images and PDF attachments (Azure Blob)
- Draft/Published workflow
- Organization exclusion targeting (hide articles from specific orgs)

### 4. Education Platform
- Courses with chapters (video URLs) and multiple-choice quizzes
- Organization sharing (grant course access to org members)
- Enrollment tracking with progress
- Certificate generation (PDF)
- In-app purchases via RevenueCat

### 5. Organization Management
- B2B customer organizations with seat-based subscriptions
- License/seat allocation and user assignment
- Member management with ban/unban capability

### 6. Authentication
- ASP.NET Core Identity with JWT + refresh token rotation
- Password-free migration (migrated users must set new password)
- Role-based (admin/user) + policy-based authorization
- Invitation flow for new users

---

## Domain Terminology (Old → New)

| Old (Legacy) | New (Refactored) | Rationale |
|---|---|---|
| `user` | `ApplicationUser` + `UserProfile` | Separate Identity from business profile |
| `customers` | `Organizations` | "Customer" is overloaded |
| `licenses` | `Subscriptions` | Subscription seats, not software licenses |
| `news` | `Articles` | More generic, future-proof |
| `ibben_lena_knowledge_files` | `Documents` | Clean naming in KnowledgeBase context |
| `lena_profiles` | `AiProfiles` | Decouple from branding |
| `lena_starter_questions` | `ConversationStarters` | More descriptive |
| `knowledge_base_invocations` | `AiInvocations` | Generic AI invocation logging |
| `push_tokens` | `DeviceRegistrations` | More precise |
| `chat` / `message` | `Conversation` / `ConversationMessage` | Avoid collision with generic "chat" |
| `vote` | `MessageFeedback` | Clearer intent |
| `token_usage` | `UsageRecord` | Tracks all usage |

---

## Current Implementation State

The solution scaffolding is complete with DDD infrastructure patterns in place:

| Component | Status |
|-----------|--------|
| Solution structure | ✅ Complete |
| DDD base classes (DomainEntity, ValueObject, DomainEvent) | ✅ Complete |
| Repository interfaces (IRepository, IReadRepository) | ✅ Complete |
| EF Core infrastructure (DbContext, interceptors, events) | ✅ Complete |
| Auditing + Soft Delete interceptors | ✅ Complete |
| Domain event channel + dispatcher | ✅ Complete |
| Result pattern (Result\<T\>) | ✅ Complete |
| Handler auto-registration | ✅ Complete |
| HTTP result extensions | ✅ Complete |
| HttpUserContext | ✅ Complete |
| Dapper integration | ✅ Complete |
| Domain entities | ❌ Only sample WeatherForecast |
| Enums, value objects | ❌ Not started |
| EF Core configurations | ❌ Not started |
| CQRS handlers | ❌ Not started |
| API endpoints | ❌ Only sample WeatherForecast |
| Authentication (Identity + JWT) | ❌ Not started |
| Frontend (React) | ❌ Only default Vite template |

The foundation is solid — the work ahead is implementing the actual domain model and features.
