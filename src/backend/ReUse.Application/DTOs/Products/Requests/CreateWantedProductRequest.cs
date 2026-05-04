using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace ReUse.Application.DTOs.Products.Requests;

public record CreateWantedProductRequest
(
    BasicInfoRequest BasicInfo,
    decimal DesiredPriceMin,
    decimal DesiredPriceMax,
    //   ShippingRequest? Shipping,
    List<IFormFile> Images
);