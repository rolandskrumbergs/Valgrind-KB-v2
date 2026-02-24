using KB.Core.Infrastructure;
using KB.Core.Interfaces;
using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Conversations.SendMessage;

public sealed class SendMessageCommandHandler(
    IConversationRepository conversationRepository,
    IChatOrchestrationService chatOrchestrationService,
    IUserContext userContext)
{
    private readonly IConversationRepository _conversationRepository = conversationRepository;
    private readonly IChatOrchestrationService _chatOrchestrationService = chatOrchestrationService;
    private readonly IUserContext _userContext = userContext;

    public async Task<Result<IAsyncEnumerable<ChatStreamEvent>>> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationResult = ValidationHelper.Validate<IAsyncEnumerable<ChatStreamEvent>>(request);
        if (!validationResult.IsSuccess)
        {
            return validationResult;
        }

        var conversation = await _conversationRepository.GetByIdAsync(request.ConversationId, cancellationToken)
            .ConfigureAwait(false);

        if (conversation is null)
        {
            return Result.NotFound($"Conversation with ID '{request.ConversationId}' not found.");
        }

        // Verify ownership
        if (conversation.UserId != _userContext.AccountObjectId)
        {
            return Result.NotFound($"Conversation with ID '{request.ConversationId}' not found.");
        }

        var stream = _chatOrchestrationService.SendMessageAsync(
            request.ConversationId,
            request.Content,
            _userContext.AccountObjectId,
            cancellationToken);

        return Result<IAsyncEnumerable<ChatStreamEvent>>.Success(stream);
    }
}
