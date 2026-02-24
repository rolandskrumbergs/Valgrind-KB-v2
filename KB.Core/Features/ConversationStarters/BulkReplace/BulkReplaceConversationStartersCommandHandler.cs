using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.ConversationStarters.BulkReplace;

public sealed class BulkReplaceConversationStartersCommandHandler(
    IConversationStarterRepository conversationStarterRepository)
{
    private readonly IConversationStarterRepository _conversationStarterRepository = conversationStarterRepository;

    public async Task<Result<List<ConversationStarterViewModel>>> Handle(BulkReplaceConversationStartersCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return Result<List<ConversationStarterViewModel>>.Invalid([.. validationResult.Errors]);
        }

        // Delete all existing starters
        var existing = await _conversationStarterRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        if (existing.Count > 0)
        {
            await _conversationStarterRepository.DeleteRangeAsync(existing, cancellationToken).ConfigureAwait(false);
        }

        // Create new starters
        var newStarters = request.Starters.Select(s =>
            ConversationStarter.Create(s.Text, s.SortOrder, s.IsActive)).ToList();

        await _conversationStarterRepository.AddRangeAsync(newStarters, cancellationToken).ConfigureAwait(false);

        var viewModels = newStarters
            .OrderBy(s => s.SortOrder)
            .Select(s => new ConversationStarterViewModel(s.Id, s.Text, s.SortOrder, s.IsActive, s.CreatedAt))
            .ToList();

        return Result<List<ConversationStarterViewModel>>.Success(viewModels);
    }
}
