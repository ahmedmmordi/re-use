using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products.Responses;

public record ProductResponse
    (
      Guid Id,
      ProductType Type,
      string Title,
      string Description,
      Guid CategoryId,
      ProductCondition? Condition,
      string? LocationCity,
      string? LocationCountry,
      Guid OwnerUserId,
      DateTime CreatedAt,
      // Type-specific
      decimal? Price, // Regular
      bool AllowNegotiation, // Regular
      string? WantedItem,   // Swap
      string? WantedItemDescription,  // Swap
      decimal? MinPrice,   // Wanted
      decimal? MaxPrice,  // Wanted

      //  ShippingResponse? Shipping,
      List<UploadedImageResponse> Images,
      string CoverImageUrl
    );