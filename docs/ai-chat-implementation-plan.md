# AI Chat with Knowledge Base — Implementation Plan

## Progress

- ✅ **Step 1**: Domain entities, enums, repository interfaces, EF configs, migration — COMPLETE
- ✅ **Step 2**: NuGet packages — COMPLETE (Azure AI Search removed, KM Postgres + KM AI OpenAI added)
- ✅ **Step 3**: Semantic Kernel DI setup — COMPLETE (IKernelMemory registered with Postgres connector, dual OpenAI/AzureOpenAI provider support)
- ✅ **Step 4**: Document ingestion service — COMPLETE (uses IKernelMemory.ImportDocumentAsync pipeline with tag-based KB/category/document filtering)
- ✅ **Step 5**: RAG Plugin & Chat orchestration — COMPLETE (KnowledgeBasePlugin uses IKernelMemory.SearchAsync, ChatOrchestrationService wired with IKernelMemory)
- ⬜ **Step 6**: Confidence Scoring Pipeline — NOT STARTED (planned as final step)
- ✅ **Step 7**: All API endpoints (KB, Documents, AI Profiles, Conversations w/ SSE, Starters, Feedback) — COMPLETE
- ✅ **Step 8**: Frontend Integration — COMPLETE (API client with SSE streaming, chat page with real-time token rendering, AI profiles CRUD, knowledge bases CRUD with document upload)

## Problem Statement

The KB platform needs AI-powered chat ("Lena") that allows users to ask questions and get answers grounded in a knowledge base of Swedish legal/guardianship documents. The system uses **Retrieval-Augmented Generation (RAG)** with a 4-layer confidence scoring pipeline to ensure high accuracy in the legal domain. Responses must be either correct (with citations) or withheld entirely — no hallucinations.

## Current State

**What exists (fully implemented):**
- ✅ Clean Architecture foundation (DDD, CQRS, Result pattern, interceptors, repositories)
- ✅ Authentication system (ASP.NET Core Identity + JWT)
- ✅ All AI domain entities, enums, repository interfaces, EF configurations, and migration (Step 1)
- ✅ All API endpoints: Conversations (SSE streaming), AI Profiles, Knowledge Bases, Documents, Conversation Starters (Step 7)
- ✅ NuGet packages: Semantic Kernel, Kernel Memory Core, KM Postgres connector, KM AI OpenAI (Step 2)
- ✅ Semantic Kernel DI setup with IKernelMemory (Postgres pgvector), dual OpenAI/AzureOpenAI provider support (Step 3)
- ✅ Document ingestion pipeline via IKernelMemory.ImportDocumentAsync with tag-based filtering (Step 4)
- ✅ RAG plugin (KnowledgeBasePlugin) using IKernelMemory.SearchAsync with pgvector (Step 5)
- ✅ Chat orchestration service with SSE streaming via IAsyncEnumerable<ChatStreamEvent> (Step 5)
- ✅ Frontend: API client with all AI types + SSE async generator, chat page with conversation sidebar + real-time streaming + feedback, AI profiles CRUD with dialog forms, knowledge bases CRUD with document upload (Step 8)

**What's remaining:**
- ⬜ Step 6: Confidence Scoring Pipeline (Layers 1-4) — planned as final enhancement
- ⬜ End-to-end testing with real OpenAI API key and PostgreSQL with pgvector extension
- ⬜ `CREATE EXTENSION vector` on PostgreSQL database (required before first use)
- ⬜ Hybrid search optimization (full-text BM25 + vector similarity fusion) — current implementation uses KM's built-in vector search only

## Approach

Build in 8 implementation steps, each producing a testable increment. Steps 1-3 lay the backend foundation, Steps 4-6 build the AI pipeline, Step 7 wires the API endpoints, and Step 8 connects the frontend.

---

## Step 1: AI Domain Entities & Enums

Create all AI-related domain entities and enums following existing project patterns.

### 1.1 — Enums (`KB.Domain/Enums/`)
- `MessageRole` — System, User, Assistant, Tool
- `InvocationOutcome` — Success, InsufficientData, Error
- `KnowledgeCategory` — Books, Laws, LegalCases, Other
- `ProcessingStatus` — Uploaded, Processing, Completed, Failed

### 1.2 — Entities (`KB.Domain/Entities/`)
All entities follow `DomainEntity<Guid>` pattern with `protected set`, no validation in entities.

- **`AiProfile`** — IAggregateRoot, ISoftDeletable, IAuditable
  - Name, IsActive, KnowledgeBaseId, Model, TopK, MinRelevanceThreshold, MinRelevanceChunksRequired, HighConfidenceThreshold, HighConfidenceChunksRequired
  - Methods: `Activate()`, `Deactivate()`, `UpdateSettings(...)`, `IsConfiguredFor(knowledgeBaseId)`

- **`Conversation`** — IAggregateRoot, IAuditable
  - UserId, Title, AiProfileId
  - Children: `ICollection<ConversationMessage>`, `ICollection<MessageFeedback>`
  - Methods: `AddMessage(role, content, parts, snapshot)`, `AddFeedback(messageId, userId, isPositive)`, `UpdateTitle(title)`

- **`ConversationMessage`** — DomainEntity<Guid>
  - ConversationId, Role (MessageRole), Content, Parts (JSON), AiProfileSnapshot (JSON), CreatedAt

- **`MessageFeedback`** — DomainEntity<Guid>
  - ConversationId, MessageId, UserId, IsPositive, CreatedAt

- **`UsageRecord`** — DomainEntity<Guid>
  - UserId, ConversationId?, MessageId?, PromptTokens, CompletionTokens, TotalTokens, Model, AiProfileSnapshot (JSON), CreatedAt

- **`ConversationStarter`** — IAggregateRoot
  - Text, SortOrder, IsActive, CreatedAt

- **`AiInvocation`** — DomainEntity<Guid>
  - ConversationId, MessageId, UserId, SearchQuery, ConversationSummary, Outcome (InvocationOutcome), OutcomeReason, RetrievedChunks (JSON), QualityMetrics (JSON), InputTokens, OutputTokens, Model, AiProfileSnapshot (JSON), CreatedAt

- **`KnowledgeBase`** — IAggregateRoot, ISoftDeletable, IAuditable
  - Name, Slug, Description, IsActive, BlobContainerName, SearchIndexPrefix (retained for logical tag-based filtering in pgvector), CreatedByUserId, UpdatedByUserId

- **`Document`** — IAggregateRoot, IAuditable
  - KnowledgeBaseId, FileName, FileSize, ContentType, Category (KnowledgeCategory), BlobPath, ContentHash, ChunkingPreset, ProcessingStatus (ProcessingStatus), ProcessingProgress (JSON), ProcessingMetrics (JSON), ErrorMessage, TotalChunks, IndexedChunks, FailedChunks, UploadedByUserId

### 1.3 — Repository Interfaces (`KB.Domain/Interfaces/Repositories/`)
- `IAiProfileRepository` — `GetActiveProfileAsync()`, `GetByKnowledgeBaseIdAsync()`
- `IConversationRepository` — `GetWithMessagesAsync()`, `GetUserConversationsAsync()`
- `IKnowledgeBaseRepository` — `GetBySlugAsync()`
- `IDocumentRepository` — `GetByKnowledgeBaseIdAsync()`, `GetByContentHashAsync()`
- `IAiInvocationRepository` — `GetByConversationIdAsync()`
- `IUsageRecordRepository` — `GetUserUsageSummaryAsync()`
- `IConversationStarterRepository` — `GetActiveStartersAsync()`

### 1.4 — EF Core Configurations (`KB.Infrastructure/Data/Configurations/`)
One configuration class per entity:
- String max lengths on all string props
- Enum → string conversions with max length
- Soft-delete query filters on KnowledgeBase, AiProfile
- JSON column types for ProcessingProgress, ProcessingMetrics, RetrievedChunks, QualityMetrics, Parts, AiProfileSnapshot
- Unique indexes: AiProfile.Name, KnowledgeBase.Name, KnowledgeBase.Slug, Document.(KnowledgeBaseId + ContentHash)
- Foreign key relationships

### 1.5 — EF Core Migration
- Add entity DbSets to `AppDbContext`
- Run `dotnet ef migrations add AddAiEntities`

---

## Step 2: NuGet Packages & AI Configuration

### 2.1 — Add NuGet Packages to `Directory.Packages.props`
```xml
Microsoft.SemanticKernel
Microsoft.SemanticKernel.Connectors.AzureOpenAI
Microsoft.SemanticKernel.Connectors.OpenAI
Microsoft.SemanticKernel.Connectors.PgVector
Microsoft.KernelMemory.Core
Microsoft.KernelMemory.MemoryDb.Postgres
Microsoft.KernelMemory.AI.AzureOpenAI (or OpenAI equivalent)
Azure.Storage.Blobs
Pgvector (Npgsql pgvector extension)
```

### 2.2 — Configuration Classes (`KB.Core/` or `KB.Infrastructure/`)
- **`AiSettings`** — DefaultModel, MaxAgenticLoopSteps, MaxConversationHistoryMessages
- **`OpenAiSettings`** — ApiKey, OrganizationId
- **`AzureOpenAiSettings`** — Endpoint, ApiKey, DeploymentName, EmbeddingDeploymentName
- **`AzureBlobStorageSettings`** — ConnectionString
- **`ConfidenceThresholdDefaults`** — Default values for all 4 layers

> **Note**: `AzureAiSearchSettings` is no longer needed. Vector search is handled by pgvector in the existing PostgreSQL database.

### 2.3 — Configuration in `appsettings.json`
Add AI configuration sections with placeholder values (secrets via user-secrets or environment vars).

---

## Step 3: Semantic Kernel DI Setup

### 3.1 — Register Semantic Kernel (`KB.Infrastructure/Setup.cs` or new `AiSetup.cs`)
- Register `IKernel` (or `Kernel`) with DI
- Configure dual LLM provider support (Azure OpenAI + OpenAI) based on settings
- Register embedding service for `text-embedding-3-large`
- Register pgvector PostgreSQL vector store connector (`AddPostgresVectorStore`)

### 3.2 — Register Kernel Memory
- Configure Kernel Memory pipeline (upload → chunk → embed → index)
- Azure Blob Storage as document store
- **PostgreSQL + pgvector as vector store** (`Microsoft.KernelMemory.MemoryDb.Postgres`)
- Configurable chunking parameters

### 3.3 — PostgreSQL pgvector Setup
- Enable `vector` extension on the database: `CREATE EXTENSION IF NOT EXISTS vector;`
- Create vector tables for chunk storage (managed by Kernel Memory Postgres connector or custom schema)
- Configure HNSW indexes for fast similarity search on vector columns
- Enable PostgreSQL full-text search (GIN indexes on `tsvector` columns) for hybrid search

---

## Step 4: Knowledge Base & Document Ingestion

### 4.1 — Blob Storage Service (`KB.Infrastructure/Services/`)
- `IBlobStorageService` interface in Domain
- Implementation: Upload, Download, Delete, GetUrl, CreateContainer
- Container-per-knowledge-base isolation

### 4.2 — Document Ingestion Service
- `IDocumentIngestionService` interface
- Uses Kernel Memory pipeline: upload blob → chunk → embed → index into **PostgreSQL via pgvector**
- Routes to correct KB container + vector partition based on `KnowledgeBase.SearchIndexPrefix` + `Document.Category`
- Partition strategy: use `knowledge_base_id` + `category` columns to logically partition chunks within a single table (or use Kernel Memory's built-in tag-based filtering)
- Updates `Document.ProcessingStatus`, `ProcessingProgress`, `ProcessingMetrics` during pipeline
- Background processing (fire-and-forget or queued)
- Content hash deduplication check before processing

### 4.3 — Knowledge Base CQRS Handlers (`KB.Core/Features/KnowledgeBases/`)
- `CreateKnowledgeBaseCommand` + Handler — provisions blob container (search indexes no longer needed — pgvector uses shared table with filters)
- `UpdateKnowledgeBaseCommand` + Handler
- `DeleteKnowledgeBaseCommand` + Handler (soft-delete + delete associated vector chunks)
- `GetKnowledgeBaseByIdQuery` + Handler
- `GetKnowledgeBasesQuery` + Handler (paginated list)

### 4.4 — Document CQRS Handlers (`KB.Core/Features/Documents/`)
- `UploadDocumentCommand` + Handler — upload to blob, create entity, trigger ingestion pipeline
- `DeleteDocumentCommand` + Handler — delete blob + vectors + entity
- `ReprocessDocumentCommand` + Handler — re-trigger pipeline
- `GetDocumentByIdQuery` + Handler
- `GetDocumentsQuery` + Handler (paginated, filterable by KB, category, status)

---

## Step 5: RAG Plugin & Chat Orchestration

### 5.1 — Knowledge Base Search Plugin (Semantic Kernel Plugin)
- `KnowledgeBasePlugin` class — registered as SK native function/tool
- Tool function: `SearchKnowledgeBase(query, category?)` — called by SK's agentic loop
- **Queries PostgreSQL pgvector with hybrid search** (vector similarity + full-text BM25 via `tsvector`/`tsquery`, fused using Reciprocal Rank Fusion)
- Filters by `knowledge_base_id` and optionally `category` — single table replaces 4 separate indexes per KB
- Returns formatted chunks with metadata (source document, category, relevance score)
- Configurable `topK` and `minRelevanceScore` from active `AiProfile`
- Uses Npgsql with pgvector extension for vector distance queries (cosine similarity via `<=>` operator)
- HNSW index on embedding column for fast approximate nearest neighbor search

### 5.2 — System Prompt Design
- Swedish-language system prompt for "Lena" persona
- Instructions for citing sources using Swedish legal citation format (SFS, FB kap. §)
- Instructions to refuse answering when insufficient data
- Stored in `Prompts/` directory as `.txt` files (easily editable by non-developers)

### 5.3 — Chat Orchestration Service (`KB.Infrastructure/Services/` or new `KB.AI/`)
- `IChatOrchestrationService` interface in Core
- Implementation uses Semantic Kernel `IChatCompletionService` with tool calling (agentic loop)
- Flow:
  1. Load conversation history (last N messages, configurable)
  2. Build system prompt with active AI profile settings
  3. Register `KnowledgeBasePlugin` as available tool
  4. Send to LLM with auto-tool-calling enabled
  5. SK handles the agentic loop: LLM calls tools → gets results → generates response
  6. Stream response tokens back via SSE
  7. After completion: persist assistant message, create UsageRecord, create AiInvocation(s)
- Configurable max agentic loop steps to prevent infinite tool calling
- Token usage tracking per message (prompt + completion tokens)

### 5.4 — SSE Streaming Implementation
- `POST /api/conversations/{id}/messages` returns `Content-Type: text/event-stream`
- Stream events: `data: {"type":"token","content":"..."}`, `data: {"type":"tool_call","name":"..."}`, `data: {"type":"done","messageId":"..."}`
- Use `IAsyncEnumerable<string>` or `HttpResponse.Body.WriteAsync` for chunked streaming
- Handle client disconnection gracefully

---

## Step 6: Confidence Scoring Pipeline

### 6.1 — Layer 1: Chunk-Level Relevance Scoring
- After pgvector retrieval, evaluate chunk distance scores (converted to similarity: `1 - cosine_distance`)
- Apply thresholds from `AiProfile`: `MinRelevanceThreshold`, `MinRelevanceChunksRequired`, `HighConfidenceThreshold`, `HighConfidenceChunksRequired`
- Short-circuit: if insufficient relevant chunks → refuse with explanation, log as `InsufficientData`

### 6.2 — Layer 2: LLM-Based Chunk Evaluation
- For each retrieved chunk, make a separate LLM call (use cheaper model, e.g., gpt-4o-mini)
- Prompt: "Given this chunk and the user's question, rate relevance 0-10 and explain why"
- Filter out chunks below threshold before building the final prompt
- Catches semantic search false positives
- Can run in parallel for performance

### 6.3 — Layer 3: LLM-as-Judge Response Verification
- After main LLM generates response, run a separate evaluation call
- Evaluate: Groundedness (0-5), Relevance (0-5), Coherence (0-5), Factual Accuracy (0-5)
- Use `HillPhelmuth.SemanticKernel.LlmAsJudgeEvals` NuGet package (or custom prompts)
- Compute composite score; if below threshold → withhold response

### 6.4 — Layer 4: Citation Verification
- Parse inline citations from LLM response (patterns: `[SFS 2024:123, §4]`, `[FB 12 kap. 2 §]`)
- Verify each citation exists in the retrieved chunks
- Flag or remove unverifiable citations
- If >X% of claims lack citations → reduce confidence or withhold

### 6.5 — Confidence Aggregation Service
- Combine all 4 layer scores into final composite score
- Apply decision matrix:
  | Chunk Score | Judge Score | Citations | Action |
  |---|---|---|---|
  | High | High | Yes | ✅ Deliver with high confidence |
  | High | High | Partial | ⚠️ Deliver with medium confidence |
  | High | Low | Any | ❌ Withhold (hallucination risk) |
  | Low | Any | Any | ❌ Withhold (insufficient data) |
  | Medium | High | Yes | ⚠️ Deliver with disclaimer |
- Include confidence metadata in SSE stream events
- Log detailed metrics in `AiInvocation.QualityMetrics`

> **Note**: Confidence scoring Layers 2-4 are advanced features. Start with Layer 1 only for the initial implementation, then add layers incrementally. The full 4-layer pipeline adds significant latency and cost (multiple LLM calls per response).

---

## Step 7: API Endpoints

### 7.1 — Conversation Endpoints (`KB.Server/Endpoints/Conversations/`)
- `POST /api/conversations` — create conversation
- `GET /api/conversations` — list user's conversations (paginated)
- `GET /api/conversations/{id}` — get conversation with messages
- `DELETE /api/conversations/{id}` — delete conversation
- `POST /api/conversations/{id}/messages` — send message, returns SSE stream
- `POST /api/conversations/{id}/messages/{msgId}/feedback` — submit feedback
- `GET /api/conversations/quota` — get user's token usage/quota

### 7.2 — AI Profile Endpoints (`KB.Server/Endpoints/AiProfiles/`)
- `GET /api/ai-profiles` — list all profiles
- `GET /api/ai-profiles/{id}` — get profile details
- `POST /api/ai-profiles` — create profile (admin)
- `PUT /api/ai-profiles/{id}` — update profile (admin)
- `DELETE /api/ai-profiles/{id}` — delete profile (admin)
- `POST /api/ai-profiles/{id}/activate` — activate profile (deactivates others)

### 7.3 — Knowledge Base Endpoints (`KB.Server/Endpoints/KnowledgeBases/`)
- `GET /api/knowledge-bases` — list knowledge bases
- `GET /api/knowledge-bases/{id}` — get KB details
- `POST /api/knowledge-bases` — create KB (admin)
- `PUT /api/knowledge-bases/{id}` — update KB (admin)
- `DELETE /api/knowledge-bases/{id}` — delete KB (admin)

### 7.4 — Document Endpoints (`KB.Server/Endpoints/KnowledgeBases/{kbId}/Documents/`)
- `GET /api/knowledge-bases/{kbId}/documents` — list documents (paginated, filterable)
- `GET /api/knowledge-bases/{kbId}/documents/{id}` — get document details
- `POST /api/knowledge-bases/{kbId}/documents` — upload document (multipart)
- `DELETE /api/knowledge-bases/{kbId}/documents/{id}` — delete document
- `POST /api/knowledge-bases/{kbId}/documents/{id}/reprocess` — re-trigger pipeline

### 7.5 — Conversation Starter Endpoints
- `GET /api/conversation-starters` — get active starters (consumer)
- `PUT /api/conversation-starters` — bulk replace starters (admin)

---

## Step 8: Frontend Integration

### 8.1 — API Client & SSE Utility (`kb.client/src/`)
- Create typed API client functions for all AI endpoints
- Create SSE client hook: `useSSE(url)` — connects to stream, parses events, returns messages
- TanStack Query hooks for all CRUD operations

### 8.2 — Chat UI Upgrade (`kb.client/src/pages/chat.tsx`)
- Replace mock data with real API calls
- SSE streaming with word-by-word rendering
- Conversation list sidebar (create, select, delete)
- Conversation starters from API
- AI profile selector dropdown
- Message feedback (thumbs up/down buttons)
- Confidence indicators on assistant messages (high/medium/withheld)
- Tool call visualization (show when KB is being searched)
- Loading/typing indicator during streaming
- Error handling for withheld responses

### 8.3 — AI Profiles Page Upgrade (`kb.client/src/pages/ai-profiles.tsx`)
- Replace mock data with real CRUD API calls
- Create/edit form with all profile fields
- Knowledge base selector dropdown
- Activate/deactivate functionality

### 8.4 — Knowledge Bases Page Upgrade (`kb.client/src/pages/knowledge-bases.tsx`)
- Replace mock data with real API calls
- KB CRUD with create/edit forms
- Document upload with drag-and-drop, category selection, chunk preset selection
- Real-time processing status updates (polling or SSE)
- Document list with status badges, filtering by category/status

---

## Implementation Notes

### Priority Order
For a minimal viable AI chat, implement in this order:
1. **Steps 1-2** (entities + packages) — foundation
2. **Step 3** (SK setup) — AI runtime
3. **Step 5.1-5.4** (RAG + chat orchestration) — core chat functionality with Layer 1 only
4. **Step 7.1** (conversation endpoints) — API for chat
5. **Step 8.1-8.2** (frontend chat) — working chat UI
6. **Steps 4, 7.3-7.4, 8.4** (knowledge base management) — document ingestion
7. **Steps 7.2, 8.3** (AI profiles) — configuration UI
8. **Step 6** (confidence scoring layers 2-4) — advanced quality assurance

### Key Technical Decisions (from docs)
- **SSE not SignalR** for streaming (mobile app compatibility)
- **Dual LLM providers**: Azure OpenAI (production) + OpenAI (development)
- **Separate evaluation LLM**: Use cheaper model (gpt-4o-mini) for confidence scoring
- **PostgreSQL pgvector** as vector store (replaces Azure AI Search — uses existing DB, saves ~$74-$365/mo)
- **Hybrid search via pgvector + full-text**: Vector similarity (`<=>` cosine) + BM25 (`tsvector`/`tsquery`) with Reciprocal Rank Fusion (RRF)
- **Single chunks table** with `knowledge_base_id` + `category` columns replaces 4 separate indexes per KB
- **Kernel Memory with Postgres connector** (`Microsoft.KernelMemory.MemoryDb.Postgres`) for document ingestion pipeline
- **text-embedding-3-large** for embeddings (replacing Swedish BERT)
- **Swedish-language** system prompts

### Dependencies
- Step 1 (entities) → unblocks Steps 3-7
- Step 2 (packages) → unblocks Step 3
- Step 3 (SK setup + pgvector) → unblocks Steps 4-6
- Step 5 (RAG + chat) → unblocks Step 7.1
- Step 7 (endpoints) → unblocks Step 8

---

## Migration from Azure AI Search to pgvector — COMPLETED

All migration changes have been applied:

### Packages Changed (`Directory.Packages.props` + `KB.Infrastructure.csproj`)
- ✅ **Added**: `Microsoft.KernelMemory.MemoryDb.Postgres`, `Microsoft.KernelMemory.AI.OpenAI`
- ✅ **Removed**: `Azure.Search.Documents`, `Microsoft.KernelMemory.MemoryDb.AzureAISearch`

### Code Changes Applied

1. ✅ **`KnowledgeBasePlugin.cs`** — Full rewrite: uses `IKernelMemory.SearchAsync()` with tag-based filtering for `knowledge_base_id` and `category` instead of Azure AI Search `SearchClient`

2. ✅ **`AiSettings.cs`** — Removed `AzureAiSearchSettings` class and property

3. ✅ **`AiSetup.cs`** — Full rewrite: registers `IKernelMemory` as singleton using `KernelMemoryBuilder` with `.WithPostgresMemoryDb()`, `.WithOpenAI()` / `.WithAzureOpenAITextGeneration()` + `.WithAzureOpenAITextEmbeddingGeneration()`, and optional Azure Blob Storage

4. ✅ **`DocumentIngestionService.cs`** — Full rewrite: uses `IKernelMemory.ImportDocumentAsync()` pipeline with tag-based metadata (knowledge_base_id, category, document_id), polls `IsDocumentReadyAsync()` for completion

5. ✅ **`appsettings.json`** — Removed `AzureAiSearch` configuration section

6. ✅ **`ChatOrchestrationService.cs`** — Added `IKernelMemory` injection, passes to `KnowledgeBasePlugin` constructor

### Technical Details
- Kernel Memory Postgres connector auto-creates tables with `km_` prefix per memory index
- Vector search uses KM's built-in similarity search (no custom SQL required)
- Tag-based filtering replaces separate Azure AI Search indexes per KB
- `CREATE EXTENSION vector` must be run on PostgreSQL before first use
- KM package version: `0.98.250508.3` (net8.0, compatible with project's net10.0 target)
