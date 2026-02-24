using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class KnowledgeBase : DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    public string Name { get; protected set; } = default!;
    public string Slug { get; protected set; } = default!;
    public string? Description { get; protected set; }
    public bool IsActive { get; protected set; }
    public string BlobContainerName { get; protected set; } = default!;
    public string SearchIndexPrefix { get; protected set; } = default!;

    public ICollection<Document> Documents { get; } = [];
    public ICollection<AiProfile> AiProfiles { get; } = [];

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public void Update(string name, string? description, bool isActive)
    {
        Name = name;
        Description = description;
        IsActive = isActive;
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public string GetIndexName(Enums.KnowledgeCategory category) =>
        $"{SearchIndexPrefix}-{category.ToString().ToLowerInvariant()}";

    public static KnowledgeBase Create(string name, string slug, string? description = null)
    {
        return new KnowledgeBase
        {
            Name = name,
            Slug = slug,
            Description = description,
            IsActive = true,
            BlobContainerName = $"kb-{slug}",
            SearchIndexPrefix = slug
        };
    }
}
