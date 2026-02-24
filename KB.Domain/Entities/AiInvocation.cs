using KB.Domain.Abstract;
using KB.Domain.Enums;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class AiInvocation : DomainEntity<Guid>, IAggregateRoot
{
    public Guid ConversationId { get; protected set; }
    public Guid MessageId { get; protected set; }
    public Guid UserId { get; protected set; }
    public string SearchQuery { get; protected set; } = default!;
    public string? ConversationSummary { get; protected set; }
    public InvocationOutcome Outcome { get; protected set; }
    public string? OutcomeReason { get; protected set; }
    public string? RetrievedChunks { get; protected set; }
    public string? QualityMetrics { get; protected set; }
    public int InputTokens { get; protected set; }
    public int OutputTokens { get; protected set; }
    public string Model { get; protected set; } = default!;
    public string? AiProfileSnapshot { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }

    public Conversation Conversation { get; protected set; } = default!;
    public ConversationMessage Message { get; protected set; } = default!;
    public ApplicationUser User { get; protected set; } = default!;

    public static AiInvocation Create(
        Guid conversationId,
        Guid messageId,
        Guid userId,
        string searchQuery,
        InvocationOutcome outcome,
        string model,
        int inputTokens = 0,
        int outputTokens = 0,
        string? conversationSummary = null,
        string? outcomeReason = null,
        string? retrievedChunks = null,
        string? qualityMetrics = null,
        string? aiProfileSnapshot = null)
    {
        return new AiInvocation
        {
            ConversationId = conversationId,
            MessageId = messageId,
            UserId = userId,
            SearchQuery = searchQuery,
            ConversationSummary = conversationSummary,
            Outcome = outcome,
            OutcomeReason = outcomeReason,
            RetrievedChunks = retrievedChunks,
            QualityMetrics = qualityMetrics,
            InputTokens = inputTokens,
            OutputTokens = outputTokens,
            Model = model,
            AiProfileSnapshot = aiProfileSnapshot,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
