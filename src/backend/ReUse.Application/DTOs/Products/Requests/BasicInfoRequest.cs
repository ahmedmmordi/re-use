using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products.Requests;

public record BasicInfoRequest(
    string Title,
    string Description,
    string? LocationCity,
    string? LocationCountry,
    Guid CategoryId,
    ProductCondition Condition
);