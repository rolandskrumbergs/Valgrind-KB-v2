namespace KB.Core.Features.AiProfiles;

public sealed record AiProfileViewModel(
    Guid Id,
    string Name,
    bool IsActive,
    Guid KnowledgeBaseId,
    string Model,
    int TopK,
    decimal MinRelevanceThreshold,
    int MinRelevanceChunksRequired,
    decimal HighConfidenceThreshold,
    int HighConfidenceChunksRequired,
    DateTimeOffset CreatedAt);
