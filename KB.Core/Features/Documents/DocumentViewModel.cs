using KB.Domain.Enums;

namespace KB.Core.Features.Documents;

public sealed record DocumentViewModel(
    Guid Id,
    Guid KnowledgeBaseId,
    string FileName,
    long FileSize,
    string ContentType,
    KnowledgeCategory Category,
    string BlobPath,
    string? ChunkingPreset,
    ProcessingStatus ProcessingStatus,
    string? ProcessingProgress,
    string? ErrorMessage,
    int TotalChunks,
    int IndexedChunks,
    int FailedChunks,
    DateTimeOffset CreatedAt);
