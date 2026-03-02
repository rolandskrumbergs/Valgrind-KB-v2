using KB.Domain.Abstract;
using KB.Domain.Enums;
using KB.Domain.Interfaces;

namespace KB.Domain.Entities;

public class Purchase : DomainEntity<Guid>, IAggregateRoot
{
    public Guid UserId { get; protected set; }
    public PurchaseType Type { get; protected set; }
    public Guid? CourseId { get; protected set; }
    public int? TokenAmount { get; protected set; }
    public decimal Price { get; protected set; }
    public decimal PriceInLocalCurrency { get; protected set; }
    public string Currency { get; protected set; } = default!;
    public string Source { get; protected set; } = default!;
    public string TransactionId { get; protected set; } = default!;
    public DateTimeOffset CreatedAt { get; protected set; }

    public ApplicationUser User { get; protected set; } = default!;
    public Course? Course { get; protected set; }

    public static Purchase CreateCoursePurchase(
        Guid userId,
        Guid courseId,
        decimal price,
        decimal priceInLocalCurrency,
        string currency,
        string source,
        string transactionId)
    {
        return new Purchase
        {
            UserId = userId,
            Type = PurchaseType.Course,
            CourseId = courseId,
            Price = price,
            PriceInLocalCurrency = priceInLocalCurrency,
            Currency = currency,
            Source = source,
            TransactionId = transactionId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public static Purchase CreateTokenPurchase(
        Guid userId,
        int tokenAmount,
        decimal price,
        decimal priceInLocalCurrency,
        string currency,
        string source,
        string transactionId)
    {
        return new Purchase
        {
            UserId = userId,
            Type = PurchaseType.ChatTokens,
            TokenAmount = tokenAmount,
            Price = price,
            PriceInLocalCurrency = priceInLocalCurrency,
            Currency = currency,
            Source = source,
            TransactionId = transactionId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
