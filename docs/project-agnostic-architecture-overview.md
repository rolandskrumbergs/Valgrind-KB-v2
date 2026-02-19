# Clean Architecture & DDD — Project Blueprint

A comprehensive, project-agnostic guide for building .NET backend applications using Clean Architecture, Domain-Driven Design (DDD), CQRS, and the patterns documented below. Use this as a blueprint to set up new projects from scratch.

---

## Table of Contents

- [1. Solution Structure](#1-solution-structure)
- [2. Domain Layer](#2-domain-layer)
- [3. Core Layer (Application)](#3-core-layer-application)
- [4. Infrastructure Layer](#4-infrastructure-layer)
- [5. API Layer](#5-api-layer)
- [6. Cross-Cutting Concerns](#6-cross-cutting-concerns)
- [7. Testing Patterns](#7-testing-patterns)
- [8. EditorConfig Template](#8-editorconfig-template)

---

## 1. Solution Structure

### Layer Overview

```
src/
    MyProject.Domain          # Domain entities, interfaces, and business rules
    MyProject.Core            # Application business logic and use cases (CQRS)
    MyProject.Infrastructure  # External concerns (database, email, AI, storage)
    MyProject.API             # API endpoints and HTTP concerns
    MyProject.Operations      # Operational tools and utilities (migrations, seeding)

tests/
    MyProject.Domain.Tests
    MyProject.Core.Tests
    MyProject.Infrastructure.Tests
    MyProject.API.Tests
```

### Layer Dependencies

```
MyProject.API
  ├─ MyProject.Infrastructure
  │   ├─ MyProject.Core
  │   │   └─ MyProject.Domain   ← No dependencies (pure domain logic)
  │   └─ MyProject.Domain
  └─ MyProject.Core
      └─ MyProject.Domain
```

**Key Rule:** The Domain layer has **zero dependencies** on other projects. Dependencies point inward.

### Central Package Management

All NuGet package versions are managed centrally via `Directory.Packages.props` at the solution root:

```xml
<!-- Directory.Packages.props -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.3" />
    <PackageVersion Include="Dapper" Version="2.1.66" />
    <PackageVersion Include="xunit" Version="2.9.3" />
    <PackageVersion Include="NSubstitute" Version="5.3.0" />
    <!-- Add all package versions here -->
  </ItemGroup>
</Project>
```

Individual `.csproj` files reference packages **without versions**:
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" />
```

### Code Analysis Enforcement

```xml
<!-- Directory.Build.props -->
<Project>
  <PropertyGroup>
    <ImportDirectoryBuildProps>false</ImportDirectoryBuildProps>
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
    <AnalysisMode>All</AnalysisMode>
    <AnalysisLevel>latest</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  </PropertyGroup>
</Project>
```

### Project File Templates

**Domain (class library, no dependencies):**
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

**Core (class library, depends on Domain):**
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\MyProject.Domain\MyProject.Domain.csproj" />
  </ItemGroup>
</Project>
```

**Infrastructure (class library, depends on Core + Domain):**
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" />
    <PackageReference Include="Dapper" />
    <!-- other infrastructure packages -->
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\MyProject.Core\MyProject.Core.csproj" />
    <ProjectReference Include="..\MyProject.Domain\MyProject.Domain.csproj" />
  </ItemGroup>
</Project>
```

**API (web app, depends on Core + Infrastructure):**
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
    <PackageReference Include="Microsoft.Identity.Web" />
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" />
    <PackageReference Include="Microsoft.ApplicationInsights.AspNetCore" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\MyProject.Core\MyProject.Core.csproj" />
    <ProjectReference Include="..\MyProject.Infrastructure\MyProject.Infrastructure.csproj" />
  </ItemGroup>
</Project>
```

---

## 2. Domain Layer

The Domain layer is the heart of the application. It contains entities, value objects, domain events, and repository interfaces. It has **no dependencies** on other projects.

### Folder Structure

```
MyProject.Domain/
    Abstract/
        DomainEntity.cs
        DomainEvent.cs
        ValueObject.cs
    Entities/
        Organization.cs
        Recruitment.cs
        ...
    Enums/
        RecruitmentStatus.cs
        ...
    Events/
        JobApplicationCompletedEvent.cs
        ...
    Interfaces/
        IAggregateRoot.cs
        IAuditable.cs
        ISoftDeletable.cs
        IUserContext.cs
        IDomainEventDispatcher.cs
        Repositories/
            IRepository.cs
            IReadRepository.cs
            IOrganizationRepository.cs
            ...
    ValueObjects/
        SalaryRange.cs
        ...
```

### 2.1 DomainEntity Base Class

All entities inherit from `DomainEntity<TId>`, which provides an `Id` property and domain event support.

```csharp
using System.ComponentModel.DataAnnotations.Schema;

namespace MyProject.Domain.Abstract;

public abstract class DomainEntity
{
    private readonly List<DomainEvent> _domainEvents = [];

    [NotMapped]
    public IEnumerable<DomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void RegisterDomainEvent(DomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public void ClearDomainEvents() => _domainEvents.Clear();
}

public abstract class DomainEntity<TId> : DomainEntity
{
    public TId Id { get; protected set; } = default!;
}
```

### 2.2 Entity Interfaces

**IAggregateRoot** — Marker interface for entities that are repository roots:
```csharp
namespace MyProject.Domain.Interfaces;

public interface IAggregateRoot { }
```

**IAuditable** — Auto-populated by the AuditingInterceptor on SaveChanges:
```csharp
namespace MyProject.Domain.Interfaces;

public interface IAuditable
{
    DateTimeOffset CreatedAt { get; set; }
    Guid CreatedBy { get; set; }
    DateTimeOffset? UpdatedAt { get; set; }
    Guid? UpdatedBy { get; set; }
}
```

**ISoftDeletable** — Auto-populated by the SoftDeleteInterceptor. Entities are never physically deleted:
```csharp
namespace MyProject.Domain.Interfaces;

public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTimeOffset? DeletedAt { get; set; }
    Guid? DeletedBy { get; set; }
}
```

**IUserContext** — Provides current user identity (implemented in the API layer):
```csharp
namespace MyProject.Domain.Interfaces;

public interface IUserContext
{
    Guid AccountObjectId { get; }
    bool IsAdministrator { get; }
}
```

**IDomainEventDispatcher** — Dispatches domain events after SaveChanges:
```csharp
using MyProject.Domain.Abstract;

namespace MyProject.Domain.Interfaces;

public interface IDomainEventDispatcher
{
    Task DispatchAndClearEvents(IEnumerable<DomainEntity> entitiesWithEvents);
}
```

### 2.3 Repository Interfaces

**IReadRepository<T>** — Read-only operations (used by query handlers):
```csharp
namespace MyProject.Domain.Interfaces.Repositories;

public interface IReadRepository<T> where T : class, IAggregateRoot
{
    Task<T?> GetByIdAsync<TId>(TId id, CancellationToken cancellationToken = default) where TId : notnull;
    Task<List<T>> ListAsync(CancellationToken cancellationToken = default);
    Task<bool> AnyAsync(CancellationToken cancellationToken = default);
}
```

**IRepository<T>** — Full read-write operations (used by command handlers):
```csharp
namespace MyProject.Domain.Interfaces.Repositories;

public interface IRepository<T> : IReadRepository<T> where T : class, IAggregateRoot
{
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<int> UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task<int> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<int> DeleteAsync(T entity, CancellationToken cancellationToken = default);
    Task<int> DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

**Custom repository interfaces** extend `IRepository<T>` for domain-specific queries:
```csharp
namespace MyProject.Domain.Interfaces.Repositories;

public interface IOrganizationRepository : IRepository<Organization>
{
    Task<Organization?> GetOrganizationWithInterviewQuestions(Guid id, CancellationToken cancellationToken);
    Task<List<Organization>> GetOrganizationsByOwner(Guid ownerId, CancellationToken cancellationToken);
}
```

### 2.4 DomainEvent Base Class

```csharp
namespace MyProject.Domain.Abstract;

public abstract class DomainEvent
{
    public DateTimeOffset DateOccurred { get; protected set; } = DateTimeOffset.UtcNow;
}
```

**Creating domain events:**
```csharp
namespace MyProject.Domain.Events;

public sealed class OrderCompletedEvent : DomainEvent
{
    public Guid OrderId { get; }

    public OrderCompletedEvent(Guid orderId)
    {
        OrderId = orderId;
    }
}
```

### 2.5 ValueObject Base Class

Value objects are immutable, equality-based objects without identity:

```csharp
namespace MyProject.Domain.Abstract;

[Serializable]
public abstract class ValueObject : IComparable, IComparable<ValueObject>
{
    private int? _cachedHashCode;

    protected abstract IEnumerable<object> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj == null)
            return false;

        if (GetUnproxiedType(this) != GetUnproxiedType(obj))
            return false;

        var valueObject = (ValueObject)obj;
        return GetEqualityComponents().SequenceEqual(valueObject.GetEqualityComponents());
    }

    public override int GetHashCode()
    {
        if (!_cachedHashCode.HasValue)
        {
            _cachedHashCode = GetEqualityComponents()
                .Aggregate(1, (current, obj) =>
                {
                    unchecked
                    {
                        return (current * 23) + (obj?.GetHashCode() ?? 0);
                    }
                });
        }

        return _cachedHashCode.Value;
    }

    public int CompareTo(object? obj)
    {
        if (obj == null)
            return 1;

        var thisType = GetUnproxiedType(this);
        var otherType = GetUnproxiedType(obj);

        if (thisType != otherType)
            return string.Compare(thisType.ToString(), otherType.ToString(), StringComparison.Ordinal);

        var other = (ValueObject)obj;
        var components = GetEqualityComponents().ToArray();
        var otherComponents = other.GetEqualityComponents().ToArray();

        for (var i = 0; i < components.Length; i++)
        {
            var comparison = CompareComponents(components[i], otherComponents[i]);
            if (comparison != 0)
                return comparison;
        }

        return 0;
    }

    private static int CompareComponents(object? object1, object? object2)
    {
        if (object1 is null && object2 is null) return 0;
        if (object1 is null) return -1;
        if (object2 is null) return 1;
        if (object1 is IComparable comparable1 && object2 is IComparable comparable2)
            return comparable1.CompareTo(comparable2);
        return object1.Equals(object2) ? 0 : -1;
    }

    public int CompareTo(ValueObject? other) => CompareTo(other as object);

    public static bool operator ==(ValueObject a, ValueObject b)
    {
        if (a is null && b is null) return true;
        if (a is null || b is null) return false;
        return a.Equals(b);
    }

    public static bool operator !=(ValueObject a, ValueObject b) => !(a == b);

    internal static Type GetUnproxiedType(object obj)
    {
        ArgumentNullException.ThrowIfNull(obj);
        const string EFCoreProxyPrefix = "Castle.Proxies.";
        const string NHibernateProxyPostfix = "Proxy";
        var type = obj.GetType();
        var typeString = type.ToString();
        if (typeString.Contains(EFCoreProxyPrefix, StringComparison.InvariantCulture) ||
            typeString.EndsWith(NHibernateProxyPostfix, StringComparison.InvariantCulture))
            return type.BaseType!;
        return type;
    }

    public static bool operator <(ValueObject left, ValueObject right) =>
        left is null ? !ReferenceEquals(right, null) : left.CompareTo(right) < 0;

    public static bool operator <=(ValueObject left, ValueObject right) =>
        left is null || left.CompareTo(right) <= 0;

    public static bool operator >(ValueObject left, ValueObject right) =>
        left is not null && left.CompareTo(right) > 0;

    public static bool operator >=(ValueObject left, ValueObject right) =>
        left is null ? ReferenceEquals(right, null) : left.CompareTo(right) >= 0;
}
```

**Creating value objects:**
```csharp
using MyProject.Domain.Abstract;

namespace MyProject.Domain.ValueObjects;

public sealed class SalaryRange : ValueObject
{
    public decimal MinAmount { get; private set; }
    public decimal MaxAmount { get; private set; }
    public string Currency { get; private set; }

    private SalaryRange() { }

    public SalaryRange(decimal minAmount, decimal maxAmount, string currency)
    {
        MinAmount = minAmount;
        MaxAmount = maxAmount;
        Currency = currency;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return MinAmount;
        yield return MaxAmount;
        yield return Currency;
    }

    public override string ToString() => $"{MinAmount:N0} - {MaxAmount:N0} {Currency}";
}
```

### 2.6 Entity Patterns

**CRITICAL RULES:**
- Entity constructors and methods must **NOT throw exceptions** or validate parameters
- Constructors only assign properties — no validation
- Methods only change state — no validation or exceptions
- Validation belongs in command/query handlers in the Core layer
- Entities provide query methods (e.g., `CanBePublished()`, `IsExpired()`) for handlers to check business rules

**Standard entity patterns:**

| Pattern | Use When |
|---------|----------|
| `DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable` | Standard aggregate root (most entities) |
| `DomainEntity<Guid>, IAggregateRoot, IAuditable` | Immutable audit-only (permanent records) |
| `DomainEntity<Guid>` | Child entity (owned by another aggregate, no repository) |

**Property patterns:**
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

**Complete entity template:**
```csharp
using MyProject.Domain.Abstract;
using MyProject.Domain.Enums;
using MyProject.Domain.Interfaces;

namespace MyProject.Domain.Entities;

public class Order : DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    public string Title { get; protected set; } = default!;
    public OrderStatus Status { get; protected set; }
    public string? Notes { get; protected set; }

    public Guid CustomerId { get; protected set; }
    public Customer Customer { get; protected set; } = default!;
    public ICollection<OrderLine> Lines { get; } = [];

    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    protected Order() { }

    public Order(Guid customerId, string title, string? notes = null)
    {
        CustomerId = customerId;
        Title = title;
        Notes = notes;
        Status = OrderStatus.Draft;
    }

    public void UpdateTitle(string title)
    {
        Title = title;
    }

    public void Submit()
    {
        Status = OrderStatus.Submitted;
        RegisterDomainEvent(new OrderSubmittedEvent(Id));
    }

    public bool CanBeSubmitted()
    {
        return Status == OrderStatus.Draft && Lines.Count > 0;
    }
}
```

### 2.7 Aggregate Root Pattern

**Child entities must always be managed through their aggregate root:**
- Only aggregate roots have repositories — child entities do NOT
- To create/update/delete a child entity, add a method to the aggregate root
- EF Core persists child entities when the aggregate root is saved via `UpdateAsync`

```csharp
// In the aggregate root entity:
public OrderLine AddLine(Guid productId, int quantity, decimal unitPrice)
{
    var line = new OrderLine(Id, productId, quantity, unitPrice);
    Lines.Add(line);
    return line;
}

// In the command handler:
order.AddLine(request.ProductId, request.Quantity, request.UnitPrice);
await _orderRepository.UpdateAsync(order, cancellationToken);
```

**Do NOT:**
- Create repositories for child entities
- Use `DbContext.Set<ChildEntity>().AddAsync()` directly in handlers
- Bypass the aggregate root when modifying child entities

---

## 3. Core Layer (Application)

The Core layer contains application business logic organized as use cases following CQRS pattern. It depends only on the Domain project.

### Folder Structure

```
MyProject.Core/
    Features/
        Organizations/
            Create/
                CreateOrganizationCommand.cs
                CreateOrganizationCommandHandler.cs
            GetById/
                GetOrganizationByIdQuery.cs
                GetOrganizationByIdQueryHandler.cs
            OrganizationViewModel.cs        # Shared across use cases
        Recruitments/
            Publish/
                PublishRecruitmentCommand.cs
                PublishRecruitmentCommandHandler.cs
    Infrastructure/
        Result.cs
        ResultNonGeneric.cs
        ResultStatus.cs
        ValidationHelper.cs
    Interfaces/
        IEmailService.cs
        ...
    Services/
        ...
    Setup.cs
```

### 3.1 Result Pattern

A custom `Result<T>` / `Result` type for all operation outcomes, replacing exceptions for flow control.

**ResultStatus enum:**
```csharp
namespace MyProject.Core.Infrastructure;

public enum ResultStatus
{
    Ok,
    Created,
    Error,
    Forbidden,
    Unauthorized,
    Invalid,
    NotFound,
    NoContent,
    Conflict,
    CriticalError,
    Unavailable
}
```

**Result\<T\> (generic):**
```csharp
namespace MyProject.Core.Infrastructure;

public record Result<T>
{
    protected Result() { }
    public Result(T value) => Value = value;
    protected internal Result(T value, string successMessage) : this(value) => SuccessMessage = successMessage;
    protected Result(ResultStatus status) => Status = status;

    public static implicit operator T(Result<T> result) => result.Value;
    public static implicit operator Result<T>(T value) => new Result<T>(value);
    public static implicit operator Result<T>(Result result) => new(default(T))
    {
        Status = result.Status,
        Errors = result.Errors,
        SuccessMessage = result.SuccessMessage,
    };

    public T Value { get; init; }
    public ResultStatus Status { get; protected set; } = ResultStatus.Ok;
    public bool IsSuccess => Status is ResultStatus.Ok or ResultStatus.NoContent or ResultStatus.Created;
    public string SuccessMessage { get; protected set; } = string.Empty;
    public IEnumerable<string> Errors { get; protected set; } = [];

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Success(T value, string successMessage) => new(value, successMessage);
    public static Result<T> Created() => new(ResultStatus.Created);
    public static Result<T> Created(T value) => new(ResultStatus.Created) { Value = value };
    public static Result<T> Invalid(params string[] errorMessages) => new(ResultStatus.Invalid) { Errors = errorMessages };
    public static Result<T> Error(string errorMessage) => new(ResultStatus.Error) { Errors = new[] { errorMessage } };
    public static Result<T> Error(params string[] errorMessages) => new(ResultStatus.Error) { Errors = [.. errorMessages] };
    public static Result<T> NotFound() => new(ResultStatus.NotFound);
    public static Result<T> NotFound(params string[] errorMessages) => new(ResultStatus.NotFound) { Errors = errorMessages };
    public static Result<T> Forbidden() => new(ResultStatus.Forbidden);
    public static Result<T> Forbidden(params string[] errorMessages) => new(ResultStatus.Forbidden) { Errors = errorMessages };
    public static Result<T> Unauthorized() => new(ResultStatus.Unauthorized);
    public static Result<T> Unauthorized(params string[] errorMessages) => new(ResultStatus.Unauthorized) { Errors = errorMessages };
    public static Result<T> Conflict() => new(ResultStatus.Conflict);
    public static Result<T> Conflict(params string[] errorMessages) => new(ResultStatus.Conflict) { Errors = errorMessages };
    public static Result<T> CriticalError(params string[] errorMessages) => new(ResultStatus.CriticalError) { Errors = errorMessages };
    public static Result<T> Unavailable(params string[] errorMessages) => new(ResultStatus.Unavailable) { Errors = errorMessages };
    public static Result<T> NoContent() => new(ResultStatus.NoContent);

    public static Result<T> FromError<TSource>(Result<TSource> source) =>
        new(source.Status) { Errors = source.Errors };
}
```

**Result (non-generic):**
```csharp
namespace MyProject.Core.Infrastructure;

public record Result : Result<Result>
{
    public Result() : base() { }
    protected internal Result(ResultStatus status) : base(status) { }

    public static Result Success() => new();
    public static Result SuccessWithMessage(string successMessage) => new() { SuccessMessage = successMessage };
    public static Result<T> Success<T>(T value) => new(value);
    public static Result<T> Success<T>(T value, string successMessage) => new(value, successMessage);
    public static Result<T> Created<T>(T value) => Result<T>.Created(value);
    public new static Result Created() => new(ResultStatus.Created);
    public new static Result Invalid(params string[] errorMessages) => new(ResultStatus.Invalid) { Errors = errorMessages };
    public new static Result Error(string errorMessage) => new(ResultStatus.Error) { Errors = new[] { errorMessage } };
    public new static Result Error(params string[] errorMessages) => new(ResultStatus.Error) { Errors = [.. errorMessages] };
    public new static Result NotFound() => new Result(ResultStatus.NotFound);
    public new static Result NotFound(params string[] errorMessages) => new(ResultStatus.NotFound) { Errors = errorMessages };
    public new static Result Forbidden() => new(ResultStatus.Forbidden);
    public new static Result Forbidden(params string[] errorMessages) => new(ResultStatus.Forbidden) { Errors = errorMessages };
    public new static Result Unauthorized() => new(ResultStatus.Unauthorized);
    public new static Result Unauthorized(params string[] errorMessages) => new(ResultStatus.Unauthorized) { Errors = errorMessages };
    public new static Result Conflict() => new(ResultStatus.Conflict);
    public new static Result Conflict(params string[] errorMessages) => new(ResultStatus.Conflict) { Errors = errorMessages };
    public new static Result Unavailable(params string[] errorMessages) => new(ResultStatus.Unavailable) { Errors = errorMessages };
    public new static Result CriticalError(params string[] errorMessages) => new(ResultStatus.CriticalError) { Errors = errorMessages };
    public new static Result NoContent() => new(ResultStatus.NoContent);

    public static Result FromError<TSource>(Result<TSource> source) =>
        new(source.Status) { Errors = source.Errors };
}
```

**Usage in error responses — always use the non-generic `Result` for errors:**
```csharp
// ✅ Correct
if (entity is null)
    return Result.NotFound($"Entity with ID {request.Id} not found.");

// ❌ Incorrect
if (entity is null)
    return Result<EntityViewModel>.NotFound($"Entity with ID {request.Id} not found.");
```

### 3.2 ValidationHelper

```csharp
using System.ComponentModel.DataAnnotations;

namespace MyProject.Core.Infrastructure;

public static class ValidationHelper
{
    public static Result Validate(IValidatableObject validatable)
    {
        ArgumentNullException.ThrowIfNull(validatable);

        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(validatable);
        var isValid = Validator.TryValidateObject(validatable, validationContext, validationResults, validateAllProperties: true);

        if (!isValid)
        {
            var errors = validationResults.Select(vr => vr.ErrorMessage ?? "Validation error");
            return Result.Invalid([.. errors]);
        }

        return Result.Success();
    }

    public static Result<T> Validate<T>(IValidatableObject validatable)
    {
        ArgumentNullException.ThrowIfNull(validatable);

        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(validatable);
        var isValid = Validator.TryValidateObject(validatable, validationContext, validationResults, validateAllProperties: true);

        if (!isValid)
        {
            var errors = validationResults.Select(vr => vr.ErrorMessage ?? "Validation error");
            return Result<T>.Invalid([.. errors]);
        }

        return Result<T>.Success(default!);
    }
}
```

### 3.3 Commands and Command Handlers

Commands represent operations that **modify state** (create, update, delete).

**Command:**
```csharp
using System.ComponentModel.DataAnnotations;

namespace MyProject.Core.Features.Orders.Create;

public sealed class CreateOrderCommand : IValidatableObject
{
    [Required]
    public Guid CustomerId { get; set; }

    public string? Title { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (CustomerId == Guid.Empty)
        {
            yield return new ValidationResult("Customer ID is required.", [nameof(CustomerId)]);
        }

        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult("Title is required.", [nameof(Title)]);
        }

        if (Title?.Length > 200)
        {
            yield return new ValidationResult("Title must not exceed 200 characters.", [nameof(Title)]);
        }
    }
}
```

**Command handler returning Result (no data):**
```csharp
using MyProject.Core.Infrastructure;
using MyProject.Domain.Entities;
using MyProject.Domain.Interfaces.Repositories;

namespace MyProject.Core.Features.Orders.Submit;

public sealed class SubmitOrderCommandHandler(
    IRepository<Order> repository)
{
    private readonly IRepository<Order> _repository = repository;

    public async Task<Result> Handle(
        SubmitOrderCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var order = await _repository.GetByIdAsync(request.OrderId, cancellationToken);

        if (order is null)
        {
            return Result.NotFound($"Order with ID '{request.OrderId}' was not found.");
        }

        if (!order.CanBeSubmitted())
        {
            return Result.Error("Order cannot be submitted in its current state.");
        }

        order.Submit();

        await _repository.UpdateAsync(order, cancellationToken);

        return Result.Success();
    }
}
```

**Command handler returning Result\<T\> (with data):**
```csharp
public sealed class CreateOrderCommandHandler(
    IRepository<Order> repository)
{
    private readonly IRepository<Order> _repository = repository;

    public async Task<Result<OrderViewModel>> Handle(
        CreateOrderCommand request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate<OrderViewModel>(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var order = new Order(request.CustomerId, request.Title!);

        var created = await _repository.AddAsync(order, cancellationToken);

        var viewModel = new OrderViewModel(created.Id, created.Title, created.Status);

        return Result.Created(viewModel);
    }
}
```

### 3.4 Queries and Query Handlers

Queries represent operations that **retrieve data** without modifying state.

**Query:**
```csharp
using System.ComponentModel.DataAnnotations;

namespace MyProject.Core.Features.Orders.GetById;

public sealed class GetOrderByIdQuery : IValidatableObject
{
    [Required]
    public Guid Id { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Id == Guid.Empty)
        {
            yield return new ValidationResult("Order ID is required.", [nameof(Id)]);
        }
    }
}
```

**Query handler:**
```csharp
using MyProject.Core.Infrastructure;
using MyProject.Domain.Interfaces.Repositories;

namespace MyProject.Core.Features.Orders.GetById;

public sealed class GetOrderByIdQueryHandler(
    IReadRepository<Order> repository)
{
    private readonly IReadRepository<Order> _repository = repository;

    public async Task<Result<OrderViewModel>> Handle(
        GetOrderByIdQuery request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate<OrderViewModel>(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var order = await _repository.GetByIdAsync(request.Id, cancellationToken);

        if (order is null)
        {
            return Result.NotFound($"Order with ID '{request.Id}' was not found.");
        }

        var viewModel = new OrderViewModel(order.Id, order.Title, order.Status);

        return Result.Success(viewModel);
    }
}
```

### 3.5 Handler Execution Order

Structure handler logic in this exact order:

1. **Null check** — `ArgumentNullException.ThrowIfNull(request)`
2. **Validation** — `ValidationHelper.Validate(request)` 
3. **Data retrieval** — Get entities from repository
4. **Existence check** — Return `Result.NotFound()` if entity is null
5. **Permission check** — Verify ownership/authorization (return `NotFound`, not `Forbidden`, to prevent information disclosure)
6. **Business rule validation** — Check entity state using query methods (e.g., `IsExpired()`, `CanBePublished()`)
7. **Parameter validation** — Validate request parameters that entities need
8. **Domain operations** — Call entity methods to change state
9. **Persistence** — Save changes via repository
10. **Response** — Map and return result

### 3.6 View Models

View models are immutable record types used to return data from handlers:

```csharp
namespace MyProject.Core.Features.Orders;

public sealed record OrderViewModel(
    Guid Id,
    string Title,
    OrderStatus Status);

public sealed record OrderDetailViewModel(
    Guid Id,
    string Title,
    OrderStatus Status,
    IReadOnlyList<OrderLineViewModel> Lines);

public sealed record OrderLineViewModel(
    Guid Id,
    string ProductName,
    int Quantity,
    decimal UnitPrice);
```

### 3.7 Handler Auto-Registration

Handlers are registered in DI by convention — all classes whose name ends with "Handler":

```csharp
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace MyProject.Core;

public static class Setup
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        var handlerTypes = assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.Name.EndsWith("Handler"));

        foreach (var handlerType in handlerTypes)
        {
            services.AddScoped(handlerType);
        }

        return services;
    }
}
```

### 3.8 Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Command | Imperative verb + `Command` | `CreateOrderCommand`, `PublishRecruitmentCommand` |
| Query | Descriptive name + `Query` | `GetOrderByIdQuery`, `ListOrdersQuery` |
| Handler | Match command/query + `Handler` | `CreateOrderCommandHandler` |
| View Model | Descriptive noun + `ViewModel` | `OrderViewModel`, `OrderDetailViewModel` |

---

## 4. Infrastructure Layer

The Infrastructure layer implements repository interfaces, database access, external services, and cross-cutting technical concerns. It depends on Core and Domain.

### Folder Structure

```
MyProject.Infrastructure/
    Data/
        AppDbContext.cs
        DapperContext.cs
        EfRepository.cs
        Configurations/
            OrderConfiguration.cs
            ...
        Interceptors/
            AuditingInterceptor.cs
            SoftDeleteInterceptor.cs
        Migrations/
            ...
        Repositories/
            OrderRepository.cs
            ...
    Events/
        DomainEventChannel.cs
        DomainEventConsumerService.cs
        DomainEventDispatcher.cs
    Emails/
        EmailService.cs
        ...
    Storage/
        ...
    Services/
        ...
    Setup.cs
```

### 4.1 Generic EF Repository

```csharp
using MyProject.Domain.Interfaces;
using MyProject.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MyProject.Infrastructure.Data;

public class EfRepository<T>(AppDbContext dbContext) :
    IReadRepository<T>,
    IRepository<T>
    where T : class, IAggregateRoot
{
    private readonly DbContext _dbContext = dbContext;

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().Add(entity);
        await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return entity;
    }

    public async Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().AddRange(entities);
        await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return entities;
    }

    public async Task<int> UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().Update(entity);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> UpdateRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().UpdateRange(entities);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().Remove(entity);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        _dbContext.Set<T>().RemoveRange(entities);
        return await SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<T?> GetByIdAsync<TId>(TId id, CancellationToken cancellationToken = default) where TId : notnull
    {
        return await _dbContext.Set<T>().FindAsync([id], cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    public async Task<List<T>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<T>().ToListAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> AnyAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<T>().AnyAsync(cancellationToken).ConfigureAwait(false);
    }
}
```

### 4.2 Custom Repositories

Custom repositories extend the generic `EfRepository<T>` for domain-specific queries:

```csharp
using MyProject.Domain.Entities;
using MyProject.Domain.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace MyProject.Infrastructure.Data.Repositories;

public class OrderRepository(AppDbContext dbContext)
    : EfRepository<Order>(dbContext), IOrderRepository
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<Order?> GetOrderWithLines(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext.Set<Order>()
            .Include(o => o.Lines)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken)
            .ConfigureAwait(false);
    }
}
```

### 4.3 AppDbContext with Domain Event Dispatching

The DbContext dispatches domain events **after a successful SaveChanges**:

```csharp
using System.Reflection;
using MyProject.Domain.Abstract;
using MyProject.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MyProject.Infrastructure.Data;

public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    IDomainEventDispatcher? dispatcher) : DbContext(options)
{
    private readonly IDomainEventDispatcher? _dispatcher = dispatcher;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
    {
        int result = await base.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        if (_dispatcher == null)
        {
            return result;
        }

        var entitiesWithEvents = ChangeTracker.Entries<DomainEntity>()
            .Select(e => e.Entity)
            .Where(e => e.DomainEvents.Any())
            .ToArray();

        await _dispatcher.DispatchAndClearEvents(entitiesWithEvents).ConfigureAwait(false);

        return result;
    }
}
```

### 4.4 EF Core Interceptors

**AuditingInterceptor** — Automatically sets CreatedAt/CreatedBy/UpdatedAt/UpdatedBy:

```csharp
using MyProject.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace MyProject.Infrastructure.Data.Interceptors;

public sealed class AuditingInterceptor(IUserContext userContext) : SaveChangesInterceptor
{
    private readonly IUserContext _userContext = userContext;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(eventData);

        if (eventData.Context is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        var currentUserAccountId = _userContext.AccountObjectId;

        IEnumerable<EntityEntry<IAuditable>> addedEntries =
            eventData.Context.ChangeTracker.Entries<IAuditable>()
                .Where(e => e.State == EntityState.Added);

        foreach (var entry in addedEntries)
        {
            entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
            entry.Entity.CreatedBy = currentUserAccountId;
        }

        IEnumerable<EntityEntry<IAuditable>> modifiedEntries =
            eventData.Context.ChangeTracker.Entries<IAuditable>()
                .Where(e => e.State == EntityState.Modified);

        foreach (var entry in modifiedEntries)
        {
            entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
            entry.Entity.UpdatedBy = currentUserAccountId;
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
```

**SoftDeleteInterceptor** — Converts Delete operations to soft-delete updates:

```csharp
using MyProject.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace MyProject.Infrastructure.Data.Interceptors;

public sealed class SoftDeleteInterceptor(IUserContext userContext) : SaveChangesInterceptor
{
    private readonly IUserContext _userContext = userContext;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(eventData);

        if (eventData.Context is null)
        {
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        IEnumerable<EntityEntry<ISoftDeletable>> entries =
            eventData.Context.ChangeTracker.Entries<ISoftDeletable>()
                .Where(e => e.State == EntityState.Deleted);

        var currentUserAccountId = _userContext.AccountObjectId;

        foreach (EntityEntry<ISoftDeletable> softDeletable in entries)
        {
            softDeletable.State = EntityState.Modified;
            softDeletable.Entity.IsDeleted = true;
            softDeletable.Entity.DeletedAt = DateTimeOffset.UtcNow;
            softDeletable.Entity.DeletedBy = currentUserAccountId;

            foreach (var reference in softDeletable.References)
            {
                if (reference.TargetEntry == null)
                    continue;

                var entityType = reference.TargetEntry.Entity.GetType();
                var attributes = entityType.GetCustomAttributes(typeof(OwnedAttribute), true);

                if (attributes is not null)
                {
                    reference.TargetEntry.State = EntityState.Unchanged;
                }
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
```

### 4.5 EF Core Entity Configuration

One configuration class per entity using `IEntityTypeConfiguration<T>`:

```csharp
using MyProject.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MyProject.Infrastructure.Data.Configurations;

internal class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable(nameof(Order));

        // Soft-delete query filter — automatically excludes deleted entities
        builder.HasQueryFilter(entity => !entity.IsDeleted);

        builder.HasKey(entity => entity.Id);

        // String properties — always specify HasMaxLength()
        builder.Property(entity => entity.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Notes)
            .HasMaxLength(2000);

        // Enum properties — always use string conversion
        builder.Property(entity => entity.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        // Relationships
        builder.HasMany(entity => entity.Lines)
            .WithOne(line => line.Order)
            .HasForeignKey(line => line.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

**Configuration rules:**
- Do NOT use `.IsRequired()` on non-nullable properties (EF Core infers it)
- ALWAYS configure enum properties with `.HasConversion<string>()` and `.HasMaxLength()`
- ALWAYS specify `HasMaxLength()` for string properties
- ALWAYS add `.HasQueryFilter(e => !e.IsDeleted)` for soft-deletable entities

### 4.6 Dapper Context

For read-optimized queries bypassing EF Core:

```csharp
using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace MyProject.Infrastructure.Data;

public class DapperContext
{
    private readonly string _connectionString;

    public DapperContext(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SqlConnection")
            ?? throw new InvalidOperationException("SqlConnection is not configured");
    }

    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }
}
```

### 4.7 Domain Events — Channel-Based Async Dispatching

**Channel interface and implementation:**
```csharp
using System.Threading.Channels;
using MyProject.Domain.Abstract;

namespace MyProject.Infrastructure.Events;

public interface IDomainEventChannel
{
    ValueTask PublishAsync(DomainEvent domainEvent, CancellationToken cancellationToken = default);
    IAsyncEnumerable<DomainEvent> ReadAllAsync(CancellationToken cancellationToken = default);
}

public sealed class DomainEventChannel : IDomainEventChannel
{
    private readonly Channel<DomainEvent> _channel;

    public DomainEventChannel()
    {
        _channel = Channel.CreateUnbounded<DomainEvent>(new UnboundedChannelOptions
        {
            SingleWriter = false,
            SingleReader = false
        });
    }

    public async ValueTask PublishAsync(DomainEvent domainEvent, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(domainEvent, cancellationToken);
    }

    public async IAsyncEnumerable<DomainEvent> ReadAllAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await foreach (var domainEvent in _channel.Reader.ReadAllAsync(cancellationToken))
        {
            yield return domainEvent;
        }
    }
}
```

**Dispatcher:**
```csharp
using MyProject.Domain.Abstract;
using MyProject.Domain.Interfaces;

namespace MyProject.Infrastructure.Events;

public sealed class DomainEventDispatcher(IDomainEventChannel eventChannel) : IDomainEventDispatcher
{
    private readonly IDomainEventChannel _eventChannel = eventChannel;

    public async Task DispatchAndClearEvents(IEnumerable<DomainEntity> entitiesWithEvents)
    {
        if (!entitiesWithEvents.Any())
            return;

        foreach (var entity in entitiesWithEvents)
        {
            var events = entity.DomainEvents.ToList();

            foreach (var domainEvent in events)
            {
                await _eventChannel.PublishAsync(domainEvent);
            }

            entity.ClearDomainEvents();
        }
    }
}
```

### 4.8 Infrastructure DI Setup

All infrastructure services are registered via an extension method:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MyProject.Infrastructure;

public static class Setup
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // EF Core interceptors (singleton — stateless)
        services.AddSingleton<SoftDeleteInterceptor>();
        services.AddSingleton<AuditingInterceptor>();
        services.AddSingleton<DapperContext>();

        // DbContext with interceptors
        services.AddDbContext<AppDbContext>((serviceProvider, contextOptions) =>
            contextOptions
                .UseSqlServer(
                    configuration.GetConnectionString("SqlConnection"),
                    options => options.EnableRetryOnFailure())
                .AddInterceptors(
                    serviceProvider.GetRequiredService<SoftDeleteInterceptor>(),
                    serviceProvider.GetRequiredService<AuditingInterceptor>()));

        // Generic repositories (open generic registration)
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped(typeof(IReadRepository<>), typeof(EfRepository<>));

        // Custom repositories
        services.AddScoped<IOrderRepository, OrderRepository>();
        // ... other custom repositories

        // Domain events
        services.AddSingleton<IDomainEventChannel, DomainEventChannel>();
        services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();
        services.AddHostedService<DomainEventConsumerService>();

        // Health checks
        services.AddHealthChecks()
            .AddCheck("api", () => HealthCheckResult.Healthy("API is running"), tags: ["api", "ready"])
            .AddDbContextCheck<AppDbContext>(
                name: "database",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["db", "sql", "ready"]);

        return services;
    }
}
```

### 4.9 EF Core Migration Commands

Run from the solution root:

| Action | Command |
|--------|---------|
| Add migration | `dotnet ef migrations add MigrationName --project src/MyProject.Infrastructure --startup-project src/MyProject.Operations --output-dir Data/Migrations` |
| Remove last migration | `dotnet ef migrations remove --project src/MyProject.Infrastructure --startup-project src/MyProject.Operations` |
| Update database | `dotnet ef database update --project src/MyProject.Infrastructure --startup-project src/MyProject.Operations` |

---

## 5. API Layer

The API layer exposes HTTP endpoints using ASP.NET Core Minimal APIs. It depends on Core and Infrastructure.

### Folder Structure

```
MyProject.API/
    Endpoints/
        Orders/
            CreateOrderEndpoint.cs
            GetOrderByIdEndpoint.cs
            ListOrdersEndpoint.cs
            DeleteOrderEndpoint.cs
        ...
    Authorization/
        AuthorizationPolicies.cs
    OpenAPI/
        ...
    HttpUserContext.cs
    ResultExtensions.cs
    ResultHttpExtensions.cs
    Program.cs
```

### 5.1 Minimal API Endpoints

Each endpoint is a static extension method on `IEndpointRouteBuilder`. Request/response models are co-located in the same file.

**GET endpoint (query):**
```csharp
using MyProject.Core.Features.Orders;
using MyProject.Core.Features.Orders.GetById;
using Microsoft.AspNetCore.Mvc;

namespace MyProject.API.Endpoints.Orders;

internal static class GetOrderByIdEndpoint
{
    public static IEndpointRouteBuilder MapGetOrderById(this IEndpointRouteBuilder endpoints)
    {
        endpoints
            .MapGet("/api/orders/{id:guid}", GetOrderById)
            .WithName("GetOrderById")
            .WithTags("Orders")
            .Produces<OrderViewModel>(StatusCodes.Status200OK)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status500InternalServerError);

        return endpoints;
    }

    private static async Task<IResult> GetOrderById(
        [FromRoute] Guid id,
        [FromServices] GetOrderByIdQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var query = new GetOrderByIdQuery { Id = id };

        var result = await handler.Handle(query, cancellationToken);

        return result.ToHttpResult();
    }
}
```

**POST endpoint (command):**
```csharp
using MyProject.Core.Features.Orders;
using MyProject.Core.Features.Orders.Create;
using Microsoft.AspNetCore.Mvc;

namespace MyProject.API.Endpoints.Orders;

internal static class CreateOrderEndpoint
{
    public static IEndpointRouteBuilder MapCreateOrder(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/orders", CreateOrder)
            .WithName("CreateOrder")
            .WithTags("Orders")
            .Produces<OrderViewModel>(StatusCodes.Status201Created)
            .ProducesValidationProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status500InternalServerError);

        return endpoints;
    }

    private static async Task<IResult> CreateOrder(
        [FromBody] CreateOrderRequest request,
        [FromServices] CreateOrderCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var command = new CreateOrderCommand
        {
            CustomerId = request.CustomerId,
            Title = request.Title
        };

        var result = await handler.Handle(command, cancellationToken);

        return result.ToHttpResult();
    }
}

internal sealed record CreateOrderRequest(
    Guid CustomerId,
    string Title);
```

### 5.2 OpenAPI Response Definitions

Standard response codes by operation type:

**GET (Query):**
```csharp
.Produces<ResponseType>(StatusCodes.Status200OK)
.ProducesValidationProblem(StatusCodes.Status400BadRequest)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status404NotFound)         // For GetById
.ProducesProblem(StatusCodes.Status500InternalServerError)
```

**POST (Create):**
```csharp
.Produces<ResponseType>(StatusCodes.Status201Created)   // or .Produces(StatusCodes.Status201Created) if no body
.ProducesValidationProblem(StatusCodes.Status400BadRequest)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status500InternalServerError)
```

**PUT/PATCH (Update):**
```csharp
.Produces(StatusCodes.Status200OK)
.ProducesValidationProblem(StatusCodes.Status400BadRequest)
.ProducesProblem(StatusCodes.Status404NotFound)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status500InternalServerError)
```

**DELETE:**
```csharp
.Produces(StatusCodes.Status204NoContent)
.ProducesValidationProblem(StatusCodes.Status400BadRequest)
.ProducesProblem(StatusCodes.Status404NotFound)
.ProducesProblem(StatusCodes.Status401Unauthorized)
.ProducesProblem(StatusCodes.Status500InternalServerError)
```

### 5.3 Result → HTTP Response Conversion

**For Minimal API endpoints (IResult):**
```csharp
using MyProject.Core.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace MyProject.API;

internal static class ResultHttpExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result)
    {
        ArgumentNullException.ThrowIfNull(result, nameof(result));

        return result.Status switch
        {
            ResultStatus.Ok => result.Value is null ? Results.Ok() : Results.Ok(result.Value),
            ResultStatus.Created => Results.Created(string.Empty, result.Value),
            ResultStatus.NoContent => Results.NoContent(),
            ResultStatus.NotFound => CreateProblemResult(result, StatusCodes.Status404NotFound, "Not Found"),
            ResultStatus.Unauthorized => Results.Unauthorized(),
            ResultStatus.Invalid => CreateValidationProblemResult(result),
            ResultStatus.Error => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Internal Server Error"),
            _ => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Unexpected Error")
        };
    }

    public static IResult ToHttpResult(this Result? result)
    {
        ArgumentNullException.ThrowIfNull(result, nameof(result));

        return result.Status switch
        {
            ResultStatus.Ok => Results.Ok(),
            ResultStatus.Created => Results.StatusCode(StatusCodes.Status201Created),
            ResultStatus.NoContent => Results.NoContent(),
            ResultStatus.NotFound => CreateProblemResult(result, StatusCodes.Status404NotFound, "Not Found"),
            ResultStatus.Unauthorized => Results.Unauthorized(),
            ResultStatus.Invalid => CreateValidationProblemResult(result),
            ResultStatus.Error => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Internal Server Error"),
            _ => CreateProblemResult(result, StatusCodes.Status500InternalServerError, "Unexpected Error")
        };
    }

    private static IResult CreateProblemResult<T>(Result<T> result, int statusCode, string title)
    {
        return Results.Problem(
            detail: result.Errors.Any() ? string.Join(", ", result.Errors) : null,
            statusCode: statusCode,
            title: title);
    }

    private static IResult CreateProblemResult(Result result, int statusCode, string title)
    {
        return Results.Problem(
            detail: result.Errors.Any() ? string.Join(", ", result.Errors) : null,
            statusCode: statusCode,
            title: title);
    }

    private static IResult CreateValidationProblemResult<T>(Result<T> result)
    {
        return Results.ValidationProblem(
            errors: new Dictionary<string, string[]>
            {
                { "ValidationErrors", result.Errors.ToArray() }
            },
            title: "One or more validation errors occurred");
    }

    private static IResult CreateValidationProblemResult(Result result)
    {
        return Results.ValidationProblem(
            errors: new Dictionary<string, string[]>
            {
                { "ValidationErrors", result.Errors.ToArray() }
            },
            title: "One or more validation errors occurred");
    }
}
```

**For MVC controllers (ActionResult):**
```csharp
using MyProject.Core.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace MyProject.API;

internal static class ResultExtensions
{
    public static ActionResult ToActionResult<T>(this Result<T> result)
    {
        ArgumentNullException.ThrowIfNull(result, nameof(result));

        return result.Status switch
        {
            ResultStatus.Ok => result.Value is null ? new OkResult() : new OkObjectResult(result.Value),
            ResultStatus.Created => new ObjectResult(result.Value) { StatusCode = StatusCodes.Status201Created },
            ResultStatus.NoContent => new NoContentResult(),
            ResultStatus.NotFound => CreateProblemDetails(result, StatusCodes.Status404NotFound, "Not Found"),
            ResultStatus.Unauthorized => new UnauthorizedResult(),
            ResultStatus.Invalid => CreateValidationProblemDetails(result),
            ResultStatus.Error => CreateProblemDetails(result, StatusCodes.Status500InternalServerError, "Internal Server Error"),
            _ => CreateProblemDetails(result, StatusCodes.Status500InternalServerError, "Unexpected Error")
        };
    }

    public static ActionResult ToActionResult(this Result result)
    {
        ArgumentNullException.ThrowIfNull(result, nameof(result));

        return result.Status switch
        {
            ResultStatus.Ok => new OkResult(),
            ResultStatus.Created => new StatusCodeResult(StatusCodes.Status201Created),
            ResultStatus.NoContent => new NoContentResult(),
            ResultStatus.NotFound => CreateProblemDetails(result, StatusCodes.Status404NotFound, "Not Found"),
            ResultStatus.Unauthorized => new UnauthorizedResult(),
            ResultStatus.Invalid => CreateValidationProblemDetails(result),
            ResultStatus.Error => CreateProblemDetails(result, StatusCodes.Status500InternalServerError, "Internal Server Error"),
            _ => CreateProblemDetails(result, StatusCodes.Status500InternalServerError, "Unexpected Error")
        };
    }

    private static ObjectResult CreateProblemDetails<T>(Result<T> result, int statusCode, string title)
    {
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = result.Errors.Any() ? string.Join(", ", result.Errors) : null
        };
        return new ObjectResult(problemDetails) { StatusCode = statusCode };
    }

    private static ObjectResult CreateProblemDetails(Result result, int statusCode, string title)
    {
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = result.Errors.Any() ? string.Join(", ", result.Errors) : null
        };
        return new ObjectResult(problemDetails) { StatusCode = statusCode };
    }

    private static BadRequestObjectResult CreateValidationProblemDetails<T>(Result<T> result)
    {
        var problemDetails = new ValidationProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred",
            Errors = new Dictionary<string, string[]>
            {
                { "ValidationErrors", result.Errors.ToArray() }
            }
        };
        return new BadRequestObjectResult(problemDetails);
    }

    private static BadRequestObjectResult CreateValidationProblemDetails(Result result)
    {
        var problemDetails = new ValidationProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred",
            Errors = new Dictionary<string, string[]>
            {
                { "ValidationErrors", result.Errors.ToArray() }
            }
        };
        return new BadRequestObjectResult(problemDetails);
    }
}
```

### 5.4 IUserContext Implementation

```csharp
using System.Security.Claims;
using MyProject.Domain.Interfaces;

namespace MyProject.API;

public class HttpUserContext(IHttpContextAccessor httpContextAccessor) : IUserContext
{
    public Guid AccountObjectId => GetCurrentUserAccountId();

    public bool IsAdministrator => HasRole("Admin");

    public Guid GetCurrentUserAccountId()
    {
        if (httpContextAccessor.HttpContext is null)
            return Guid.Empty;

        var context = httpContextAccessor.HttpContext;

        var claim = context.User.Claims.FirstOrDefault(claim =>
            claim.Type == "oid" ||
            claim.Type == "http://schemas.microsoft.com/identity/claims/objectidentifier");

        if (claim is null)
            return Guid.Empty;

        if (!Guid.TryParse(claim.Value, out Guid userAccountId))
            throw new Exception("Failed to parse user id to GUID");

        return userAccountId;
    }

    private bool HasRole(string roleName)
    {
        if (httpContextAccessor.HttpContext is null)
            return false;

        return httpContextAccessor.HttpContext.User.Claims
            .Any(claim => (claim.Type == "roles" || claim.Type == ClaimTypes.Role) &&
                         claim.Value.Equals(roleName, StringComparison.OrdinalIgnoreCase));
    }
}
```

### 5.5 Program.cs Template

```csharp
using System.Text.Json.Serialization;
using MyProject.API;
using MyProject.API.Endpoints.Orders;
using MyProject.Core;
using MyProject.Domain.Interfaces;
using MyProject.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// CORS
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["*"];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Authentication (JWT Bearer with Microsoft Identity)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        builder.Configuration.Bind("AzureAd", options);
    },
    options => builder.Configuration.Bind("AzureAd", options));

// Default authorization — require authenticated users
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

// HTTP context and user context
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IUserContext, HttpUserContext>();

// Add Infrastructure and Core services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCore();

// JSON serialization — enums as strings
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.Strict;
    });

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});

// OpenAPI
builder.Services.AddOpenApi("v1");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health checks
app.MapHealthChecks("/health").AllowAnonymous();

// Map minimal API endpoints
app.MapCreateOrder();
app.MapGetOrderById();
// ... map all endpoints

app.MapGet("/", () => Results.Ok("Welcome to the API!")).AllowAnonymous();

app.Run();
```

---

## 6. Cross-Cutting Concerns

### 6.1 Azure App Configuration with Key Vault

Centralized configuration using Azure App Configuration with label-based environment filtering:

```csharp
builder.Configuration.AddAzureAppConfiguration(options =>
{
    var defaultAzureCredential = new DefaultAzureCredential();

    options
        .Connect(new Uri(appConfigEndpoint), defaultAzureCredential)
        .Select(KeyFilter.Any, LabelFilter.Null)
        .Select(KeyFilter.Any, environmentName)
        .ConfigureRefresh(refreshOptions =>
            refreshOptions.Register("SentinelKey", refreshAll: true));

    options.ConfigureKeyVault(kv =>
    {
        kv.SetCredential(defaultAzureCredential);
    });
});
```

### 6.2 Azure Managed Identity for SQL Database

Connection string format (no credentials):
```
Server=tcp:your-server.database.windows.net,1433;Database=your-database;Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;
```

SQL to grant database access to a managed identity:
```sql
CREATE USER [app-service-name] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [app-service-name];
ALTER ROLE db_datawriter ADD MEMBER [app-service-name];
ALTER ROLE db_ddladmin ADD MEMBER [app-service-name];
```

### 6.3 Application Insights with Adaptive Sampling

```csharp
builder.Services.Configure<TelemetryConfiguration>(telemetryConfiguration =>
{
    var chain = telemetryConfiguration.DefaultTelemetrySink.TelemetryProcessorChainBuilder;
    chain.UseAdaptiveSampling(maxTelemetryItemsPerSecond: 5, excludedTypes: "Request,Exception");
    chain.Build();
});

builder.Services.AddApplicationInsightsTelemetry(new ApplicationInsightsServiceOptions
{
    EnableAdaptiveSampling = false, // Disabled here; enabled in processor chain above
});
```

### 6.4 HTTP Logging

```csharp
builder.Services.AddHttpLogging(options =>
{
    options.LoggingFields =
        HttpLoggingFields.RequestBody |
        HttpLoggingFields.RequestQuery |
        HttpLoggingFields.ResponseBody |
        HttpLoggingFields.ResponseStatusCode;

    options.CombineLogs = false;
    options.RequestBodyLogLimit = 4096;
    options.ResponseBodyLogLimit = 4096;
    options.MediaTypeOptions.AddText("application/problem+json");
});
```

### 6.5 Concurrency Control in Handlers

For operations requiring exclusive access (e.g., AI generation, idempotent processing):

```csharp
private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _locks = new();

public async Task<Result<TResponse>> Handle(CommandName request, CancellationToken cancellationToken)
{
    // ... validation ...

    var semaphore = _locks.GetOrAdd(request.ResourceId, _ => new SemaphoreSlim(1, 1));
    await semaphore.WaitAsync(cancellationToken);

    try
    {
        var resource = await _repository.GetByIdAsync(request.ResourceId, cancellationToken);

        if (resource.IsAlreadyProcessed())
            return Result.Success(new ResponseViewModel(resource.Data));

        var result = await _expensiveService.ProcessAsync(/* ... */);

        resource.UpdateWithResult(result);
        await _repository.UpdateAsync(resource, cancellationToken);

        return Result.Success(new ResponseViewModel(result));
    }
    finally
    {
        semaphore.Release();
    }
}
```

---

## 7. Testing Patterns

### Folder Structure

Tests mirror the source project structure:

```
tests/
    MyProject.Core.Tests/
        Features/
            Orders/
                Create/
                    CreateOrderCommandHandlerTests.cs
                Submit/
                    SubmitOrderCommandHandlerTests.cs
```

### Technology Stack

| Purpose | Library |
|---------|---------|
| Test framework | xUnit |
| Mocking | NSubstitute |
| Coverage | Coverlet |

### Test Structure

```csharp
using NSubstitute;
using Xunit;

namespace MyProject.Core.Tests.Features.Orders.Submit;

public class SubmitOrderCommandHandlerTests
{
    private readonly IRepository<Order> _repository = Substitute.For<IRepository<Order>>();

    private SubmitOrderCommandHandler CreateHandler()
    {
        return new SubmitOrderCommandHandler(_repository);
    }

    private static SubmitOrderCommand CreateValidCommand(Guid? orderId = null)
    {
        return new SubmitOrderCommand
        {
            OrderId = orderId ?? Guid.NewGuid()
        };
    }

    private static Order CreateOrder(OrderStatus status = OrderStatus.Draft)
    {
        var order = new Order(Guid.NewGuid(), "Test Order");
        // Set state as needed for the test
        return order;
    }

    [Fact]
    public async Task Handle_ValidOrder_ReturnsSuccess()
    {
        // Arrange
        var command = CreateValidCommand();
        var order = CreateOrder();

        _repository.GetByIdAsync(command.OrderId, Arg.Any<CancellationToken>())
            .Returns(order);

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        await _repository.Received(1).UpdateAsync(order, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_OrderNotFound_ReturnsNotFound()
    {
        // Arrange
        var command = CreateValidCommand();

        _repository.GetByIdAsync(command.OrderId, Arg.Any<CancellationToken>())
            .Returns((Order?)null);

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(ResultStatus.NotFound, result.Status);
    }

    [Fact]
    public async Task Handle_EmptyOrderId_ReturnsInvalid()
    {
        // Arrange
        var command = CreateValidCommand(Guid.Empty);

        // Act
        var result = await CreateHandler().Handle(command, CancellationToken.None);

        // Assert
        Assert.Equal(ResultStatus.Invalid, result.Status);
    }
}
```

### Test Conventions

- **AAA pattern** (Arrange-Act-Assert) with clear section separation
- **Factory methods** for creating test objects: `CreateHandler()`, `CreateValidCommand()`, `CreateEntity()`
- **One assertion per test** when possible (or closely related assertions)
- **NSubstitute verification**: `Received(n)`, `DidNotReceive()` for interaction testing
- Test class name: `{HandlerName}Tests`
- Test method name: `Handle_{Scenario}_{ExpectedOutcome}`

---

## 8. EditorConfig Template

```ini
root = true

[*.cs]

#### Core EditorConfig Options ####
indent_size = 4
indent_style = space
tab_width = 4
end_of_line = crlf
insert_final_newline = false

#### .NET Coding Conventions ####
dotnet_separate_import_directive_groups = false
dotnet_sort_system_directives_first = true
dotnet_style_qualification_for_event = false
dotnet_style_qualification_for_field = false
dotnet_style_qualification_for_method = false
dotnet_style_qualification_for_property = false
dotnet_style_predefined_type_for_locals_parameters_members = true
dotnet_style_predefined_type_for_member_access = true
dotnet_style_require_accessibility_modifiers = for_non_interface_members
dotnet_style_readonly_field = true
dotnet_code_quality_unused_parameters = all
dotnet_style_coalesce_expression = true
dotnet_style_collection_initializer = true
dotnet_style_null_propagation = true
dotnet_style_object_initializer = true
dotnet_style_prefer_auto_properties = true
dotnet_style_prefer_compound_assignment = true
dotnet_style_prefer_is_null_check_over_reference_equality_method = true
dotnet_style_prefer_simplified_boolean_expressions = true
dotnet_style_namespace_match_folder = true

#### C# Coding Conventions ####
csharp_style_var_elsewhere = false:silent
csharp_style_var_for_built_in_types = false:silent
csharp_style_var_when_type_is_apparent = false:silent
csharp_style_namespace_declarations = file_scoped:suggestion
csharp_style_prefer_primary_constructors = true:suggestion
csharp_style_pattern_matching_over_as_with_null_check = true:suggestion
csharp_style_pattern_matching_over_is_with_cast_check = true:suggestion
csharp_style_prefer_switch_expression = true:suggestion
csharp_prefer_braces = true:silent
csharp_prefer_simple_using_statement = true:suggestion
csharp_style_expression_bodied_accessors = true:silent
csharp_style_expression_bodied_properties = true:silent
csharp_style_expression_bodied_lambdas = true:silent
csharp_style_expression_bodied_constructors = false:silent
csharp_style_expression_bodied_methods = false:silent

#### C# Formatting Rules ####
csharp_new_line_before_catch = true
csharp_new_line_before_else = true
csharp_new_line_before_finally = true
csharp_new_line_before_open_brace = all
csharp_new_line_before_members_in_object_initializers = true
csharp_indent_block_contents = true
csharp_indent_case_contents = true
csharp_indent_switch_labels = true
csharp_space_after_keywords_in_control_flow_statements = true
csharp_space_around_binary_operators = before_and_after
csharp_preserve_single_line_blocks = true

#### Naming Styles ####
dotnet_naming_rule.interface_should_be_begins_with_i.severity = suggestion
dotnet_naming_rule.interface_should_be_begins_with_i.symbols = interface
dotnet_naming_rule.interface_should_be_begins_with_i.style = begins_with_i
dotnet_naming_symbols.interface.applicable_kinds = interface
dotnet_naming_style.begins_with_i.required_prefix = I
dotnet_naming_style.begins_with_i.capitalization = pascal_case

dotnet_naming_rule.types_should_be_pascal_case.severity = suggestion
dotnet_naming_rule.types_should_be_pascal_case.symbols = types
dotnet_naming_rule.types_should_be_pascal_case.style = pascal_case
dotnet_naming_symbols.types.applicable_kinds = class, struct, interface, enum
dotnet_naming_style.pascal_case.capitalization = pascal_case

# Instance fields: _camelCase
dotnet_naming_rule.instance_fields_should_be_camel_case.severity = suggestion
dotnet_naming_rule.instance_fields_should_be_camel_case.symbols = instance_fields
dotnet_naming_rule.instance_fields_should_be_camel_case.style = instance_field_style
dotnet_naming_symbols.instance_fields.applicable_kinds = field
dotnet_naming_style.instance_field_style.capitalization = camel_case
dotnet_naming_style.instance_field_style.required_prefix = _

[*.{cs,vb}]
tab_width = 4
indent_size = 4
end_of_line = crlf
dotnet_diagnostic.CA2007.severity = none
```

---

## Quick Reference: Code Style Rules

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
