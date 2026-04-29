using Microsoft.AspNetCore.Mvc;

using ReUse.Application.Interfaces.Services;
namespace ReUse.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductController : ControllerBase
{
    private readonly IProductImageService _productImageService;
    public ProductController(IProductImageService productImageService)
    {
        _productImageService = productImageService;
    }
    //[HttpPost]
    //public async Task<IActionResult> UploadImages(
    // [FromForm] ProductImageCommand command)
    //{

    //    var result = await _productImageService.UploadMultipleImagesAsync(command);

    //    return Ok(new
    //    {
    //        Message = "Images uploaded successfully",
    //        Images = result
    //    });
    //
    //}

}