using System.ComponentModel.DataAnnotations;
using KB.Domain.Enums;

namespace KB.Core.Features.Documents.Upload;

public sealed class UploadDocumentCommand : IValidatableObject
{
    public required Guid KnowledgeBaseId { get; init; }
    public required string FileName { get; init; }
    public required long FileSize { get; init; }
    public required string ContentType { get; init; }
    public required KnowledgeCategory Category { get; init; }
    public required Stream FileStream { get; init; }
    public required string ContentHash { get; init; }
    public string? ChunkingPreset { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (KnowledgeBaseId == Guid.Empty)
        {
            yield return new ValidationResult("KnowledgeBaseId is required.", [nameof(KnowledgeBaseId)]);
        }

        if (string.IsNullOrWhiteSpace(FileName))
        {
            yield return new ValidationResult("FileName is required.", [nameof(FileName)]);
        }

        if (FileSize <= 0)
        {
            yield return new ValidationResult("FileSize must be greater than 0.", [nameof(FileSize)]);
        }

        if (string.IsNullOrWhiteSpace(ContentHash))
        {
            yield return new ValidationResult("ContentHash is required.", [nameof(ContentHash)]);
        }
    }
}
