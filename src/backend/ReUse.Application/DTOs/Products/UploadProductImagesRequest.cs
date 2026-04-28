
using Microsoft.AspNetCore.Http;

namespace ReUse.Application.DTOs.Products;

public class UploadProductImagesRequest
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public IEnumerable<IFormFile> Images { get; set; } = null!;
}