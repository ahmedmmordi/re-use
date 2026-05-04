using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;

namespace ReUse.Application.Interfaces.Services;

public interface IProductImageService
{
    public Task<List<UploadedImageResponse>> UploadMultipleImagesAsync(
     UploadProductImagesRequest request);

    public Task DeleteByPublicIdsAsync(IEnumerable<string> publicIds);

}