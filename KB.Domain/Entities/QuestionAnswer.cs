namespace KB.Domain.Entities;

public class QuestionAnswer
{
    public Guid UserId { get; protected set; }
    public Guid QuestionId { get; protected set; }
    public Guid SelectedOptionId { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }
    public DateTimeOffset UpdatedAt { get; protected set; }

    public ApplicationUser User { get; protected set; } = default!;
    public Question Question { get; protected set; } = default!;
    public QuestionOption SelectedOption { get; protected set; } = default!;

    public void UpdateAnswer(Guid selectedOptionId)
    {
        SelectedOptionId = selectedOptionId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public static QuestionAnswer Create(Guid userId, Guid questionId, Guid selectedOptionId)
    {
        return new QuestionAnswer
        {
            UserId = userId,
            QuestionId = questionId,
            SelectedOptionId = selectedOptionId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
