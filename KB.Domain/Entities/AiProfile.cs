using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class AiProfile : DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    public string Name { get; protected set; } = default!;
    public bool IsActive { get; protected set; }
    public Guid KnowledgeBaseId { get; protected set; }
    public string Model { get; protected set; } = default!;
    public int TopK { get; protected set; }
    public decimal MinRelevanceThreshold { get; protected set; }
    public int MinRelevanceChunksRequired { get; protected set; }
    public decimal HighConfidenceThreshold { get; protected set; }
    public int HighConfidenceChunksRequired { get; protected set; }

    public KnowledgeBase KnowledgeBase { get; protected set; } = default!;

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public void UpdateSettings(
        string name,
        string model,
        Guid knowledgeBaseId,
        int topK,
        decimal minRelevanceThreshold,
        int minRelevanceChunksRequired,
        decimal highConfidenceThreshold,
        int highConfidenceChunksRequired)
    {
        Name = name;
        Model = model;
        KnowledgeBaseId = knowledgeBaseId;
        TopK = topK;
        MinRelevanceThreshold = minRelevanceThreshold;
        MinRelevanceChunksRequired = minRelevanceChunksRequired;
        HighConfidenceThreshold = highConfidenceThreshold;
        HighConfidenceChunksRequired = highConfidenceChunksRequired;
    }

    public static AiProfile Create(
        string name,
        string model,
        Guid knowledgeBaseId,
        int topK,
        decimal minRelevanceThreshold,
        int minRelevanceChunksRequired,
        decimal highConfidenceThreshold,
        int highConfidenceChunksRequired)
    {
        return new AiProfile
        {
            Name = name,
            Model = model,
            KnowledgeBaseId = knowledgeBaseId,
            TopK = topK,
            MinRelevanceThreshold = minRelevanceThreshold,
            MinRelevanceChunksRequired = minRelevanceChunksRequired,
            HighConfidenceThreshold = highConfidenceThreshold,
            HighConfidenceChunksRequired = highConfidenceChunksRequired,
            IsActive = false
        };
    }
}
