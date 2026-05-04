using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;

namespace ReUse.Application.Interfaces.Services;

public interface IProductImageService
{
    public Task<List<UploadedImageResponse>> UploadMultipleImagesAsync(
     UploadProductImagesRequest request);
    Task<List<UploadedImageResponse>> UploadOfferImagesAsync(
    Guid productId,
    UploadMoreImagesRequest request,
    Guid userId);

    Task<List<UploadedImageResponse>> UploadWantedImagesAsync(
        Guid productId,
        UploadMoreImagesRequest request,
        Guid userId);
    Task DeleteImageAsync(Guid imageId, Guid userId);
    Task ReorderImagesAsync(ReorderImagesRequest request, Guid userId);
    public Task DeleteByPublicIdsAsync(IEnumerable<string> publicIds);

}