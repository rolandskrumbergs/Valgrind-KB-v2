using KB.Core.Infrastructure;
using KB.Domain.Entities;
using KB.Domain.Interfaces;
using KB.Domain.Interfaces.Repositories;

namespace KB.Core.Features.Conversations.Create;

public sealed class CreateConversationCommandHandler(
    IConversationRepository conversationRepository,
    IAiProfileRepository aiProfileRepository,
    IUserContext userContext)
{
    private readonly IConversationRepository _conversationRepository = conversationRepository;
    private readonly IAiProfileRepository _aiProfileRepository = aiProfileRepository;
    private readonly IUserContext _userContext = userContext;

    public async Task<Result<ConversationViewModel>> Handle(CreateConversationCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var profileId = request.AiProfileId;

        // If no profile specified, use the active one
        if (profileId is null)
        {
            var activeProfile = await _aiProfileRepository.GetActiveProfileAsync(cancellationToken).ConfigureAwait(false);
            profileId = activeProfile?.Id;
        }
        else
        {
            var profile = await _aiProfileRepository.GetByIdAsync(profileId.Value, cancellationToken).ConfigureAwait(false);
            if (profile is null)
            {
                return Result.NotFound($"AI profile with ID '{profileId}' not found.");
            }
        }

        var conversation = Conversation.Create(_userContext.AccountObjectId, profileId, request.Title);
        await _conversationRepository.AddAsync(conversation, cancellationToken).ConfigureAwait(false);

        return Result<ConversationViewModel>.Success(
            new ConversationViewModel(
                conversation.Id,
                conversation.UserId,
                conversation.Title,
                conversation.AiProfileId,
                conversation.CreatedAt,
                []));
    }
}
