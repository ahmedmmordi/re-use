using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.DTOs.Products.ProductImages.Commands;
using ReUse.Domain.Entities;

namespace ReUse.Application.Interfaces.Services.Products;

public interface IProductImageService
{
    public Task<List<string>> UploadMultipleImagesAsync(ProductImageCommand command);
}