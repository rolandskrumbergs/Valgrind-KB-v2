using KB.Domain.Abstract;
using KB.Domain.Enums;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Document : DomainEntity<Guid>, IAggregateRoot, IAuditable
{
    public Guid KnowledgeBaseId { get; protected set; }
    public string FileName { get; protected set; } = default!;
    public long FileSize { get; protected set; }
    public string ContentType { get; protected set; } = default!;
    public KnowledgeCategory Category { get; protected set; }
    public string BlobPath { get; protected set; } = default!;
    public string ContentHash { get; protected set; } = default!;
    public string? ChunkingPreset { get; protected set; }
    public ProcessingStatus ProcessingStatus { get; protected set; }
    public string? ProcessingProgress { get; protected set; }
    public string? ProcessingMetrics { get; protected set; }
    public string? ErrorMessage { get; protected set; }
    public int TotalChunks { get; protected set; }
    public int IndexedChunks { get; protected set; }
    public int FailedChunks { get; protected set; }
    public Guid UploadedByUserId { get; protected set; }

    public KnowledgeBase KnowledgeBase { get; protected set; } = default!;
    public ApplicationUser UploadedByUser { get; protected set; } = default!;

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public bool IsProcessing() => ProcessingStatus == ProcessingStatus.Processing;

    public bool IsCompleted() => ProcessingStatus == ProcessingStatus.Completed;

    public bool HasFailed() => ProcessingStatus == ProcessingStatus.Failed;

    public void MarkProcessing(string? progress = null)
    {
        ProcessingStatus = ProcessingStatus.Processing;
        ProcessingProgress = progress;
        ErrorMessage = null;
    }

    public void MarkCompleted(int totalChunks, int indexedChunks, int failedChunks, string? metrics = null)
    {
        ProcessingStatus = ProcessingStatus.Completed;
        TotalChunks = totalChunks;
        IndexedChunks = indexedChunks;
        FailedChunks = failedChunks;
        ProcessingMetrics = metrics;
        ProcessingProgress = null;
    }

    public void MarkFailed(string errorMessage)
    {
        ProcessingStatus = ProcessingStatus.Failed;
        ErrorMessage = errorMessage;
        ProcessingProgress = null;
    }

    public void UpdateProgress(string progress)
    {
        ProcessingProgress = progress;
    }

    public static Document Create(
        Guid knowledgeBaseId,
        string fileName,
        long fileSize,
        string contentType,
        KnowledgeCategory category,
        string blobPath,
        string contentHash,
        Guid uploadedByUserId,
        string? chunkingPreset = null)
    {
        return new Document
        {
            KnowledgeBaseId = knowledgeBaseId,
            FileName = fileName,
            FileSize = fileSize,
            ContentType = contentType,
            Category = category,
            BlobPath = blobPath,
            ContentHash = contentHash,
            UploadedByUserId = uploadedByUserId,
            ChunkingPreset = chunkingPreset,
            ProcessingStatus = ProcessingStatus.Uploaded,
            TotalChunks = 0,
            IndexedChunks = 0,
            FailedChunks = 0
        };
    }
}
