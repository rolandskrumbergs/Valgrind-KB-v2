using KB.Domain.Abstract;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Organization : DomainEntity<Guid>, IAggregateRoot, ISoftDeletable, IAuditable
{
    public string Name { get; protected set; } = default!;
    public string? ContactInfo { get; protected set; }
    public string? InvoiceInfo { get; protected set; }
    public int MaxSeats { get; protected set; }
    public bool IsActive { get; protected set; }

    public ICollection<Subscription> Subscriptions { get; } = [];

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    public void Update(string name, string? contactInfo, string? invoiceInfo, int maxSeats, bool isActive)
    {
        Name = name;
        ContactInfo = contactInfo;
        InvoiceInfo = invoiceInfo;
        MaxSeats = maxSeats;
        IsActive = isActive;
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public int GetAssignedSeatCount() => Subscriptions.Count(s => s.UserId.HasValue && s.IsActive);

    public bool HasAvailableSeats() => GetAssignedSeatCount() < MaxSeats;

    public Subscription AddSubscription(Guid? userId = null)
    {
        var subscription = Subscription.Create(Id, userId);
        Subscriptions.Add(subscription);
        return subscription;
    }

    public static Organization Create(string name, int maxSeats, string? contactInfo = null, string? invoiceInfo = null)
    {
        return new Organization
        {
            Name = name,
            ContactInfo = contactInfo,
            InvoiceInfo = invoiceInfo,
            MaxSeats = maxSeats,
            IsActive = true
        };
    }
}
