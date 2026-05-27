using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Products;
using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

/// <summary>
/// Admin endpoints for managing products
/// </summary>
[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin")]
[Tags("Products - Admin")]
public class AdminProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public AdminProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>
    /// Get all products (Admin view) with search, filters, sorting and pagination.
    /// Includes products of every status (Active, Sold, Closed, Deleted, UnderReview).
    /// </summary>
    /// <response code="200">Products retrieved successfully</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] AdminProductFilterParams filterParams)
    {
        var result = await _productService.GetAllForAdminAsync(filterParams);
        return Ok(result);
    }

    /// <summary>
    /// Get a product by ID (Admin view, includes any status).
    /// </summary>
    /// <param name="productId">Product ID</param>
    /// <response code="200">Product retrieved successfully</response>
    /// <response code="404">Product not found</response>
    [HttpGet("{productId:guid}")]
    [ProducesResponseType(typeof(ProductDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid productId)
    {
        var result = await _productService.GetForAdminByIdAsync(productId);
        return Ok(result);
    }

    /// <summary>
    /// Delete a product (Admin). Performs a soft-delete by setting Status to Deleted.
    /// </summary>
    /// <param name="productId">Product ID</param>
    /// <response code="200">Product deleted successfully</response>
    /// <response code="404">Product not found</response>
    [HttpDelete("{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid productId)
    {
        await _productService.DeleteProductAsync(productId, Guid.Empty, isAdmin: true);
        return Ok(new { message = "Product deleted successfully" });
    }

    /// <summary>
    /// Get total product counts grouped by status (Admin dashboard summary).
    /// </summary>
    /// <response code="200">Summary retrieved successfully</response>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(AdminProductsSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _productService.GetAdminSummaryAsync();
        return Ok(result);
    }

    /// <summary>
    /// Update a Regular product (Admin) without ownership restriction.
    /// </summary>
    /// <response code="204">Product updated successfully</response>
    /// <response code="400">Invalid product type or request data</response>
    /// <response code="404">Product not found</response>
    [HttpPatch("regular/{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRegular(Guid productId, [FromBody] UpdateRegularProductRequest request)
    {
        await _productService.UpdateRegularProductAsync(productId, request, Guid.Empty, isAdmin: true);
        return NoContent();
    }

    /// <summary>
    /// Update a Swap product (Admin) without ownership restriction.
    /// </summary>
    /// <response code="204">Product updated successfully</response>
    /// <response code="400">Invalid product type or request data</response>
    /// <response code="404">Product not found</response>
    [HttpPatch("swap/{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSwap(Guid productId, [FromBody] UpdateSwapProductRequest request)
    {
        await _productService.UpdateSwapProductAsync(productId, request, Guid.Empty, isAdmin: true);
        return NoContent();
    }

    /// <summary>
    /// Update a Wanted product (Admin) without ownership restriction.
    /// </summary>
    /// <response code="204">Product updated successfully</response>
    /// <response code="400">Invalid product type or request data</response>
    /// <response code="404">Product not found</response>
    [HttpPatch("wanted/{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateWanted(Guid productId, [FromBody] UpdateWantedProductRequest request)
    {
        await _productService.UpdateWantedProductAsync(productId, request, Guid.Empty, isAdmin: true);
        return NoContent();
    }

    /// <summary>
    /// Change a product status (Admin moderation).
    /// </summary>
    /// <response code="204">Product status changed successfully</response>
    /// <response code="400">Invalid status</response>
    /// <response code="404">Product not found</response>
    [HttpPatch("{productId:guid}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeStatus(Guid productId, [FromBody] ChangeProductStatusRequest request)
    {
        await _productService.ChangeProductStatusByAdminAsync(productId, request.Status);
        return NoContent();
    }

    /// <summary>
    /// Restore a previously deleted product (Admin). Sets Status back to Active.
    /// </summary>
    /// <response code="204">Product restored successfully</response>
    /// <response code="400">Product is not in a deleted state</response>
    /// <response code="404">Product not found</response>
    [HttpPatch("{productId:guid}/restore")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Restore(Guid productId)
    {
        await _productService.RestoreProductByAdminAsync(productId);
        return NoContent();
    }
}