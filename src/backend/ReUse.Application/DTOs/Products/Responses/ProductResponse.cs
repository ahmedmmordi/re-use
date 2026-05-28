using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products.Responses;

public record ProductResponse
{
    public Guid Id { get; init; }
    public ProductType Type { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public ProductCondition? Condition { get; init; }
    public string? LocationCity { get; init; }
    public string? LocationCountry { get; init; }
    public Guid OwnerUserId { get; init; }
    public DateTime CreatedAt { get; init; }

    // Type-specific
    public decimal? Price { get; init; }          // Regular
    public bool AllowNegotiation { get; init; }   // Regular
    public string? WantedItem { get; init; }      // Swap
    public string? WantedItemDescription { get; init; } // Swap
    public decimal? MinPrice { get; init; }       // Wanted
    public decimal? MaxPrice { get; init; }       // Wanted

    public List<UploadedImageResponse> Images { get; init; } = [];
    public string CoverImageUrl { get; init; } = string.Empty;
    public bool IsPremium { get; set; }
    public DateTime? PremiumExpiresAt { get; set; }
}