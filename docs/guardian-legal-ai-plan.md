# Guardian AI Legal Assistant — .NET / Semantic Kernel Implementation Plan

## Problem Statement

Build a new standalone .NET application using Semantic Kernel that provides AI-powered legal/legislative assistance for guardians (Swedish: "god man" / "förvaltare"). The system must retrieve information from a knowledge base (legislation, rules, legal cases) and provide highly accurate, confidence-scored responses. Given the legal domain, responses must either be correct or withheld entirely — no hallucinations allowed.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (SPA)                       │
│  Chat UI · Document Upload · Admin Dashboard · Profile Mgmt  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API / SignalR (streaming)
┌────────────────────────▼────────────────────────────────────┐
│               ASP.NET Core Web API (.NET 8+)                 │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────────────────┐  │
│  │ Auth &   │ │  Chat API    │ │  Document Ingestion API  │  │
│  │ Identity │ │  (SignalR)   │ │  (Upload/Process)        │  │
│  └──────────┘ └──────┬───────┘ └────────────┬────────────┘  │
│                       │                      │               │
│  ┌────────────────────▼──────────────────────▼────────────┐  │
│  │              Semantic Kernel Orchestration               │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐  │  │
│  │  │ RAG Plugin  │ │ Confidence   │ │ Response        │  │  │
│  │  │ (KB Search) │ │ Scoring Svc  │ │ Verification    │  │  │
│  │  └──────┬──────┘ └──────┬───────┘ └────────┬────────┘  │  │
│  └─────────┼───────────────┼──────────────────┼───────────┘  │
│            │               │                  │               │
│  ┌─────────▼───────────────▼──────────────────▼────────────┐ │
│  │                    LLM Providers                         │ │
│  │  Azure OpenAI  ·  OpenAI  (configurable via settings)   │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Azure AI     │ │  SQL Server  │ │ Azure Blob   │
│ Search       │ │  / PostgreSQL│ │ Storage      │
│ (Vector+     │ │  (App Data)  │ │ (Documents)  │
│  Semantic)   │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Tech Stack

| Layer              | Technology                                                   |
| ------------------ | ------------------------------------------------------------ |
| Frontend           | React (Vite or CRA) + TypeScript                            |
| Backend API        | ASP.NET Core 8+ Minimal APIs                                |
| Real-time          | SignalR (streaming chat responses)                           |
| AI Orchestration   | Microsoft Semantic Kernel                                    |
| Document Ingestion | Microsoft Kernel Memory                                      |
| Vector Store       | Azure AI Search (hybrid: vector + semantic ranking)          |
| LLM Providers      | Azure OpenAI + OpenAI (configurable)                        |
| Embedding Model    | text-embedding-3-large (Azure OpenAI or OpenAI)             |
| Database           | SQL Server / PostgreSQL (EF Core)                            |
| File Storage       | Azure Blob Storage                                           |
| Auth               | ASP.NET Core Identity / Microsoft Entra ID                   |
| Evaluation         | LLM-as-Judge (HillPhelmuth.SemanticKernel.LlmAsJudgeEvals)  |
| Logging            | Application Insights + OpenTelemetry                         |

## Key NuGet Packages

```
Microsoft.SemanticKernel
Microsoft.SemanticKernel.Connectors.AzureAISearch
Microsoft.SemanticKernel.Connectors.AzureOpenAI
Microsoft.SemanticKernel.Connectors.OpenAI
Microsoft.KernelMemory.Core
Microsoft.KernelMemory.AzureAISearch
Microsoft.KernelMemory.AzureOpenAI
HillPhelmuth.SemanticKernel.LlmAsJudgeEvals
Microsoft.AspNetCore.SignalR
Azure.Storage.Blobs
Microsoft.EntityFrameworkCore
Microsoft.ApplicationInsights.AspNetCore
```

## Confidence Scoring Strategy (4-Layer)

This is the core differentiator for a legal domain. The system combines **four** confidence mechanisms:

### Layer 1: Chunk-Level Relevance Scoring (Retrieval Quality)
- Each retrieved chunk from Azure AI Search gets a **semantic ranking score**
- Define thresholds: `minRelevanceScore` (e.g., 0.7) and `highConfidenceScore` (e.g., 0.85)
- Require minimum N chunks above `minRelevanceScore` to proceed
- Require minimum M chunks above `highConfidenceScore` for high-confidence answers
- If thresholds not met → refuse to answer, explain insufficient data

### Layer 2: LLM-Based Chunk Evaluation
- For each retrieved chunk, ask a separate LLM call:
  - "Given this chunk and the user's question, rate relevance 0-10 and explain why"
- Filter out chunks scoring below threshold before building the final prompt
- This catches semantic search false positives

### Layer 3: LLM-as-Judge (Response Verification)
- After the main LLM generates a response, run a **separate evaluation LLM call**
- Evaluate on multiple dimensions using `HillPhelmuth.SemanticKernel.LlmAsJudgeEvals`:
  - **Groundedness** (0-5): Is the response fully supported by retrieved context?
  - **Relevance** (0-5): Does it answer the actual question?
  - **Coherence** (0-5): Is the response logically consistent?
  - **Factual Accuracy** (0-5): Are stated facts verifiable from source documents?
- Compute composite confidence score; if below threshold → withhold response

### Layer 4: Citation Verification
- Require the LLM to include inline citations (e.g., `[Lag 2024:123, §4]`)
- Post-processing step verifies each citation exists in the retrieved chunks
- Unverifiable citations are flagged or removed
- If >X% of claims lack citations → reduce confidence or withhold

### Confidence Decision Matrix

| Chunk Score | LLM Judge Score | Citations Valid | Action                              |
| ----------- | --------------- | --------------- | ----------------------------------- |
| High        | High            | Yes             | ✅ Deliver with high confidence      |
| High        | High            | Partial         | ⚠️ Deliver with medium confidence   |
| High        | Low             | Any             | ❌ Withhold — possible hallucination |
| Low         | Any             | Any             | ❌ Withhold — insufficient data      |
| Medium      | High            | Yes             | ⚠️ Deliver with disclaimer          |

## Project Structure

```
GuardianLegalAI/
├── src/
│   ├── GuardianLegalAI.Api/              # ASP.NET Core Web API
│   │   ├── Controllers/                   # (or Minimal API endpoints)
│   │   ├── Hubs/                          # SignalR hubs (ChatHub)
│   │   ├── Middleware/                    # Auth, rate limiting, error handling
│   │   └── Program.cs
│   │
│   ├── GuardianLegalAI.Core/             # Domain models & interfaces
│   │   ├── Models/                        # Chat, Message, Document, User, etc.
│   │   ├── Interfaces/                    # IChatService, IDocumentService, etc.
│   │   └── Enums/
│   │
│   ├── GuardianLegalAI.AI/               # Semantic Kernel & AI logic
│   │   ├── Plugins/                       # SK Plugins (RAG, evaluation)
│   │   │   ├── KnowledgeBasePlugin.cs     # Vector search + retrieval
│   │   │   └── EvaluationPlugin.cs        # Confidence scoring
│   │   ├── Services/
│   │   │   ├── ChatOrchestrationService.cs
│   │   │   ├── ConfidenceScoringService.cs
│   │   │   ├── CitationVerificationService.cs
│   │   │   └── DocumentIngestionService.cs
│   │   ├── Prompts/                       # System prompts (Swedish)
│   │   │   ├── SystemPrompt.txt
│   │   │   ├── ChunkEvaluationPrompt.txt
│   │   │   └── CitationPrompt.txt
│   │   └── Configuration/
│   │       ├── AISettings.cs
│   │       └── ConfidenceThresholds.cs
│   │
│   ├── GuardianLegalAI.Infrastructure/   # Data access & external services
│   │   ├── Data/                          # EF Core DbContext, migrations
│   │   ├── Repositories/
│   │   ├── Search/                        # Azure AI Search integration
│   │   └── Storage/                       # Azure Blob Storage
│   │
│   └── GuardianLegalAI.Web/              # React frontend (separate project)
│       ├── src/
│       │   ├── components/
│       │   │   ├── chat/                  # Chat UI components
│       │   │   ├── documents/             # Document upload/management
│       │   │   └── admin/                 # Admin dashboard
│       │   ├── hooks/                     # useChat, useSignalR
│       │   ├── services/                  # API client
│       │   └── App.tsx
│       └── package.json
│
├── tests/
│   ├── GuardianLegalAI.AI.Tests/          # AI service unit tests
│   ├── GuardianLegalAI.Api.Tests/         # API integration tests
│   └── GuardianLegalAI.Infrastructure.Tests/
│
└── GuardianLegalAI.sln
```

## Implementation Todos

### Phase 1: Project Foundation
1. **project-setup** — Create .NET solution structure with all projects, add NuGet packages, configure DI
2. **database-schema** — Design and create EF Core entities (User, Chat, Message, Document, KnowledgeFile, TokenUsage, KBInvocation, ConfidenceLog)
3. **auth-setup** — Configure ASP.NET Core Identity with role-based access (Admin, Guardian)
4. **config-system** — Create strongly-typed configuration for AI settings, thresholds, providers

### Phase 2: Document Ingestion Pipeline
5. **blob-storage** — Implement Azure Blob Storage service for document upload/download
6. **document-ingestion** — Build Kernel Memory ingestion pipeline: upload → chunk → embed → index into Azure AI Search
7. **multi-index-search** — Configure multiple Azure AI Search indexes (laws, legal-cases, books, other) with appropriate schemas
8. **ingestion-api** — Create API endpoints for document upload, status tracking, and management

### Phase 3: RAG & Chat Core
9. **sk-kernel-setup** — Configure Semantic Kernel with dual provider support (Azure OpenAI + OpenAI), register plugins
10. **rag-plugin** — Build KnowledgeBasePlugin for Semantic Kernel: vector search across multiple indexes, chunk retrieval, result formatting
11. **chat-orchestration** — Build ChatOrchestrationService: manages conversation flow, tool calling (agentic loop), message persistence
12. **signalr-streaming** — Implement SignalR hub for real-time response streaming to frontend
13. **system-prompts** — Design Swedish-language system prompts for the guardian legal assistant persona

### Phase 4: Confidence Scoring (Critical)
14. **chunk-scoring** — Implement Layer 1: chunk-level relevance scoring with configurable thresholds (min chunks, min score)
15. **llm-chunk-eval** — Implement Layer 2: LLM-based chunk evaluation (separate LLM call per chunk to assess relevance)
16. **llm-as-judge** — Implement Layer 3: LLM-as-Judge response verification (groundedness, relevance, coherence, factual accuracy)
17. **citation-verification** — Implement Layer 4: citation extraction, validation against source chunks, and unverifiable citation handling
18. **confidence-aggregation** — Build composite confidence scoring: combine all 4 layers into final score + decision (deliver/withhold/disclaimer)
19. **confidence-config** — Create configurable profiles for confidence thresholds (like current Lena profiles)

### Phase 5: API & Frontend
20. **chat-api** — Build chat API endpoints (create chat, send message, get history, get messages)
21. **document-api** — Build document management API (list, delete, reprocess)
22. **admin-api** — Build admin endpoints (user management, profile configuration, analytics)
23. **react-frontend** — Build React chat UI with SignalR streaming, confidence indicators, citation display
24. **admin-dashboard** — Build admin dashboard: document management, confidence analytics, usage metrics

### Phase 6: Observability & Production Readiness
25. **telemetry** — Integrate Application Insights + OpenTelemetry for tracing, metrics, and logging
26. **rate-limiting** — Implement per-user rate limiting and token budget tracking
27. **kb-invocation-logging** — Log all knowledge base invocations with quality metrics for analytics
28. **testing** — Write unit tests for confidence scoring, integration tests for RAG pipeline
29. **deployment** — Configure Azure deployment (App Service / Container Apps), CI/CD pipeline

## Key Design Decisions

### 1. Kernel Memory vs Custom Pipeline
Use **Microsoft Kernel Memory** for document ingestion — it handles chunking, embedding, and Azure AI Search indexing out of the box. Custom pipeline would only be needed for very specific chunking strategies for legal documents.

### 2. SignalR for Streaming
Use SignalR instead of Server-Sent Events for response streaming — better .NET integration, bi-directional communication, and built-in reconnection handling.

### 3. Confidence Scoring as a Pipeline
The 4-layer confidence scoring runs as a **pipeline** (not parallel) because each layer can short-circuit:
```
Chunk Retrieval → [Layer 1: Score check] → [Layer 2: LLM eval] → Generate Response → [Layer 3: Judge] → [Layer 4: Citations] → Deliver/Withhold
```
If Layer 1 fails (insufficient relevant chunks), skip everything else → fast rejection.

### 4. Separate Evaluation LLM
Use a **different** (possibly cheaper/faster) LLM for evaluation tasks (chunk scoring, LLM-as-judge) than the main response generation. This reduces cost and avoids the model evaluating its own output.

### 5. Swedish-Language Considerations
- System prompts in Swedish
- Chunk evaluation prompts should handle Swedish text
- Citation patterns for Swedish legislation (e.g., "SFS 2024:123", "FB 12 kap. 2 §")

## Existing System Insights (from kb-fastapi-document-processor & kb-fastapi-embedding-service)

The current KB platform already has a production document processing pipeline. The following insights from analyzing `kb-fastapi-document-processor` and `kb-fastapi-embedding-service-main` should inform the Guardian Legal AI implementation.

### Current Pipeline Architecture

The existing system implements a **6-stage pipeline**: S3 Download → Partition → Clean → Chunk → Embed → Index.

| Stage       | Implementation                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Download    | AWS S3 via `boto3` with retry/backoff, content hash from S3 metadata (`x-amz-meta-filehash`)  |
| Partition   | `unstructured` library — PDF (auto strategy + Swedish OCR), DOCX, DOC (via LibreOffice), TXT  |
| Clean       | Unicode quote replacement, `clean_non_ascii_chars`, broken paragraph grouping, symbol filtering |
| Chunk       | 6 configurable presets (SET_A–SET_E + CUSTOM), `basic` and `by_title` strategies               |
| Embed       | `KBLab/sentence-bert-swedish-cased` (768 dimensions), batch processing with retry              |
| Index       | Upstash Vector — 4 category-specific indexes: books, laws, legalcases, other                   |

A standalone **embedding microservice** (`kb-fastapi-embedding-service-main`) also exists, serving the same Swedish BERT model via a POST `/embed` endpoint with a 5000-char limit.

### Migration Considerations

#### 1. Embedding Model: Swedish BERT → text-embedding-3-large
- All existing vectors in Upstash are **768-dimensional** from `KBLab/sentence-bert-swedish-cased`
- The Guardian plan uses `text-embedding-3-large` (3072 dimensions by default, configurable)
- **Migration options**: (a) re-embed all documents with the new model, (b) run a dual-index period, or (c) use dimensionality mapping (not recommended for accuracy)
- The Swedish BERT model is specifically trained on Swedish text — evaluate whether `text-embedding-3-large` handles Swedish legal terminology with comparable quality before committing to migration

#### 2. Vector Store: Upstash → Azure AI Search
- The existing **4 category-specific indexes** (books, laws, legalcases, other) pattern is proven and maps directly to the Guardian plan's `multi-index-search` (todo #7)
- Upstash uses simple vector similarity; Azure AI Search adds **hybrid search** (vector + keyword + semantic ranking) — a significant quality improvement for legal retrieval
- Metadata stored per-vector in Upstash (document_id, chunk_id, chunk_index, knowledge_category, text) should carry over to Azure AI Search index schemas

#### 3. Storage: AWS S3 → Azure Blob Storage
- Current system uses S3 user-defined metadata (`x-amz-meta-category`, `x-amz-meta-filehash`) for category routing and deduplication
- Azure Blob Storage supports equivalent metadata headers — same pattern applies
- Content hashing for deduplication is a valuable pattern to preserve

### Chunking Strategy Learnings

The existing system has **6 battle-tested chunking configurations** worth studying:

| Preset | Max Chars | Preferred Size | Overlap | Strategy  | Use Case                              |
| ------ | --------- | -------------- | ------- | --------- | ------------------------------------- |
| SET_A  | 12,000    | 3,000          | 300     | basic     | Granular chunks, higher precision     |
| SET_B  | 24,000    | 6,000          | 600     | basic     | Larger chunks, more context           |
| SET_C  | 16,000    | 4,000          | 150     | basic     | Minimal overlap, storage efficiency   |
| SET_D  | 20,000    | 5,000          | 400     | by_title  | Semantic boundary chunking            |
| SET_E  | 8,000     | 2,000          | 200     | basic     | Small chunks, maximum precision       |
| CUSTOM | variable  | variable       | variable| variable  | Dynamic/experimental                  |

**Recommendations for Guardian**:
- **SET_D (`by_title`)** is likely best for legal documents where section/chapter headings define natural semantic boundaries (e.g., Swedish legislation structured by "kap." and "§")
- Even if using Kernel Memory's built-in chunking, consider custom chunking strategies for legal-specific document structures
- The `output.json` sample shows SET_A producing ~3,093 avg char chunks with Swedish text — use as a baseline for comparison
- Kernel Memory's default chunking may not be optimal for Swedish legal documents; benchmark against these existing presets

### Swedish-Specific Processing Notes

The current pipeline includes critical Swedish text handling that must not be lost:

1. **OCR Language**: PDF partitioning uses `languages: ["swe"]` for Swedish OCR fallback — essential for scanned legal documents
2. **Unicode Cleaning**: `replace_unicode_quotes` + `clean_non_ascii_chars` — handles Swedish characters (å, ä, ö) properly
3. **Broken Paragraphs**: `group_broken_paragraphs` reconstructs paragraphs split across pages — critical for legal text where paragraphs span multiple pages
4. **Element Filtering**: Removes empty elements and symbol-only elements (common artifacts in scanned legal PDFs)
5. **Citation Patterns**: Swedish legislation follows specific formats (e.g., "SFS 2024:123", "FB 12 kap. 2 §") — the current system doesn't parse these, but the Guardian plan's Layer 4 citation verification must handle them

### Processing Status Tracking Pattern

The existing `ibben_lena_knowledge_files` PostgreSQL table tracks per-document processing with:
- `processing_status` (downloading, partitioning, cleaning, chunking, embedding, indexing, completed, failed)
- `current_stage_progress` (JSON: stage, progress %, message, timestamp)
- `chunk_metrics` (JSON: avg/max/min sizes, total chunks, config used)
- `embedding_results` (JSON: model, dimensions, sample chunks)
- `indexing_results` (JSON: indexed/failed counts, stats)
- `processing_time` (JSON: per-stage timing breakdown)
- `error_message` and `processing_message`

This pattern provides excellent observability and should inform the Guardian plan's `Document` and `KnowledgeFile` EF Core entities (todo #2: database-schema). Consider including similar granular stage tracking and metrics in the Guardian schema.

### Architectural Observations

1. **Decoupled embedding service**: The standalone embedding microservice pattern proves useful for independent scaling. Consider whether the Guardian system needs a similar separation, or if Kernel Memory's built-in embedding is sufficient.
2. **Batch processing with retry**: The current embedder processes chunks in batches of 32 with 3 retries and exponential backoff — a robust pattern to replicate.
3. **5-minute timeout**: The document processing endpoint has a 300-second timeout. Legal documents (especially large PDFs with OCR) can be slow — the Guardian system should handle long-running ingestion asynchronously.
4. **Category-based routing**: S3 metadata determines which vector index receives the chunks. The Guardian system should implement equivalent routing logic in the Kernel Memory pipeline or Azure AI Search indexing.

## References

- [Semantic Kernel Documentation](https://learn.microsoft.com/en-us/semantic-kernel/)
- [Azure AI Search RAG Overview](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview)
- [Kernel Memory](https://github.com/microsoft/kernel-memory)
- [LLM-as-Judge Eval Plugins](https://github.com/HillPhelmuth/LlmAsJudgeEvalPlugins)
- [Agentic RAG with SK + Azure AI Search](https://github.com/rdsiva/implementing-agentic-rag-with-semantic-kernel-and-azure-ai-search)
- [Azure AI Search Chunking Techniques](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents)
