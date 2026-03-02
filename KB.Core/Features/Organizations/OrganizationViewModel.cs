namespace KB.Core.Features.Organizations;

public sealed record OrganizationViewModel(
    Guid Id,
    string Name,
    string? ContactInfo,
    string? InvoiceInfo,
    int MaxSeats,
    bool IsActive,
    int AssignedSeats,
    DateTimeOffset CreatedAt);
