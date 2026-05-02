using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Products.Responses;

public record ShippingResponse(
     bool OffersShipping,
     bool LocalPickup
);