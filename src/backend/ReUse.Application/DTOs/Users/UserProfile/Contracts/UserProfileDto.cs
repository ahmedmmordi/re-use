using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Users.UserProfile.Contracts;

public record UserProfileDto(
    Guid Id,
    string FullName,
    string? Email,
    string? PhoneNumber,

    string? ProfileImageUrl,
    string? Bio,
    string? CoverImageUrl,

    string? AddressLine1,
    string? City,
    string? StateProvince,
    string? PostalCode,
    string? Country,


    int FollowersCount,
    int FollowingCount
//int ProductsCount,


//decimal TotalSalesAmount,
//int ItemsSold,


//decimal? AverageRating,
//decimal? ResponseRate,
//decimal? AverageShipTimeDays
);