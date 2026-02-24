namespace KB.Core.Features.KnowledgeBases;

public sealed record KnowledgeBaseViewModel(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    bool IsActive,
    string BlobContainerName,
    string SearchIndexPrefix,
    DateTimeOffset CreatedAt);
