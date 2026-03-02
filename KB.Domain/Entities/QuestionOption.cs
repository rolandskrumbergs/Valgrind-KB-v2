using KB.Domain.Abstract;

namespace KB.Domain.Entities;

public class QuestionOption : DomainEntity<Guid>
{
    public Guid QuestionId { get; protected set; }
    public string Text { get; protected set; } = default!;
    public bool IsCorrect { get; protected set; }
    public int SortOrder { get; protected set; }

    public Question Question { get; protected set; } = default!;

    public void Update(string text, bool isCorrect, int sortOrder)
    {
        Text = text;
        IsCorrect = isCorrect;
        SortOrder = sortOrder;
    }

    public static QuestionOption Create(Guid questionId, string text, bool isCorrect, int sortOrder)
    {
        return new QuestionOption
        {
            QuestionId = questionId,
            Text = text,
            IsCorrect = isCorrect,
            SortOrder = sortOrder
        };
    }
}
