using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.Interfaces.Services;
namespace ReUse.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductController : ControllerBase
{
    private readonly IProductImageService _productImageService;
    private readonly IProductService _productService;
    public ProductController(IProductImageService productImageService, IProductService productService)
    {
        _productImageService = productImageService;
        _productService = productService;
    }

    [HttpPost("regular")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateRegularProduct([FromForm] CreateRegularProductRequest request)
    {
        var sellerId = User.GetBusinessId();
        var result = await _productService.CreateRegularProductAsync(request, sellerId);
        return Ok(result);

    }

    [HttpPost("swap")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateSwapProduct([FromForm] CreateSwapProductRequest request)
    {
        var sellerId = User.GetBusinessId();

        var result = await _productService.CreateSwapProductAsync(request, sellerId);

        return Ok(result);
    }

    [HttpPost("wanted")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateWantedProduct([FromForm] CreateWantedProductRequest request)
    {
        var sellerId = User.GetBusinessId();

        var result = await _productService.CreateWantedProductAsync(request, sellerId);

        return Ok(result);
    }

}