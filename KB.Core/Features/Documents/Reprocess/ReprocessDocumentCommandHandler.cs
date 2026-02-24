using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Documents.Reprocess;

public sealed class ReprocessDocumentCommandHandler(
    IDocumentRepository documentRepository,
    IDocumentIngestionService documentIngestionService)
{
    private readonly IDocumentRepository _documentRepository = documentRepository;
    private readonly IDocumentIngestionService _documentIngestionService = documentIngestionService;

    public async Task<Result> Handle(ReprocessDocumentCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result.Invalid([.. validationResult.Errors]);
        }

        var document = await _documentRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (document is null)
        {
            return Result.NotFound($"Document with ID '{request.Id}' not found.");
        }

        if (document.IsProcessing())
        {
            return Result.Invalid(["Document is already being processed."]);
        }

        document.MarkProcessing();
        await _documentRepository.UpdateAsync(document, cancellationToken).ConfigureAwait(false);

        _ = _documentIngestionService.StartIngestionAsync(document.Id, CancellationToken.None);

        return Result.Success();
    }
}
