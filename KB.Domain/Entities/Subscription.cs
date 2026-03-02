using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Subscription : DomainEntity<Guid>, IAuditable
{
    public Guid OrganizationId { get; protected set; }
    public Guid? UserId { get; protected set; }
    public bool IsActive { get; protected set; }
    public DateTimeOffset? ActivatedAt { get; protected set; }
    public DateTimeOffset? DeactivatedAt { get; protected set; }

    public Organization Organization { get; protected set; } = default!;
    public ApplicationUser? User { get; protected set; }

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public bool IsAssigned() => UserId.HasValue;

    public void Assign(Guid userId)
    {
        UserId = userId;
        IsActive = true;
        ActivatedAt = DateTimeOffset.UtcNow;
        DeactivatedAt = null;
    }

    public void Unassign()
    {
        UserId = null;
        IsActive = false;
        DeactivatedAt = DateTimeOffset.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        ActivatedAt = DateTimeOffset.UtcNow;
        DeactivatedAt = null;
    }

    public void Deactivate()
    {
        IsActive = false;
        DeactivatedAt = DateTimeOffset.UtcNow;
    }

    public static Subscription Create(Guid organizationId, Guid? userId = null)
    {
        return new Subscription
        {
            OrganizationId = organizationId,
            UserId = userId,
            IsActive = userId.HasValue,
            ActivatedAt = userId.HasValue ? DateTimeOffset.UtcNow : null
        };
    }
}
