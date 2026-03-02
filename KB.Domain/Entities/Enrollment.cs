using KB.Domain.Abstract;
using KB.Domain.Enums;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Enrollment : DomainEntity<Guid>, IAggregateRoot, IAuditable
{
    public Guid UserId { get; protected set; }
    public Guid CourseId { get; protected set; }
    public Guid? OrganizationId { get; protected set; }
    public EnrollmentStatus Status { get; protected set; }
    public AccessType AccessType { get; protected set; }
    public Guid? LastChapterId { get; protected set; }
    public DateTimeOffset? CompletedAt { get; protected set; }
    public string? CertificateId { get; protected set; }

    public ApplicationUser User { get; protected set; } = default!;
    public Course Course { get; protected set; } = default!;
    public Organization? Organization { get; protected set; }
    public Chapter? LastChapter { get; protected set; }

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public bool IsCompleted() => Status == EnrollmentStatus.Completed;

    public void UpdateProgress(Guid lastChapterId)
    {
        LastChapterId = lastChapterId;
        if (Status == EnrollmentStatus.NotStarted)
            Status = EnrollmentStatus.InProgress;
    }

    public void Complete(string? certificateId = null)
    {
        Status = EnrollmentStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
        CertificateId = certificateId;
    }

    public static Enrollment Create(Guid userId, Guid courseId, AccessType accessType, Guid? organizationId = null)
    {
        return new Enrollment
        {
            UserId = userId,
            CourseId = courseId,
            OrganizationId = organizationId,
            Status = EnrollmentStatus.NotStarted,
            AccessType = accessType
        };
    }
}
