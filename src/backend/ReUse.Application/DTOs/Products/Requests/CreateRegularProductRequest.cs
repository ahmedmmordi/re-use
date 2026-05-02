using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace ReUse.Application.DTOs.Products.Requests;

public record CreateRegularProductRequest(
    BasicInfoRequest BasicInfo,
    decimal Price,
    bool AllowNegotiation,
     List<IFormFile> Images
    );