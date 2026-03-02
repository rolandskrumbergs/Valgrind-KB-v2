namespace KB.Domain.Entities;

public class OrganizationCourse
{
    public Guid OrganizationId { get; protected set; }
    public Guid CourseId { get; protected set; }
    public Guid SharedByUserId { get; protected set; }
    public DateTimeOffset CreatedAt { get; protected set; }

    public Organization Organization { get; protected set; } = default!;
    public Course Course { get; protected set; } = default!;
    public ApplicationUser SharedByUser { get; protected set; } = default!;

    public static OrganizationCourse Create(Guid organizationId, Guid courseId, Guid sharedByUserId)
    {
        return new OrganizationCourse
        {
            OrganizationId = organizationId,
            CourseId = courseId,
            SharedByUserId = sharedByUserId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
