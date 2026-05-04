using Microsoft.AspNetCore.Http;

using ReUse.Domain.Enums;


namespace ReUse.Application.DTOs.Products.Requests;

public record UploadProductImagesRequest
{
    public Guid Id { get; init; }
    public int Order { get; init; }
    public ProductImageType Type { get; init; }
    public IReadOnlyList<IFormFile> Images { get; init; } = null!;
}