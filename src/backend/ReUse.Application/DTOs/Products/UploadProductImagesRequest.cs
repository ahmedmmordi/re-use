using Microsoft.AspNetCore.Http;

namespace ReUse.Application.DTOs.Products;

public record UploadProductImagesRequest
{
    public Guid Id { get; init; }
    public int Order { get; init; }
    public IReadOnlyList<IFormFile> Images { get; init; } = null!;
}