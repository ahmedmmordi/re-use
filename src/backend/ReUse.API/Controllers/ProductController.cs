using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;
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

    [HttpGet("{productId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid productId)
    {
        var result = await _productService.GetByIdAsync(productId);

        return Ok(result);
    }

    [HttpGet("/prpducts")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] ProductFilterParams filterParams)
    {
        var result = await _productService.GetAllProductsAsync(filterParams);
        return Ok(result);
    }

}