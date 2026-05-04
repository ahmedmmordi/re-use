using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace ReUse.Application.DTOs.Products.Requests;

public record CreateSwapProductRequest
(
    BasicInfoRequest BasicInfo,
    string WantedItemTitle,
    string WantedItemDescription,
    List<IFormFile> OfferImages,
    List<IFormFile>? WantedImages
);