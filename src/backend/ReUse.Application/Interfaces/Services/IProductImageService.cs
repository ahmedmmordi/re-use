using ReUse.Application.DTOs.Products;

namespace ReUse.Application.Interfaces.Services;

public interface IProductImageService
{
    public Task<List<string>> UploadMultipleImagesAsync(UploadProductImagesRequest request);
}