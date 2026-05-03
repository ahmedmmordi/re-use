using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Products.Responses;

public record ProductDetailsResponse
(
  Guid Id,
  string Title,
  string Description,
  string Type,
  string? Condition,
  string Status,
// int Views,
  decimal? Price,           //Rerular
  bool? AllowNegotiation,  //Rerular
  string WantedItemTitle, // Swap
  string? WantedItemDescription,// Swap
  string? WantedCondition,  // Swap
  decimal? DesiredPriceMin, //Wanted
  decimal? DesiredPriceMax, //Wanted
  List<string> Images,
  DateTime CreatedAt,
  Guid CategoryId,
  string CategoryName,
  Guid OwnerUserId,
  string OwnerUserName,
  string MemberSince // => Owner.CreatedAt.ToString("MMMM yyyy")
);

// TODO : OwnerUserData (bool   Verified , double Rating , int TotalReviews , string ResponseRate , string ResponseTime )