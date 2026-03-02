using KB.Domain.Abstract;
using KB.Domain.Enums;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Course : DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    public string Title { get; protected set; } = default!;
    public string? Description { get; protected set; }
    public string? ImagePath { get; protected set; }
    public decimal Price { get; protected set; }
    public string Currency { get; protected set; } = default!;
    public PublishStatus Status { get; protected set; }
    public bool CertificateEnabled { get; protected set; }
    public Guid CreatedByUserId { get; protected set; }

    public ApplicationUser CreatedByUser { get; protected set; } = default!;

    public ICollection<Chapter> Chapters { get; } = [];
    public ICollection<OrganizationCourse> OrganizationCourses { get; } = [];

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public bool IsPublished() => Status == PublishStatus.Published;

    public bool CanBePublished() => Chapters.Count > 0;

    public void Update(string title, string? description, decimal price, string currency, bool certificateEnabled)
    {
        Title = title;
        Description = description;
        Price = price;
        Currency = currency;
        CertificateEnabled = certificateEnabled;
    }

    public void SetImage(string? path) => ImagePath = path;

    public void Publish()
    {
        Status = PublishStatus.Published;
    }

    public void Unpublish()
    {
        Status = PublishStatus.Draft;
    }

    public Chapter AddChapter(string title, string? description, string? videoUrl, int sortOrder)
    {
        var chapter = Chapter.Create(Id, title, description, videoUrl, sortOrder);
        Chapters.Add(chapter);
        return chapter;
    }

    public static Course Create(string title, Guid createdByUserId, decimal price = 0, string currency = "SEK", string? description = null)
    {
        return new Course
        {
            Title = title,
            Description = description,
            Price = price,
            Currency = currency,
            Status = PublishStatus.Draft,
            CertificateEnabled = false,
            CreatedByUserId = createdByUserId
        };
    }
}
