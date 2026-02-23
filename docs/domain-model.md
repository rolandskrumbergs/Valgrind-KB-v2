# KB Platform — Domain Model Reference

This document defines every entity, enum, value object, and their relationships in the new system. Use this as the authoritative reference when implementing domain entities, EF Core configurations, and CQRS handlers.

---

## Bounded Contexts

```
┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐
│   Identity       │  │  Organization     │  │  Conversation     │
│   ─────────      │  │  ────────────     │  │  ────────────     │
│   ApplicationUser│  │  Organization     │  │  Conversation     │
│   RefreshToken   │  │  Subscription     │  │  ConversationMsg  │
│                  │  │                   │  │  MessageFeedback  │
│                  │  │                   │  │  UsageRecord      │
│                  │  │                   │  │  ConversationStart│
└─────────────────┘  └──────────────────┘  └───────────────────┘

┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐
│   AI             │  │  KnowledgeBase    │  │  Content          │
│   ──             │  │  ──────────────   │  │  ───────          │
│   AiProfile      │  │  Document         │  │  Article          │
│   AiInvocation   │  │                   │  │                   │
└─────────────────┘  └──────────────────┘  └───────────────────┘

┌─────────────────┐  ┌──────────────────┐
│   Education      │  │  Device           │
│   ─────────      │  │  ──────           │
│   Course         │  │  DeviceRegistration│
│   Chapter        │  │                   │
│   Question       │  └──────────────────┘
│   QuestionOption │
│   OrganizationCourse│  ┌──────────────┐
│   Enrollment     │  │  Purchase       │
│   QuestionAnswer │  │  ────────       │
└─────────────────┘  │  Purchase        │
                     └──────────────────┘
```

---

## Entity Definitions

### Identity Context

#### ApplicationUser (extends IdentityUser\<Guid\>)
> **Special**: Not a DomainEntity — extends ASP.NET Core Identity's IdentityUser.

| Property | Type | Notes |
|----------|------|-------|
| Id | Guid | PK (Identity default) |
| Email | string | Identity default |
| FirstName | string | Required |
| LastName | string | Required |
| SecurityNumber | string? | Optional — Swedish personnummer |
| Role | UserRole (enum) | Admin, User |
| IsBanned | bool | Default false |
| BanReason | string? | |
| BanExpiresAt | DateTimeOffset? | Nullable = permanent ban |
| IsInvited | bool | Default false |
| InvitationAcceptedAt | DateTimeOffset? | |
| MustResetPassword | bool | Default false — true for migrated users |
| LegacyUserId | string? | Reference to old system for data migration |
| CreatedAt | DateTimeOffset | |
| UpdatedAt | DateTimeOffset | |

#### RefreshToken : DomainEntity\<Guid\>, IAggregateRoot

| Property | Type | Notes |
|----------|------|-------|
| UserId | Guid | FK → ApplicationUser |
| Token | string | Hashed value |
| ExpiresAt | DateTimeOffset | 30-day lifetime |
| RevokedAt | DateTimeOffset? | Null = active |
| ReplacedByToken | string? | For rotation chain tracking |
| CreatedAt | DateTimeOffset | |

### Organization Context

#### Organization : DomainEntity\<Guid\>, IAggregateRoot, ISoftDeletable, IAuditable

| Property | Type | Notes |
|----------|------|-------|
| Name | string | Required |
| ContactInfo | string? | JSON or structured |
| InvoiceInfo | string? | JSON or structured |
| MaxSeats | int | Replaces "licenses" count |
| IsActive | bool | Default true |

**Children**: `ICollection<Subscription> Subscriptions { get; } = [];`

#### Subscription : DomainEntity\<Guid\>, IAuditable

| Property | Type | Notes |
|----------|------|-------|
| OrganizationId | Guid | FK → Organization |
| UserId | Guid? | FK → ApplicationUser, nullable = unassigned seat |
| IsActive | bool | |
| ActivatedAt | DateTimeOffset? | |
| DeactivatedAt | DateTimeOffset? | |

**Unique constraint**: (UserId, OrganizationId)

### Conversation Context

#### Conversation : DomainEntity\<Guid\>, IAggregateRoot, IAuditable

| Property | Type | Notes |
|----------|------|-------|
| UserId | Guid | FK → ApplicationUser |
| Title | string? | |
| AiProfileId | Guid? | FK → AiProfile (snapshot reference) |

**Children**: `ICollection<ConversationMessage> Messages { get; } = [];`

#### ConversationMessage : DomainEntity\<Guid\>

| Property | Type | Notes |
|----------|------|-------|
| ConversationId | Guid | FK → Conversation |
| Role | MessageRole (enum) | System, User, Assistant, Tool |
| Content | string? | Plain text content |
| Parts | string? | JSON — structured parts for tool calls |
| AiProfileSnapshot | string? | JSON — profile config at time of message |
| CreatedAt | DateTimeOffset | |

#### MessageFeedback : DomainEntity\<Guid\>

| Property | Type | Notes |
|----------|------|-------|
| ConversationId | Guid | FK → Conversation |
| MessageId | Guid | FK → ConversationMessage |
| UserId | Guid | FK → ApplicationUser |
| IsPositive | bool | Thumbs up/down |
| CreatedAt | DateTimeOffset | |

#### UsageRecord : DomainEntity\<Guid\>

| Property | Type | Notes |
|----------|------|-------|
| UserId | Guid | FK → ApplicationUser |
| ConversationId | Guid? | FK → Conversation |
| MessageId | Guid? | FK → ConversationMessage |
| PromptTokens | int | |
| CompletionTokens | int | |
| TotalTokens | int | |
| Model | string | LLM model name |
| AiProfileSnapshot | string? | JSON |
| CreatedAt | DateTimeOffset | |

#### ConversationStarter : DomainEntity\<Guid\>, IAggregateRoot

| Property | Type | Notes |
|----------|------|-------|
| Text | string | Required |
| SortOrder | int | |
| IsActive | bool | Default true |
| CreatedAt | DateTimeOffset | |

### AI Context

#### AiProfile : DomainEntity\<Guid\>, IAggregateRoot, IAuditable

| Property | Type | Notes |
|----------|------|-------|
| Name | string | Unique |
| IsActive | bool | |
| Model | string | LLM model name (e.g., "gpt-4o") |
| TopK | int | Number of chunks to retrieve |
| MinRelevanceThreshold | decimal | Minimum chunk relevance score (0-1) |
| MinRelevanceChunksRequired | int | Min chunks above threshold |
| HighConfidenceThreshold | decimal | High-confidence chunk score |
| HighConfidenceChunksRequired | int | Min high-confidence chunks |
| CreatedByUserId | Guid | FK → ApplicationUser |
| UpdatedByUserId | Guid | FK → ApplicationUser |

#### AiInvocation : DomainEntity\<Guid\>

| Property | Type | Notes |
|----------|------|-------|
| ConversationId | Guid | FK → Conversation |
| MessageId | Guid | FK → ConversationMessage |
| UserId | Guid | FK → ApplicationUser |
| SearchQuery | string | |
| ConversationSummary | string? | |
| Outcome | InvocationOutcome (enum) | Success, InsufficientData, Error |
| OutcomeReason | string? | |
| RetrievedChunks | string? | JSON |
| QualityMetrics | string? | JSON |
| InputTokens | int | |
| OutputTokens | int | |
| Model | string | |
| AiProfileSnapshot | string? | JSON |
| CreatedAt | DateTimeOffset | |

### KnowledgeBase Context

#### Document : DomainEntity\<Guid\>, IAggregateRoot, IAuditable

| Property | Type | Notes |
|----------|------|-------|
| FileName | string | |
| FileSize | long | Bytes |
| ContentType | string | MIME type |
| Category | KnowledgeCategory (enum) | Books, Laws, LegalCases, Other |
| BlobPath | string | Azure Blob Storage path |
| ContentHash | string | SHA-256, unique for dedup |
| ChunkingPreset | string? | e.g., "set_a", "set_d" |
| ProcessingStatus | ProcessingStatus (enum) | Uploaded, Processing, Completed, Failed |
| ProcessingProgress | string? | JSON — {stage, progress%, message} |
| ProcessingMetrics | string? | JSON — per-stage timing, chunk stats |
| ErrorMessage | string? | |
| TotalChunks | int | |
| IndexedChunks | int | |
| FailedChunks | int | |
| UploadedByUserId | Guid | FK → ApplicationUser |

### Content Context

#### Article : DomainEntity\<Guid\>, IAggregateRoot, ISoftDeletable, IAuditable

| Property | Type | Notes |
|----------|------|-------|
| Title | string | Required |
| Content | string? | HTML from TipTap |
| FeaturedImagePath | string? | Azure Blob path |
| Attachments | string? | JSON — [{fileName, blobPath, fileSize}] |
| Status | PublishStatus (enum) | Draft, Published |
| ExcludedOrganizationIds | string? | JSON — list of Guid |
| AuthorUserId | Guid | FK → ApplicationUser |
| PublishedAt | DateTimeOffset? | |

### Education Context

#### Course : DomainEntity\<Guid\>, IAggregateRoot, ISoftDeletable, IAuditable
**Aggregate root** — owns Chapters, which own Questions → QuestionOptions.

| Property | Type | Notes |
|----------|------|-------|
| Title | string | |
| Description | string? | |
| ImagePath | string? | Azure Blob path |
| Price | decimal | |
| Currency | string | e.g., "SEK" |
| Status | PublishStatus (enum) | Draft, Published |
| CertificateEnabled | bool | Default false |
| CreatedByUserId | Guid | FK → ApplicationUser |

**Children**: `ICollection<Chapter> Chapters { get; } = [];`

#### Chapter : DomainEntity\<Guid\>

| Property | Type | Notes |
|----------|------|-------|
| CourseId | Guid | FK → Course |
| Title | string | |
| Description | string? | |
| VideoUrl | string? | |
| SortOrder | int | |

**Children**: `ICollection<Question> Questions { get; } = [];`

#### Question : DomainEntity\<Guid\>

| Property | Type | Notes |
|----------|------|-------|
| ChapterId | Guid | FK → Chapter |
| Type | QuestionType (enum) | MultipleChoice |
| Text | string | |
| Description | string? | |
| Feedback | string? | Displayed after answering |

**Children**: `ICollection<QuestionOption> Options { get; } = [];`

#### QuestionOption : DomainEntity\<Guid\>

| Property | Type | Notes |
|----------|------|-------|
| QuestionId | Guid | FK → Question |
| Text | string | |
| IsCorrect | bool | |
| SortOrder | int | |

#### OrganizationCourse (join entity)

| Property | Type | Notes |
|----------|------|-------|
| OrganizationId | Guid | PK, FK → Organization |
| CourseId | Guid | PK, FK → Course |
| SharedByUserId | Guid | FK → ApplicationUser |
| CreatedAt | DateTimeOffset | |

#### Enrollment : DomainEntity\<Guid\>, IAggregateRoot, IAuditable

| Property | Type | Notes |
|----------|------|-------|
| UserId | Guid | FK → ApplicationUser |
| CourseId | Guid | FK → Course |
| OrganizationId | Guid? | FK → Organization, null = self-enrolled |
| Status | EnrollmentStatus (enum) | NotStarted, InProgress, Completed |
| AccessType | AccessType (enum) | Free, Purchase, Organization |
| LastChapterId | Guid? | FK → Chapter |
| CompletedAt | DateTimeOffset? | |
| CertificateId | string? | Unique |

**Unique constraint**: (UserId, CourseId)

#### QuestionAnswer (join entity)

| Property | Type | Notes |
|----------|------|-------|
| UserId | Guid | PK, FK → ApplicationUser |
| QuestionId | Guid | PK, FK → Question |
| SelectedOptionId | Guid | FK → QuestionOption |
| CreatedAt | DateTimeOffset | |
| UpdatedAt | DateTimeOffset | |

### Purchase Context

#### Purchase : DomainEntity\<Guid\>, IAggregateRoot

| Property | Type | Notes |
|----------|------|-------|
| UserId | Guid | FK → ApplicationUser |
| Type | PurchaseType (enum) | Course, ChatTokens |
| CourseId | Guid? | FK → Course, for Course type |
| TokenAmount | int? | For ChatTokens type |
| Price | decimal | |
| PriceInLocalCurrency | decimal | |
| Currency | string | |
| Source | string | e.g., "revenuecat" |
| TransactionId | string | |
| CreatedAt | DateTimeOffset | |

### Device Context

#### DeviceRegistration : DomainEntity\<Guid\>, IAggregateRoot

| Property | Type | Notes |
|----------|------|-------|
| UserId | Guid | FK → ApplicationUser |
| PushToken | string | Unique — Expo push token |
| Platform | string | "ios" or "android" |
| AppVersion | string? | |
| CreatedAt | DateTimeOffset | |
| UpdatedAt | DateTimeOffset | |

---

## Enums

```csharp
public enum UserRole { Admin, User }
public enum MessageRole { System, User, Assistant, Tool }
public enum InvocationOutcome { Success, InsufficientData, Error }
public enum KnowledgeCategory { Books, Laws, LegalCases, Other }
public enum ProcessingStatus { Uploaded, Processing, Completed, Failed }
public enum PublishStatus { Draft, Published }
public enum QuestionType { MultipleChoice }
public enum EnrollmentStatus { NotStarted, InProgress, Completed }
public enum AccessType { Free, Purchase, Organization }
public enum PurchaseType { Course, ChatTokens }
```

---

## Aggregate Root Boundaries

Only aggregate roots have repositories. Child entities are managed through their aggregate root.

| Aggregate Root | Children (managed via root) |
|----------------|---------------------------|
| Organization | Subscription |
| Conversation | ConversationMessage, MessageFeedback |
| Course | Chapter → Question → QuestionOption |
| AiProfile | (none) |
| Article | (none) |
| Document | (none) |
| Enrollment | (none) |
| ConversationStarter | (none) |
| Purchase | (none) |
| DeviceRegistration | (none) |
| RefreshToken | (none) |
| AiInvocation | (none) |
| UsageRecord | (none) |

---

## EF Core Configuration Notes

- All string properties: specify `HasMaxLength()`
- All enum properties: `.HasConversion<string>().HasMaxLength(50)`
- All JSON properties: store as `text` or `jsonb` (PostgreSQL)
- Soft-deletable entities: `.HasQueryFilter(e => !e.IsDeleted)`
- Non-nullable properties: do NOT use `.IsRequired()` (EF Core infers)
- Guid PKs: use `ValueGeneratedOnAdd()` with `Guid.CreateVersion7()` or database default
- Unique constraints: use `HasIndex().IsUnique()`
- Composite PKs (join entities): use `HasKey(e => new { e.X, e.Y })`
