using System.Text.Json;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Extensions;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Services;
using ReUse.Infrastructure.Models.Paymob;

namespace ReUse.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductController : ControllerBase
{
    private readonly IProductImageService _productImageService;
    private readonly IProductService _productService;
    private readonly IRecommendationService _recommendationService;
    private readonly IPromotionService _promotionService;
    //private readonly IViewTrackingService _viewTrackingService;
    private readonly IServiceScopeFactory _scopeFactory;

    public ProductController(
        IProductImageService productImageService,
        IProductService productService,
        IRecommendationService recommendationService,
        IPromotionService promotionService,
        IServiceScopeFactory scopeFactory)
    {
        _productImageService = productImageService;
        _productService = productService;
        _recommendationService = recommendationService;
        _promotionService = promotionService;
        //_viewTrackingService = viewTrackingService;
        _scopeFactory = scopeFactory;
    }

    [HttpPost("regular")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateRegularProduct([FromForm] CreateRegularProductRequest request)
    {
        var sellerId = User.GetBusinessId();
        var result = await _productService.CreateRegularProductAsync(request, sellerId);
        return CreatedAtAction(nameof(GetById), new { productId = result.Id }, result);
    }

    [HttpPost("swap")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateSwapProduct([FromForm] CreateSwapProductRequest request)
    {
        var sellerId = User.GetBusinessId();
        var result = await _productService.CreateSwapProductAsync(request, sellerId);
        return CreatedAtAction(nameof(GetById), new { productId = result.Id }, result);
    }

    [HttpPost("wanted")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateWantedProduct([FromForm] CreateWantedProductRequest request)
    {
        var sellerId = User.GetBusinessId();
        var result = await _productService.CreateWantedProductAsync(request, sellerId);
        return CreatedAtAction(nameof(GetById), new { productId = result.Id }, result);
    }

    [HttpGet("{productId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid productId)
    {
        var result = await _productService.GetByIdAsync(productId);

        var userId = User.Identity?.IsAuthenticated == true ? User.GetBusinessId() : (Guid?)null;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var ua = Request.Headers.UserAgent.ToString();

        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var svc = scope.ServiceProvider.GetRequiredService<IViewTrackingService>();
            await svc.TrackViewAsync(productId, userId, ip, ua);
        });

        if (userId.HasValue)
        {
            _ = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var activityService = scope.ServiceProvider.GetRequiredService<IActivityService>();
                await activityService.CreateActivityAsync(
                    userId.Value, productId, "product.viewed",
                    $"Viewed product: {result.Title}");
            });
        }

        return Ok(result);
    }

    [HttpGet("{productId}/similar")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<ProductResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSimilar(Guid productId, [FromQuery] int count = 8)
    {
        var userId = User.Identity?.IsAuthenticated == true
            ? User.GetBusinessId()
            : (Guid?)null;

        var result = await _recommendationService.GetSimilarProductsAsync(productId, userId, count);
        return Ok(result);
    }

    [HttpGet("")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] ProductFilterParams filterParams)
    {
        var userId = User.Identity?.IsAuthenticated == true
            ? User.GetBusinessId()
            : (Guid?)null;

        var result = await _productService.GetAllProductsAsync(filterParams, userId);
        return Ok(result);
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(SellerDashboardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyListings([FromQuery] MyListingsParams filterParams)
    {
        var userId = User.GetBusinessId();
        var result = await _productService.GetMyListingsAsync(userId, filterParams);
        return Ok(result);
    }

    [HttpGet("{userId:guid}/products")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResult<ProductResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetProductsByUser(Guid userId, [FromQuery] ProductFilterParams filter)
    {
        var result = await _productService.GetPublicProductsByUserAsync(userId, filter);
        return Ok(result);
    }

    [HttpPatch("regular/{id:guid}")]
    public async Task<IActionResult> UpdateRegular(Guid id, [FromBody] UpdateRegularProductRequest request)
    {
        var userId = User.GetBusinessId();
        await _productService.UpdateRegularProductAsync(id, request, userId);
        return NoContent();
    }

    [HttpPatch("swap/{id:guid}")]
    public async Task<IActionResult> UpdateSwap(Guid id, [FromBody] UpdateSwapProductRequest request)
    {
        var userId = User.GetBusinessId();
        await _productService.UpdateSwapProductAsync(id, request, userId);
        return NoContent();
    }

    [HttpPatch("wanted/{id:guid}")]
    public async Task<IActionResult> UpdateWanted(Guid id, [FromBody] UpdateWantedProductRequest request)
    {
        var userId = User.GetBusinessId();
        await _productService.UpdateWantedProductAsync(id, request, userId);
        return NoContent();
    }

    [HttpPost("{productId:guid}/images/offer")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadOfferImages(Guid productId, [FromForm] UploadMoreImagesRequest request)
    {
        var userId = User.GetBusinessId();
        var result = await _productImageService.UploadOfferImagesAsync(productId, request, userId);
        return Ok(result);
    }

    [HttpPost("{productId:guid}/images/wanted")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadWantedImages(Guid productId, [FromForm] UploadMoreImagesRequest request)
    {
        var userId = User.GetBusinessId();
        var result = await _productImageService.UploadWantedImagesAsync(productId, request, userId);
        return Ok(result);
    }

    [HttpDelete("images/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        var userId = User.GetBusinessId();
        await _productImageService.DeleteImageAsync(imageId, userId);
        return NoContent();
    }

    [HttpPut("images/reorder")]
    public async Task<IActionResult> ReorderImages([FromBody] ReorderImagesRequest request)
    {
        var userId = User.GetBusinessId();
        await _productImageService.ReorderImagesAsync(request, userId);
        return NoContent();
    }

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid productId)
    {
        var userId = User.GetBusinessId();
        await _productService.DeleteProductAsync(productId, userId);
        return NoContent();
    }

    [HttpGet("premium/price")]
    public IActionResult GetPremiumPrice([FromQuery] PremiumRequest request)
    {
        var amount = _promotionService.CalculatePremiumAmount(request.DurationDays);
        return Ok(new { request.DurationDays, amount, currency = "EGP" });
    }

    [HttpPost("{productId:guid}/premium")]
    public async Task<IActionResult> MakePremium(Guid productId, PremiumRequest dto)
    {
        var userId = User.GetBusinessId();
        var payUrl = await _promotionService.CreateProductPremiumPayment(productId, userId, dto.DurationDays);
        return Ok(new { paymentUrl = payUrl });
    }

    [HttpPost("premium/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> PremiumCallback([FromBody] PaymobCallbackRequest payload)
    {
        string? receivedHmac = Request.Query["hmac"];
        if (string.IsNullOrEmpty(receivedHmac))
        {
            return BadRequest("HMAC is required");
        }

        await _promotionService.PayCallback(receivedHmac, payload);
        return Ok();
    }

    [HttpPost("/api/me/deals")]
    [Authorize]
    public async Task<IActionResult> GetMyDeals()
    {
        var userId = User.GetBusinessId();

        var deals = await _productService.GetMyDealsAsync(userId);

        return Ok(deals);
    }

    [HttpPost("{productId:guid}/close")]
    [Authorize]
    public async Task<IActionResult> Close(
        Guid productId,
        [FromBody] CloseProductRequest request)
    {
        var userId = User.GetBusinessId();

        await _productService.CloseProductAsync(
            productId,
            userId,
            request);

        return NoContent();
    }

    [HttpPost("/api/deals/{dealId:guid}/confirm")]
    [Authorize]
    public async Task<IActionResult> ConfirmDeal(Guid dealId)
    {
        var userId = User.GetBusinessId();

        await _productService.ConfirmDealAsync(dealId, userId);

        return NoContent();
    }

    [HttpPost("/api/deals/{dealId:guid}/reject")]
    [Authorize]
    public async Task<IActionResult> RejectDeal(Guid dealId)
    {
        var userId = User.GetBusinessId();

        await _productService.RejectDealAsync(dealId, userId);

        return NoContent();
    }
}