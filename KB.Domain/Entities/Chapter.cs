using KB.Domain.Abstract;

namespace KB.Domain.Entities;

public class Chapter : DomainEntity<Guid>
{
    public Guid CourseId { get; protected set; }
    public string Title { get; protected set; } = default!;
    public string? Description { get; protected set; }
    public string? VideoUrl { get; protected set; }
    public int SortOrder { get; protected set; }

    public Course Course { get; protected set; } = default!;

    public ICollection<Question> Questions { get; } = [];

    public void Update(string title, string? description, string? videoUrl, int sortOrder)
    {
        Title = title;
        Description = description;
        VideoUrl = videoUrl;
        SortOrder = sortOrder;
    }

    public Question AddQuestion(Enums.QuestionType type, string text, string? description, string? feedback)
    {
        var question = Question.Create(Id, type, text, description, feedback);
        Questions.Add(question);
        return question;
    }

    public static Chapter Create(Guid courseId, string title, string? description, string? videoUrl, int sortOrder)
    {
        return new Chapter
        {
            CourseId = courseId,
            Title = title,
            Description = description,
            VideoUrl = videoUrl,
            SortOrder = sortOrder
        };
    }
}
