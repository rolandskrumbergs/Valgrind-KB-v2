using KB.Core.Infrastructure;
using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Conversations.AddFeedback;

public sealed class AddFeedbackCommandHandler(
    IConversationRepository conversationRepository,
    IUserContext userContext)
{
    private readonly IConversationRepository _conversationRepository = conversationRepository;
    private readonly IUserContext _userContext = userContext;

    public async Task<Result> Handle(AddFeedbackCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var conversation = await _conversationRepository.GetWithMessagesAsync(request.ConversationId, cancellationToken)
            .ConfigureAwait(false);

        if (conversation is null)
        {
            return Result.NotFound($"Conversation with ID '{request.ConversationId}' not found.");
        }

        if (conversation.UserId != _userContext.AccountObjectId)
        {
            return Result.NotFound($"Conversation with ID '{request.ConversationId}' not found.");
        }

        var message = conversation.Messages.FirstOrDefault(m => m.Id == request.MessageId);
        if (message is null)
        {
            return Result.NotFound($"Message with ID '{request.MessageId}' not found.");
        }

        conversation.AddFeedback(request.MessageId, _userContext.AccountObjectId, request.IsPositive);
        await _conversationRepository.UpdateAsync(conversation, cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
