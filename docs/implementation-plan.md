# KB Platform — Implementation Plan

## Problem Statement

Migrate the existing Next.js + Python system (in `old_system/`) to a .NET 10 + React platform. The new system uses Clean Architecture, DDD, CQRS, and integrates Microsoft Semantic Kernel for AI features. The current codebase has scaffolding in place (DDD base classes, Result pattern, interceptors, repository pattern) but no actual domain entities or features.

## Approach

Implement in 7 phases, building from the domain model outward. Each phase produces a working increment. Phases 1-4 focus on the backend, Phase 5 on the admin frontend, Phase 6 on mobile app updates, and Phase 7 on migration and production readiness.

## Related Documentation

- `docs/system-overview.md` — Architecture, tech stack, current state
- `docs/domain-model.md` — Complete entity definitions and relationships
- `docs/api-reference.md` — All API endpoints
- `docs/technical-decisions.md` — Key design decisions and rationale
- `docs/kb-admin-dotnet-migration-plan.md` — Original migration plan (source of truth for requirements)
- `docs/guardian-legal-ai-plan.md` — AI/Semantic Kernel implementation details
- `docs/project-agnostic-architecture-overview.md` — Architecture patterns and conventions

---

## Phase 1: Foundation & Infrastructure

### 1.1 — Switch to PostgreSQL
- Replace `UseSqlServer()` with `UseNpgsql()` in `KB.Infrastructure/Setup.cs`
- Add `Npgsql.EntityFrameworkCore.PostgreSQL` to `Directory.Packages.props`
- Remove `Microsoft.EntityFrameworkCore.SqlServer` dependency
- Update connection string in `appsettings.json`
- Verify `AppDbContext` works with PostgreSQL

### 1.2 — Domain Enums
Create all enums in `KB.Domain/Enums/`:
- `UserRole` (Admin, User)
- `MessageRole` (System, User, Assistant, Tool)
- `InvocationOutcome` (Success, InsufficientData, Error)
- `KnowledgeCategory` (Books, Laws, LegalCases, Other)
- `ProcessingStatus` (Uploaded, Processing, Completed, Failed)
- `PublishStatus` (Draft, Published)
- `QuestionType` (MultipleChoice)
- `EnrollmentStatus` (NotStarted, InProgress, Completed)
- `AccessType` (Free, Purchase, Organization)
- `PurchaseType` (Course, ChatTokens)

### 1.3 — Domain Entities
Create all entities in `KB.Domain/Entities/` following property patterns from `.github/copilot-instructions.md`. Remove the sample `WeatherForecast` entity. Reference `docs/domain-model.md` for complete field definitions.

**Identity context**: ApplicationUser (extends IdentityUser\<Guid\>), RefreshToken
**Organization context**: Organization (aggregate root + Subscription children)
**Conversation context**: Conversation (aggregate root + Message/Feedback children), UsageRecord, ConversationStarter
**AI context**: AiProfile, AiInvocation
**KnowledgeBase context**: KnowledgeBase, Document
**Content context**: Article
**Education context**: Course (aggregate root + Chapter → Question → QuestionOption children), OrganizationCourse, Enrollment, QuestionAnswer
**Purchase context**: Purchase
**Device context**: DeviceRegistration

### 1.4 — Repository Interfaces
Create domain-specific repository interfaces in `KB.Domain/Interfaces/Repositories/` extending `IRepository<T>` or `IReadRepository<T>` for each aggregate root that needs custom queries.

### 1.5 — EF Core Configurations
Create one `IEntityTypeConfiguration<T>` per entity in `KB.Infrastructure/Data/Configurations/`. Configure:
- String max lengths
- Enum → string conversions
- Soft-delete query filters
- Unique indexes and composite keys
- Foreign key relationships
- JSON column types (for ProcessingProgress, QualityMetrics, etc.)

### 1.6 — ASP.NET Core Identity Setup
- Add `Microsoft.AspNetCore.Identity.EntityFrameworkCore` package
- Configure `ApplicationUser : IdentityUser<Guid>` in `AppDbContext`
- Register Identity services in DI
- Run initial migration with Identity tables + all domain entities

### 1.7 — JWT Authentication
- Add JWT Bearer authentication to `KB.Server/Program.cs`
- Create `AuthSettings` strongly-typed config (secret, issuer, audience, token lifetimes)
- Implement JWT token generation service
- Implement refresh token rotation service
- Configure authorization policies (admin, active subscription, etc.)
- Update `HttpUserContext` to read claims from JWT instead of Azure AD

### 1.8 — Auth API Endpoints
Implement auth endpoints in `KB.Server/Endpoints/Auth/`:
- POST `/api/auth/register` — create user + issue tokens
- POST `/api/auth/login` — validate credentials, check `MustResetPassword`, issue tokens
- POST `/api/auth/refresh` — rotate refresh token
- POST `/api/auth/logout` — revoke refresh token
- POST `/api/auth/forgot-password` — send reset email
- POST `/api/auth/reset-password` — reset password with token
- DELETE `/api/auth/account` — delete user
- GET/PUT `/api/auth/me` — get/update profile

### 1.9 — Configuration System
Create strongly-typed settings classes in `KB.Core` or `KB.Infrastructure`:
- `AuthSettings` — JWT config
- `AiSettings` — Semantic Kernel, LLM providers
- `StorageSettings` — Azure Blob containers, connection strings
- `ResendSettings` — email API key, sender, templates
- `PushNotificationSettings` — Expo server config
- `RevenueCatSettings` — API key, webhook secret
- `ConfidenceThresholds` — default confidence scoring params

### 1.10 — Azure Blob Storage Service
- Create `IBlobStorageService` interface in `KB.Domain/Interfaces/`
- Implement in `KB.Infrastructure` with `Azure.Storage.Blobs`
- Methods: Upload, Download, Delete, Exists, GetUrl
- Container management: documents, article-images, article-attachments, course-images
- Content hash deduplication support

### 1.11 — Email Service
- Create `IEmailService` interface
- Implement with Resend SDK
- Templates: password reset, invitation, welcome

### 1.12 — Remove Sample Code
- Delete `WeatherForecast.cs` from `KB.Domain/Entities/`
- Delete `WeatherForecasts/` endpoint from `KB.Server/Endpoints/`
- Update `Program.cs` to remove weather forecast mapping
- Clean up default `App.tsx` in `kb.client`

---

## Phase 2: Core Business API

Each endpoint group follows: create Command/Query in `KB.Core/Features/{Feature}/`, create Handler, create Endpoint in `KB.Server/Endpoints/`, add ViewModel in `KB.Core/Features/{Feature}/`.

### 2.1 — Organization Management
**Feature folder**: `KB.Core/Features/Organizations/`
- `CreateOrganizationCommand` + Handler
- `UpdateOrganizationCommand` + Handler
- `DeleteOrganizationCommand` + Handler
- `GetOrganizationByIdQuery` + Handler → `OrganizationViewModel`
- `GetOrganizationsQuery` + Handler (paginated) → `OrganizationListViewModel`
- `GetOrganizationMembersQuery` + Handler
- `GetOrganizationCoursesQuery` + Handler

**Endpoints**: `KB.Server/Endpoints/Organizations/OrganizationEndpoints.cs`

### 2.2 — Subscription Management
**Feature folder**: `KB.Core/Features/Subscriptions/`
- `CreateSubscriptionsCommand` + Handler (create N seats)
- `UpdateSubscriptionCommand` + Handler (activate/deactivate)
- `DeleteSubscriptionCommand` + Handler
- `AssignSubscriptionCommand` + Handler (assign user to seat)
- `UnassignSubscriptionCommand` + Handler
- `GetSubscriptionsQuery` + Handler (by org)

**Endpoints**: `KB.Server/Endpoints/Subscriptions/SubscriptionEndpoints.cs`

### 2.3 — Member Management
**Feature folder**: `KB.Core/Features/Members/`
- `UpdateMemberCommand` + Handler
- `DeleteMemberCommand` + Handler
- `BanMemberCommand` + Handler
- `UnbanMemberCommand` + Handler
- `InviteMemberCommand` + Handler (send email)
- `GetMemberByIdQuery` + Handler → `MemberViewModel`
- `GetMembersQuery` + Handler (paginated, filterable)
- `GetMemberUsageQuery` + Handler

**Endpoints**: `KB.Server/Endpoints/Members/MemberEndpoints.cs`

### 2.4 — Article Management
**Feature folder**: `KB.Core/Features/Articles/`
- `CreateArticleCommand` + Handler
- `UpdateArticleCommand` + Handler
- `DeleteArticleCommand` + Handler
- `PublishArticleCommand` + Handler
- `UnpublishArticleCommand` + Handler
- `UploadArticleImageCommand` + Handler (blob upload)
- `UploadArticleAttachmentCommand` + Handler
- `GetArticleByIdQuery` + Handler → `ArticleViewModel`
- `GetArticlesQuery` + Handler (paginated)

**Endpoints**: `KB.Server/Endpoints/Articles/ArticleEndpoints.cs`

### 2.5 — Course Management
**Feature folder**: `KB.Core/Features/Courses/`
- `CreateCourseCommand` + Handler
- `UpdateCourseCommand` + Handler
- `DeleteCourseCommand` + Handler
- `PublishCourseCommand` / `UnpublishCourseCommand` + Handlers
- `AddChapterCommand` + Handler (via Course aggregate root)
- `UpdateChapterCommand` + Handler
- `DeleteChapterCommand` + Handler
- `AddQuestionCommand` + Handler (via Course aggregate root)
- `UpdateQuestionCommand` + Handler
- `DeleteQuestionCommand` + Handler
- `ShareCourseWithOrganizationCommand` + Handler
- `UploadCourseImageCommand` + Handler
- `GetCourseByIdQuery` + Handler → `CourseDetailViewModel`
- `GetCoursesQuery` + Handler

**Endpoints**: `KB.Server/Endpoints/Courses/CourseEndpoints.cs`

### 2.6 — AI Profile Management
**Feature folder**: `KB.Core/Features/AiProfiles/`
- `CreateAiProfileCommand` + Handler
- `UpdateAiProfileCommand` + Handler
- `DeleteAiProfileCommand` + Handler
- `ActivateAiProfileCommand` + Handler (deactivates others)
- `GetAiProfileByIdQuery` + Handler → `AiProfileViewModel`
- `GetAiProfilesQuery` + Handler
- `UpdateConversationStartersCommand` + Handler (bulk replace)
- `GetConversationStartersQuery` + Handler

**Endpoints**: `KB.Server/Endpoints/AiProfiles/AiProfileEndpoints.cs`

### 2.7 — Analytics API
**Feature folder**: `KB.Core/Features/Analytics/`
- `GetInvocationsQuery` + Handler (paginated with filters)
- `GetUsageSummaryQuery` + Handler (aggregated by user/period/model)
- `GetQualityMetricsQuery` + Handler (confidence distributions)
- `GetDashboardSummaryQuery` + Handler

**Note**: Analytics queries will likely use Dapper for complex aggregations instead of EF Core.

**Endpoints**: `KB.Server/Endpoints/Analytics/AnalyticsEndpoints.cs`

---

## Phase 3: AI / Semantic Kernel

### 3.1 — Semantic Kernel Setup
- Add Semantic Kernel NuGet packages to `Directory.Packages.props`
- Configure `IKernel` in DI with dual provider support (Azure OpenAI + OpenAI)
- Create `AiSettings` configuration class
- Register plugins and services
- Configurable model selection per AI profile

### 3.2 — RAG Plugin (Knowledge Base Search)
- Implement `KnowledgeBasePlugin` for Semantic Kernel
- Azure AI Search integration with multi-index queries (books, laws, legalcases, other)
- Index set selected by `AiProfile.KnowledgeBaseId` (each KnowledgeBase has isolated indexes)
- Index naming: `{KnowledgeBase.SearchIndexPrefix}-{category}`
- Hybrid search: vector + keyword + semantic ranking
- Configurable topK and relevance thresholds from active AI profile
- Format retrieved chunks with category tags and metadata
- Equivalent to old system's `fa_noggrann_information` tool

### 3.3 — Document Ingestion Pipeline
- Configure Microsoft Kernel Memory
- Pipeline: Upload → Azure Blob → Chunk → Embed → Azure AI Search indexing
- Route ingestion to the selected KnowledgeBase's blob container + search indexes
- Kernel Memory index/collection name per KnowledgeBase (isolation)
- Custom chunking strategies for Swedish legal documents (reference old system's 6 presets)
- Background processing with status tracking on Document entity
- Update ProcessingStatus, ProcessingProgress, ProcessingMetrics during pipeline
- Re-chunking / re-indexing support
- Content hash deduplication (within a KnowledgeBase)

### 3.4 — Chat Orchestration Service
- Build `ChatOrchestrationService` using Semantic Kernel `IChatCompletionService`
- Tool-calling agentic loop with knowledge base search tool
- Knowledge base routing via `AiProfile.KnowledgeBaseId`
- SSE streaming via ASP.NET Core streaming response
- Swedish "Lena" system prompt (migrate from old system)
- Conversation context management (load history, manage token window)
- Token usage tracking → create `UsageRecord` per message
- AI invocation logging → create `AiInvocation` per tool call
- Configurable max agentic loop steps (prevent infinite tool calling)

### 3.5 — Confidence Scoring Pipeline
Reference `docs/guardian-legal-ai-plan.md` for detailed specifications.
- **Layer 1**: Chunk-level relevance scoring with configurable thresholds
- **Layer 2**: LLM-based chunk evaluation (separate LLM call per chunk, rate relevance 0-10)
- **Layer 3**: LLM-as-Judge response verification (groundedness, relevance, coherence, accuracy)
- **Layer 4**: Citation extraction, validation against source chunks, unverifiable citation handling
- Composite scoring → decision matrix (deliver / withhold / disclaimer)
- Use separate (cheaper) LLM for evaluation tasks
- `ConfidenceThresholds` configuration from active AI profile

### 3.6 — Knowledge Base & Document Management API
**Feature folders**:
- `KB.Core/Features/KnowledgeBases/`
- `KB.Core/Features/Documents/`

Knowledge bases:
- `CreateKnowledgeBaseCommand` + Handler (provision blob container + search indexes)
- `UpdateKnowledgeBaseCommand` + Handler
- `DeleteKnowledgeBaseCommand` + Handler (soft-delete)
- `GetKnowledgeBaseByIdQuery` + Handler → `KnowledgeBaseViewModel`
- `GetKnowledgeBasesQuery` + Handler

Documents (scoped to knowledge base):
- `UploadDocumentCommand` + Handler (upload to KB container + trigger pipeline)
- `DeleteDocumentCommand` + Handler (delete blob + vectors + record)
- `ReprocessDocumentCommand` + Handler
- `GetDocumentByIdQuery` + Handler → `DocumentViewModel`
- `GetDocumentsQuery` + Handler (paginated with status/category filters)

**Endpoints**:
- `KB.Server/Endpoints/KnowledgeBases/KnowledgeBaseEndpoints.cs`
- `KB.Server/Endpoints/KnowledgeBases/Documents/DocumentEndpoints.cs`

---

## Phase 4: Consumer API

### 4.1 — Conversation API
**Feature folder**: `KB.Core/Features/Conversations/`
- `CreateConversationCommand` + Handler
- `DeleteConversationCommand` + Handler
- `SendMessageCommand` + Handler (triggers ChatOrchestrationService, returns SSE stream)
- `SubmitFeedbackCommand` + Handler (thumbs up/down)
- `GetConversationByIdQuery` + Handler → `ConversationDetailViewModel`
- `GetConversationsQuery` + Handler (user's conversations, paginated)
- `GetTokenQuotaQuery` + Handler

**Endpoints**: `KB.Server/Endpoints/Conversations/ConversationEndpoints.cs`

### 4.2 — Content Feed API
**Feature folder**: `KB.Core/Features/Feed/`
- `GetFeedArticlesQuery` + Handler (published, filtered by user's org exclusions)
- `GetFeedArticleByIdQuery` + Handler

**Feature folder**: `KB.Core/Features/Catalog/`
- `GetCatalogCoursesQuery` + Handler (available for user: org-shared + purchasable)
- `GetCatalogCourseByIdQuery` + Handler (with chapters/questions)

**Endpoints**: `KB.Server/Endpoints/Feed/` and `KB.Server/Endpoints/Catalog/`

### 4.3 — Enrollment API
**Feature folder**: `KB.Core/Features/Enrollments/`
- `EnrollInCourseCommand` + Handler
- `UpdateEnrollmentProgressCommand` + Handler
- `CompleteEnrollmentCommand` + Handler (mark complete + generate certificate)
- `GetEnrollmentCertificateQuery` + Handler (generate PDF)
- `GetEnrollmentsQuery` + Handler (user's enrollments)

**Endpoints**: `KB.Server/Endpoints/Enrollments/EnrollmentEndpoints.cs`

### 4.4 — Device & Push API
**Feature folder**: `KB.Core/Features/Devices/`
- `RegisterDeviceCommand` + Handler
- `UnregisterDeviceCommand` + Handler

**Endpoints**: `KB.Server/Endpoints/Devices/DeviceEndpoints.cs`

### 4.5 — Purchase API
**Feature folder**: `KB.Core/Features/Purchases/`
- `RecordPurchaseCommand` + Handler
- `VerifyRevenueCatWebhookCommand` + Handler
- `GetPurchasesQuery` + Handler (user's history)

**Endpoints**: `KB.Server/Endpoints/Purchases/PurchaseEndpoints.cs`

### 4.6 — Profile API
**Feature folder**: `KB.Core/Features/Profile/`
- `UpdateProfileCommand` + Handler
- `AcceptInvitationCommand` + Handler
- `GetProfileQuery` + Handler
- `GetInvitationsQuery` + Handler

**Endpoints**: `KB.Server/Endpoints/Profile/ProfileEndpoints.cs`

---

## Phase 5: React Admin Frontend

### 5.1 — Project Setup
- Install TailwindCSS v4, shadcn/ui, React Router v7
- Install axios, React Hook Form, Zod, TanStack Query
- Configure API client with JWT auth interceptor
- SSE client utility for chat streaming
- Setup routing structure matching bounded contexts

### 5.2 — Authentication UI
- Login page (handles `MustResetPassword` redirect)
- Forgot password / reset password flow
- JWT storage and refresh interceptor
- Protected route wrapper

### 5.3 — Layout & Navigation
- Dashboard shell with sidebar
- Navigation organized by bounded context:
  - **AI**: Chat, AI Profiles, Conversation Starters, Analytics
  - **Content**: Articles, Courses, Knowledge Base
  - **Management**: Organizations, Members, Subscriptions
  - **Account**: Profile, Settings

### 5.4 — Chat UI (Lena)
- SSE streaming with word-by-word rendering
- AI profile selector
- Conversation history sidebar
- Conversation starters
- Confidence indicators on responses
- Tool call visualization
- Message feedback (thumbs up/down)

### 5.5 — Content Management Pages
- **Article editor**: TipTap rich text, image upload, PDF attachment, org exclusion targeting, publish/unpublish
- **Course editor**: Chapter management with video URLs, question editor with options, org sharing, publish/unpublish
- **Knowledge bases**: Create/manage knowledge bases (isolated storage), select KB, file upload with category + chunk preset selection, processing status tracker, document list with filters

### 5.6 — Entity Management Pages
- **Organizations**: CRUD, seat allocation, member list, shared courses
- **Members**: List with filters, detail view, ban/unban, invite
- **Subscriptions**: Assign/unassign users to seats

### 5.7 — Analytics Dashboard
- AI invocation log with filters (date, user, outcome)
- Token usage charts (by user, by model, by period)
- Confidence score histograms
- Summary cards (total conversations, success rate, avg confidence)

---

## Phase 6: Mobile App Updates (kb-app)

### 6.1 — Auth Rewrite
- Remove `@better-auth/expo` and `better-auth/react` dependencies
- New `AuthService` class with JWT + refresh token management
- Store tokens in `expo-secure-store`
- Axios interceptor for `Authorization: Bearer` header
- Refresh interceptor: 401 → refresh → retry → on failure → logout
- Handle `MUST_RESET_PASSWORD` error → password reset flow
- Update `AuthProvider` context

### 6.2 — API Rewrite
- Point to new backend base URL
- Remove all `User-ID` header usage
- Update all feature hooks to new endpoint paths:
  - Chats → `/api/conversations/*`
  - News → `/api/feed/articles/*`
  - Courses → `/api/catalog/courses/*` + `/api/enrollments/*`
  - Push tokens → `/api/devices`
  - Purchases → `/api/purchases`
  - Profile → `/api/profile`
- Update TanStack React Query keys

### 6.3 — Chat SSE
- Implement SSE client for React Native (using `fetch` + `ReadableStream` or `EventSource` polyfill)
- Replace Vercel AI SDK streaming patterns
- Display streaming responses word-by-word
- Token quota check via `/api/conversations/quota`

---

## Phase 7: Migration & Production

### 7.1 — Data Migration Scripts
Write migration scripts (can be in KB.Operations or standalone) to transfer data from old PostgreSQL to new:
- Users → ApplicationUser (MustResetPassword=true, PasswordHash=null, LegacyUserId=old.id)
- Customers → Organizations
- Licenses → Subscriptions
- Chat + Message → Conversations + ConversationMessages
- News → Articles
- Courses/Chapters/Questions/Options → new entities
- UserCourses → Enrollments
- CoursePurchases + ChatTokensPurchases → unified Purchases
- LenaProfiles → AiProfiles
- KnowledgeBases: create default KnowledgeBase and assign migrated Documents to it
- KnowledgeFiles → Documents (file references only)
- Blob migration: AWS S3 → Azure Blob Storage (into the default KB container)
- Vector re-indexing: re-embed all documents into Azure AI Search (per KnowledgeBase)
- Validation: row counts, FK integrity, spot-check data quality

### 7.2 — Telemetry
- Application Insights + OpenTelemetry integration
- Serilog structured logging
- Health check endpoints (`/health`, `/health/ready`)
- Custom metrics: conversation count, AI invocation success rate

### 7.3 — Rate Limiting
- Per-user daily token limits (configurable)
- Purchased token tracking (from Purchases table)
- ASP.NET `System.Threading.RateLimiting` middleware
- Sliding window per-user, fixed window global

### 7.4 — Testing
- Unit tests: CQRS handlers, domain logic, confidence scoring
- Integration tests: API endpoints with test database
- Architecture tests: bounded context boundaries
- SSE streaming tests
- Framework: xUnit + NSubstitute

### 7.5 — Deployment
- Azure App Service or Container Apps
- GitHub Actions CI/CD pipeline
- Environment-specific configuration (dev/staging/prod)
- New domain during coexistence (e.g., `api-v2.intressebevakaren.se`)
- DNS migration when old system is decommissioned

---

## Phase Dependencies

```
Phase 1 (Foundation) ─┬─► Phase 2 (Business API) ──────────► Phase 5 (React Frontend)
                      ├─► Phase 3 (AI / SK) ─────────────► Phase 5.4 (Chat UI)
                      └─► Phase 4 (Consumer API) ────────► Phase 6 (kb-app Update)
                           ▲                                    │
                           └─── Phase 3.4 (Chat Service) ──────┘

Phase 7 (Migration & Production) depends on Phases 1-6 being complete
  - 7.1 (Data Migration) can start when schema is stable (after Phase 1)
  - 7.2 (Telemetry) can start alongside Phase 1
  - 7.4 (Testing) should happen continuously alongside each phase
  - 7.5 (Deployment) is the final gate
```

## Notes

- The `docs/kb-admin-dotnet-migration-plan.md` is the original requirements source — consult it for edge cases not covered here
- The `docs/project-agnostic-architecture-overview.md` defines coding patterns and conventions
- The `.github/copilot-instructions.md` (or equivalent custom instructions) defines entity patterns, handler patterns, and naming conventions
- The old system source code in `old_system/` can be referenced for business logic details, especially for chat/RAG logic and the document processing pipeline
