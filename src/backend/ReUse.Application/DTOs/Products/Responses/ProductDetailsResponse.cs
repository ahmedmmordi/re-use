namespace ReUse.Application.DTOs.Products.Responses;

public record ProductDetailsResponse
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string? Condition { get; init; }
    public string Status { get; init; } = string.Empty;
    public int ViewCount { get; init; }
    public string? LocationCity { get; init; }
    public string? LocationCountry { get; init; }

    // Regular
    public decimal? Price { get; init; }
    public bool? AllowNegotiation { get; init; }

    // Swap
    public string? WantedItemTitle { get; init; }
    public string? WantedItemDescription { get; init; }
    public string? WantedCondition { get; init; }

    // Wanted
    public decimal? DesiredPriceMin { get; init; }
    public decimal? DesiredPriceMax { get; init; }

    public List<string> Images { get; init; } = [];
    public DateTime CreatedAt { get; init; }
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public Guid OwnerUserId { get; init; }
    public string OwnerUserName { get; init; } = string.Empty;
    public string MemberSince { get; init; } = string.Empty;
    public decimal OwnerRatingsAverage { get; init; }
    public int OwnerRatingsCount { get; init; }
    public bool OwnerIsVerified { get; set; }
    public bool IsPremium { get; set; }
    public DateTime? PremiumExpiresAt { get; set; }
}