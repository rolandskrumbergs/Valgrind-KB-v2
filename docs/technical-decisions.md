# KB Platform — Technical Decisions

This document captures key architectural and technical decisions for the KB platform. Reference this when implementing features to understand the "why" behind design choices.

---

## 1. Clean Architecture with DDD + CQRS

**Decision**: Use Clean Architecture with Domain-Driven Design and Command/Query Responsibility Segregation.

**Why**: The old system (Next.js) mixed concerns freely — API routes directly queried the database, business logic lived in server actions, and the AI chat handler was a single 300+ line function. The new system separates concerns into layers with strict dependency rules.

**Implementation**:
- Domain layer has zero external dependencies
- Core layer contains all business logic as CQRS handlers
- Infrastructure implements interfaces defined in Domain/Core
- Dependencies point inward only
- Each handler is a single-purpose class (one command/query = one handler)

---

## 2. Result Pattern (No Exceptions for Flow Control)

**Decision**: All handlers return `Result<T>` or `Result`, never throw exceptions for expected error conditions.

**Why**: The old system used a mix of throwing errors, returning null, and HTTP status codes directly from business logic. The Result pattern makes all outcomes explicit and type-safe.

**Key rules**:
- Use `Result.NotFound()` not `Result<T>.NotFound()` for error results
- Return `Result.NotFound()` instead of `Result.Forbidden()` to prevent information disclosure
- `Result.Invalid()` for validation failures
- Exceptions are only for truly unexpected errors (bugs, infrastructure failures)

---

## 3. SSE over SignalR for Chat Streaming

**Decision**: Use Server-Sent Events (SSE) for chat response streaming, not SignalR.

**Why**: 
- The mobile app (React Native/Expo) has limited SignalR support
- SSE is simpler, unidirectional (server → client), and works with standard HTTP
- The old system used Vercel AI SDK streaming which is SSE-based — maintaining the same pattern reduces mobile app changes
- SSE works through CDNs and load balancers without special configuration

**Implementation**: `POST /api/conversations/{id}/messages` returns `Content-Type: text/event-stream` with chunked transfer encoding.

---

## 4. JWT + Refresh Token Rotation (No BetterAuth)

**Decision**: Replace BetterAuth with ASP.NET Core Identity + JWT Bearer tokens with refresh token rotation.

**Why**:
- BetterAuth is JavaScript-specific and can't run in .NET
- ASP.NET Core Identity provides battle-tested user management, password hashing, and role management
- JWT tokens are stateless (no session lookup on every request)
- Refresh token rotation provides security against token theft

**Key details**:
- Access token: 1 hour lifetime
- Refresh token: 30 days, rotated on every use, stored hashed in database
- On refresh: old token is revoked, new pair issued
- `MustResetPassword` flag for migrated users forces password reset flow

---

## 5. Password-Free Migration

**Decision**: Migrated users do NOT have their passwords carried over. They must set new passwords.

**Why**:
- BetterAuth uses bcrypt for password hashing; ASP.NET Core Identity uses PBKDF2 by default
- Cross-hashing verification is complex and error-prone
- Clean break is simpler and more secure
- Users get a clear "welcome to the new system" experience

**Flow**: Migrated user tries to login → gets `MUST_RESET_PASSWORD` error → triggers password reset email → sets new password → can login normally.

---

## 6. PostgreSQL (Not SQL Server)

**Decision**: Use PostgreSQL as the database, even though the EF Core infrastructure currently configures SQL Server.

**Why**:
- The old system uses PostgreSQL (Neon) — staying on the same engine simplifies data migration
- PostgreSQL has better JSON support (`jsonb` type) which is used extensively for AI metrics, processing progress, and snapshots
- Azure Database for PostgreSQL is production-ready
- Cost-effective compared to Azure SQL

**Migration needed**: The current `Setup.cs` configures `UseSqlServer()`. This must be changed to `UseNpgsql()` with the `Npgsql.EntityFrameworkCore.PostgreSQL` package.

---

## 7. Azure AI Search over Upstash Vector

**Decision**: Migrate from Upstash Vector to Azure AI Search for vector storage.

**Why**:
- **Hybrid search**: Azure AI Search supports vector + keyword + semantic ranking. Upstash only supports vector similarity.
- **Integrated reranking**: Semantic ranker provides better relevance than pure vector similarity
- **Scale**: Better suited for production legal document retrieval
- **Azure ecosystem**: Consistent with other Azure services (Blob, App Insights)

**Key difference**: The old system uses 4 separate Upstash indexes. Azure AI Search will maintain the same 4-index pattern (books, laws, legalcases, other) for category-specific retrieval.

---

## 8. text-embedding-3-large over Swedish BERT

**Decision**: Replace `KBLab/sentence-bert-swedish-cased` (768 dimensions) with `text-embedding-3-large` (3072 dimensions, configurable).

**Why**:
- `text-embedding-3-large` is multilingual and handles Swedish well
- Higher dimensionality = better semantic representation
- No need to host a separate embedding microservice
- Integrated with Azure OpenAI — same billing, same auth
- The old Swedish BERT model requires a dedicated FastAPI service

**Risk**: Swedish legal terminology may be better captured by the specialized Swedish model. Benchmark before full migration.

---

## 9. Kernel Memory for Document Ingestion

**Decision**: Use Microsoft Kernel Memory instead of the custom Python pipeline (unstructured + sentence-transformers).

**Why**:
- Kernel Memory handles the full pipeline: upload → chunk → embed → index
- Native .NET — no cross-language service calls
- Built-in Azure AI Search connector
- Reduces operational complexity (no Python microservice to maintain)

**Risk**: Kernel Memory's default chunking may not be optimal for Swedish legal documents. The old system has 6 battle-tested chunking presets. Custom chunking handlers may be needed.

---

## 10. Aggregate Root Pattern (Strict)

**Decision**: Only aggregate roots have repositories. Child entities are accessed and modified through their parent aggregate root.

**Why**:
- Enforces consistency boundaries (e.g., a Chapter can't exist without its Course)
- EF Core handles persistence of the entire aggregate when `UpdateAsync` is called on the root
- Prevents orphaned records and inconsistent state

**Examples**:
- To add a Chapter: `course.AddChapter(title, videoUrl)` then `courseRepository.UpdateAsync(course)`
- To delete a Question: `chapter.RemoveQuestion(questionId)` then `courseRepository.UpdateAsync(course)`
- Do NOT: `dbContext.Set<Chapter>().Add(chapter)` — this bypasses the aggregate root

---

## 11. Resend over SendGrid

**Decision**: Use Resend for transactional email instead of SendGrid.

**Why**: Simpler API, better developer experience, and cleaner .NET SDK.

---

## 12. Confidence Scoring Pipeline (4 Layers)

**Decision**: Implement a 4-layer confidence scoring pipeline for AI responses.

**Why**: Legal domain requires either correct answers or no answer at all. The old system has basic relevance thresholds; the new system adds LLM-based evaluation and citation verification.

**Pipeline** (short-circuit on failure):
```
Chunk Retrieval → [Layer 1: Score check] → [Layer 2: LLM eval] → Generate Response → [Layer 3: LLM-as-Judge] → [Layer 4: Citations] → Deliver/Withhold
```

1. **Chunk-level relevance**: Vector search scores + configurable thresholds
2. **LLM chunk evaluation**: Separate LLM call rates each chunk's relevance (catches semantic search false positives)
3. **LLM-as-Judge**: Evaluates generated response for groundedness, relevance, coherence, factual accuracy
4. **Citation verification**: Validates inline citations against source chunks

---

## 13. Dual LLM Provider Support

**Decision**: Support both Azure OpenAI and OpenAI as LLM providers, configurable per AI profile.

**Why**:
- Azure OpenAI for production (SLA, data residency, compliance)
- OpenAI direct for development/testing (simpler setup, faster iteration)
- Different models for different tasks (e.g., GPT-4o for generation, GPT-4o-mini for evaluation)

---

## 14. Frontend: React SPA (Not Next.js SSR)

**Decision**: Use React + Vite as a pure SPA for the admin dashboard, not Next.js.

**Why**:
- The admin dashboard is a pure client-side app — no SEO needed, no server-side rendering required
- Vite is significantly faster than Next.js for development
- Simpler deployment: static files served by ASP.NET Core
- Clean separation: API (.NET) and frontend (static) are independent

---

## 15. TailwindCSS v4 + shadcn/ui

**Decision**: Use TailwindCSS v4 with shadcn/ui component library for the admin frontend.

**Why**:
- Consistent with the old admin frontend patterns (already using Tailwind)
- shadcn/ui provides accessible, customizable components without heavy framework lock-in
- Components are copied into the project (not imported from npm) — full control

---

## 16. Entities Must Not Throw Exceptions

**Decision**: Domain entity constructors and methods must never throw exceptions or validate parameters.

**Why**:
- Validation belongs in CQRS handlers (Core layer)
- Entities provide query methods (e.g., `CanBePublished()`, `IsExpired()`) that handlers check before calling mutation methods
- This keeps entities simple and testable
- Follows the project's DDD conventions

---

## 17. RevenueCat for Payments

**Decision**: Continue using RevenueCat for in-app purchases, receiving webhooks on the .NET backend.

**Why**:
- RevenueCat is already integrated in the mobile app
- Handles Apple/Google payment complexity
- Webhook-based integration is backend-agnostic
- No need to rebuild payment infrastructure
