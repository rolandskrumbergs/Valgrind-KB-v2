namespace KB.Core.Features.Conversations;

public sealed record RetrievedChunk(
    string Content,
    string DocumentName,
    string Category,
    double RelevanceScore,
    string? Section = null);
