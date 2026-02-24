using KB.Core.Infrastructure;
using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Conversations.GetUserConversations;

public sealed class GetUserConversationsQueryHandler(
    IConversationRepository conversationRepository,
    IUserContext userContext)
{
    private readonly IConversationRepository _conversationRepository = conversationRepository;
    private readonly IUserContext _userContext = userContext;

    public async Task<Result<List<ConversationViewModel>>> Handle(GetUserConversationsQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var conversations = await _conversationRepository.GetUserConversationsAsync(
            _userContext.AccountObjectId, cancellationToken).ConfigureAwait(false);

        var viewModels = conversations.Select(c => new ConversationViewModel(
            c.Id,
            c.UserId,
            c.Title,
            c.AiProfileId,
            c.CreatedAt,
            c.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new ConversationMessageViewModel(
                    m.Id,
                    m.Role.ToString(),
                    m.Content,
                    m.CreatedAt))
                .ToList()))
            .ToList();

        return Result<List<ConversationViewModel>>.Success(viewModels);
    }
}
