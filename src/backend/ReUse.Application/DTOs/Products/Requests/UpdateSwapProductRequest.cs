using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Products.Requests;

public record UpdateSwapProductRequest(
    BasicInfoUpdateRequest? BasicInfo,
    string? WantedItemTitle,
    string? WantedItemDescription
);