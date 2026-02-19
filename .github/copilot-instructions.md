# KB Project — Copilot Instructions

## Architecture

This project follows **Clean Architecture** with **DDD** and **CQRS** patterns.

### Solution Structure

```
KB.Domain          — Entities, enums, interfaces, value objects (no dependencies)
KB.Core            — Use cases, CQRS handlers, Result pattern (depends on Domain)
KB.Infrastructure  — EF Core, Dapper, interceptors, events (depends on Domain + Core)
KB.Operations      — Data seeding, migration tasks (depends on Domain + Core + Infrastructure)
KB.Server          — ASP.NET Core API host, DI wiring (depends on Domain + Core + Infrastructure)
kb.client          — React + Vite SPA frontend
```

### Dependency Rule

Dependencies point **inward only**. Domain has zero project dependencies. Never reference outer layers from inner layers.

---

## Domain Layer (KB.Domain)

### Entities

- All entities inherit from `DomainEntity<TId>` (in `KB.Domain.Abstract`)
- Aggregate roots implement `IAggregateRoot` (marker interface)
- Standard pattern: `DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable`
- **Constructors and methods must NOT throw exceptions or validate parameters**
- Validation belongs in command/query handlers in the Core layer
- Entities provide query methods (e.g., `CanBePublished()`, `IsExpired()`) for handlers to check

### Property Patterns

```csharp
// Required properties — protected setter, initialized with default!
public string Name { get; protected set; } = default!;

// Optional properties — nullable
public string? Description { get; protected set; }

// Collections — get-only with empty initialization
public ICollection<ChildEntity> Children { get; } = [];

// Navigation properties — protected setter, initialized with default!
public ParentEntity Parent { get; protected set; } = default!;

// Foreign keys — protected setter
public Guid ParentId { get; protected set; }

// Enum properties — protected setter
public OrderStatus Status { get; protected set; }
```

### Aggregate Root Pattern

- Only aggregate roots have repositories — child entities do NOT
- To create/update/delete a child entity, add a method to the aggregate root
- EF Core persists child entities when the aggregate root is saved via `UpdateAsync`
- Do NOT create repositories for child entities or use `DbContext.Set<ChildEntity>()` directly

### Interfaces

- Repository interfaces live in `KB.Domain.Interfaces.Repositories`
- `IReadRepository<T>` for read-only operations (query handlers)
- `IRepository<T>` extends `IReadRepository<T>` for full CRUD (command handlers)
- Custom repository interfaces extend `IRepository<T>` for domain-specific queries

---

## Core Layer (KB.Core)

### CQRS Pattern

- **Commands** modify state (create, update, delete) — implement `IValidatableObject`
- **Queries** retrieve data without modification — implement `IValidatableObject`
- **Handlers** are `sealed class` with primary constructors, registered as scoped services

### Result Pattern

- All handlers return `Result<T>` or `Result` (never throw exceptions for flow control)
- For error responses, always use the non-generic `Result` factory methods:
  ```csharp
  // ✅ Correct
  return Result.NotFound($"Entity with ID {request.Id} not found.");
  // ❌ Incorrect
  return Result<EntityViewModel>.NotFound(...);
  ```

### Handler Execution Order

1. Null check — `ArgumentNullException.ThrowIfNull(request)`
2. Validation — `ValidationHelper.Validate(request)`
3. Data retrieval — Get entities from repository
4. Existence check — Return `Result.NotFound()` if entity is null
5. Permission check — Return `NotFound` (not `Forbidden`) to prevent information disclosure
6. Business rule validation — Check entity state using query methods
7. Domain operations — Call entity methods to change state
8. Persistence — Save changes via repository
9. Response — Map and return result

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Command | Imperative verb + `Command` | `CreateOrderCommand` |
| Query | Descriptive name + `Query` | `GetOrderByIdQuery` |
| Handler | Match command/query + `Handler` | `CreateOrderCommandHandler` |
| View Model | Descriptive noun + `ViewModel` | `OrderViewModel` |

### Folder Structure

```
KB.Core/Features/{Feature}/{Action}/CommandOrQuery.cs + Handler.cs
KB.Core/Features/{Feature}/SharedViewModel.cs
```

---

## Infrastructure Layer (KB.Infrastructure)

### EF Core Conventions

- One `IEntityTypeConfiguration<T>` class per entity in `Data/Configurations/`
- Always add `.HasQueryFilter(e => !e.IsDeleted)` for soft-deletable entities
- Always configure enum properties with `.HasConversion<string>()` and `.HasMaxLength()`
- Always specify `HasMaxLength()` for string properties
- Do NOT use `.IsRequired()` on non-nullable properties (EF Core infers it)

### Interceptors

- `AuditingInterceptor` — auto-populates CreatedAt/CreatedBy/UpdatedAt/UpdatedBy
- `SoftDeleteInterceptor` — converts Delete operations to soft-delete updates

### EF Core Migrations

Run from the solution root:
```
dotnet ef migrations add MigrationName --project KB.Infrastructure --startup-project KB.Operations --output-dir Data/Migrations
dotnet ef migrations remove --project KB.Infrastructure --startup-project KB.Operations
dotnet ef database update --project KB.Infrastructure --startup-project KB.Operations
```

---

## API Layer (KB.Server)

### Endpoints

- Minimal API endpoints are `internal static class` with extension methods on `IEndpointRouteBuilder`
- Request models are `internal sealed record` co-located with the endpoint file
- Results are converted to HTTP responses via `result.ToHttpResult()` or `result.ToActionResult()`

---

## Code Style Rules

| Rule | Convention |
|------|-----------|
| Namespaces | File-scoped (`namespace X;`) |
| Constructors | Primary constructor syntax for handlers and services |
| Properties (entities) | `protected set` always |
| Properties (interface impl) | `public set` for IAuditable/ISoftDeletable |
| Collections | `ICollection<T> Prop { get; } = [];` |
| Commands/Queries | `sealed class` implementing `IValidatableObject` |
| Handlers | `sealed class` with primary constructor |
| View Models | `sealed record` with positional parameters |
| Request Models | `internal sealed record` co-located with endpoint |
| Endpoints | `internal static class` with extension method |
| Instance fields | `_camelCase` prefix |
| Classes | PascalCase |
| One class per file | File name matches class name |
| No section comments | Do NOT add organizational comments in entities |

## Testing

- Framework: xUnit, Mocking: NSubstitute
- AAA pattern (Arrange-Act-Assert)
- Factory methods for test objects: `CreateHandler()`, `CreateValidCommand()`, `CreateEntity()`
- Test class: `{HandlerName}Tests`
- Test method: `Handle_{Scenario}_{ExpectedOutcome}`
