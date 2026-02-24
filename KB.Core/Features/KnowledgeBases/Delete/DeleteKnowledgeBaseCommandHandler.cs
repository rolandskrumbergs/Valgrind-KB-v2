using KB.Core.Infrastructure;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.KnowledgeBases.Delete;

public sealed class DeleteKnowledgeBaseCommandHandler(
    IKnowledgeBaseRepository knowledgeBaseRepository)
{
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository = knowledgeBaseRepository;

    public async Task<Result> Handle(DeleteKnowledgeBaseCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result.Invalid([.. validationResult.Errors]);
        }

        var knowledgeBase = await _knowledgeBaseRepository.GetByIdAsync(request.Id, cancellationToken).ConfigureAwait(false);
        if (knowledgeBase is null)
        {
            return Result.NotFound($"Knowledge base with ID '{request.Id}' not found.");
        }

        await _knowledgeBaseRepository.DeleteAsync(knowledgeBase, cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
