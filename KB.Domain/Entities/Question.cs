using KB.Domain.Abstract;
using KB.Domain.Enums;

namespace KB.Domain.Entities;

public class Question : DomainEntity<Guid>
{
    public Guid ChapterId { get; protected set; }
    public QuestionType Type { get; protected set; }
    public string Text { get; protected set; } = default!;
    public string? Description { get; protected set; }
    public string? Feedback { get; protected set; }

    public Chapter Chapter { get; protected set; } = default!;

    public ICollection<QuestionOption> Options { get; } = [];

    public void Update(string text, string? description, string? feedback)
    {
        Text = text;
        Description = description;
        Feedback = feedback;
    }

    public QuestionOption AddOption(string text, bool isCorrect, int sortOrder)
    {
        var option = QuestionOption.Create(Id, text, isCorrect, sortOrder);
        Options.Add(option);
        return option;
    }

    public static Question Create(Guid chapterId, QuestionType type, string text, string? description, string? feedback)
    {
        return new Question
        {
            ChapterId = chapterId,
            Type = type,
            Text = text,
            Description = description,
            Feedback = feedback
        };
    }
}
