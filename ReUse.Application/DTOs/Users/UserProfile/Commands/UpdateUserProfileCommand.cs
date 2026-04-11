using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Users.UserProfile.Commands;

public record UpdateUserProfileCommand(

    string? FullName,
    string? PhoneNumber,
    string? Bio,
    string? AddressLine1,
    string? City,
    string? StateProvince,
    string? PostalCode,
    string? Country

    );