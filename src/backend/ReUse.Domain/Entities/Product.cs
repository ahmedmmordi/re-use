using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public abstract class Product : BaseEntity
{
    // FK to User (owner)
    public Guid OwnerUserId { get; set; }
    public User Owner { get; set; } = default!;

    // FK to Category
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = default!;

    // Core fields
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public abstract ProductType ProductType { get; }
    public ProductCondition? Condition { get; set; }

    // Location
    public string? LocationCity { get; set; }
    public string? LocationCountry { get; set; }

    // Lifecycle
    public ProductStatus Status { get; set; } = ProductStatus.Active;

    // TODO: IsShippable, ShippingCost, IsPremium, PremiumExpiresAt, ViewCount, PublishedAt
}