using KB.Domain.Abstract;
using KB.Domain.Enums;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Article : DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    public string Title { get; protected set; } = default!;
    public string? Content { get; protected set; }
    public string? FeaturedImagePath { get; protected set; }
    public string? Attachments { get; protected set; }
    public PublishStatus Status { get; protected set; }
    public string? ExcludedOrganizationIds { get; protected set; }
    public Guid AuthorUserId { get; protected set; }
    public DateTimeOffset? PublishedAt { get; protected set; }

    public ApplicationUser AuthorUser { get; protected set; } = default!;

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

    public bool IsDraft() => Status == PublishStatus.Draft;

    public void Update(string title, string? content, string? excludedOrganizationIds)
    {
        Title = title;
        Content = content;
        ExcludedOrganizationIds = excludedOrganizationIds;
    }

    public void SetFeaturedImage(string? path) => FeaturedImagePath = path;

    public void SetAttachments(string? attachmentsJson) => Attachments = attachmentsJson;

    public void Publish()
    {
        Status = PublishStatus.Published;
        PublishedAt = DateTimeOffset.UtcNow;
    }

    public void Unpublish()
    {
        Status = PublishStatus.Draft;
        PublishedAt = null;
    }

    public static Article Create(string title, Guid authorUserId, string? content = null)
    {
        return new Article
        {
            Title = title,
            Content = content,
            AuthorUserId = authorUserId,
            Status = PublishStatus.Draft
        };
    }
}
