using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;

namespace ReUse.Application.Interfaces.Services;

public interface IProductImageService
{
    public Task<List<UploadedImageResponse>> UploadMultipleImagesAsync(
     UploadProductImagesRequest request);

    Task DeleteImageAsync(Guid imageId, Guid userId);
    Task ReorderImagesAsync(ReorderImagesRequest request, Guid userId);
    public Task DeleteByPublicIdsAsync(IEnumerable<string> publicIds);

}