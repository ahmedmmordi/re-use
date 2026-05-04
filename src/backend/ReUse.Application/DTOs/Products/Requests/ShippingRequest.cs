using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Products.Requests;

public record ShippingRequest(
    //bool OffersShipping,
    // bool LocalPickup
    );


//TODO: Add shipping method, price, free shipping, weight, and package size to the ShippingRequest record