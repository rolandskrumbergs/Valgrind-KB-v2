using KB.Core.Infrastructure;
using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Conversations.GetById;

public sealed class GetConversationByIdQueryHandler(
    IConversationRepository conversationRepository,
    IUserContext userContext)
{
    private readonly IConversationRepository _conversationRepository = conversationRepository;
    private readonly IUserContext _userContext = userContext;

    public async Task<Result<ConversationViewModel>> Handle(GetConversationByIdQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate<ConversationViewModel>(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var conversation = await _conversationRepository.GetWithMessagesAsync(request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (conversation is null)
        {
            return Result.NotFound($"Conversation with ID '{request.Id}' not found.");
        }

        if (conversation.UserId != _userContext.AccountObjectId)
        {
            return Result.NotFound($"Conversation with ID '{request.Id}' not found.");
        }

        var messages = conversation.Messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ConversationMessageViewModel(
                m.Id,
                m.Role.ToString(),
                m.Content,
                m.CreatedAt))
            .ToList();

        return Result<ConversationViewModel>.Success(
            new ConversationViewModel(
                conversation.Id,
                conversation.UserId,
                conversation.Title,
                conversation.AiProfileId,
                conversation.CreatedAt,
                messages));
    }
}
