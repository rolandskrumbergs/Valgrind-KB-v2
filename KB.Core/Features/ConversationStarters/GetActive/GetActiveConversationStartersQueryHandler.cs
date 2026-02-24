using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.ConversationStarters.GetActive;

public sealed class GetActiveConversationStartersQueryHandler(
    IConversationStarterRepository conversationStarterRepository)
{
    private readonly IConversationStarterRepository _conversationStarterRepository = conversationStarterRepository;

    public async Task<Result<List<ConversationStarterViewModel>>> Handle(GetActiveConversationStartersQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var starters = await _conversationStarterRepository.GetActiveStartersAsync(cancellationToken).ConfigureAwait(false);

        var viewModels = starters
            .OrderBy(s => s.SortOrder)
            .Select(s => new ConversationStarterViewModel(s.Id, s.Text, s.SortOrder, s.IsActive, s.CreatedAt))
            .ToList();

        return Result<List<ConversationStarterViewModel>>.Success(viewModels);
    }
}
