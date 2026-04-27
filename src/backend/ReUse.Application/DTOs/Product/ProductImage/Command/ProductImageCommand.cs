using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace ReUse.Application.DTOs.Products.ProductImages.Commands;

public record ProductImageCommand
(Guid Id,
    int Order,
    IEnumerable<IFormFile> Images
);