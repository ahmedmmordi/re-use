using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs.Categories.Contracts;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.Categories;

namespace ReUse.API.Controllers;

/// <summary>
/// Public endpoints for browsing categories
/// </summary>
[ApiController]
[Route("api/categories")]
[Tags("Categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _service;

    public CategoriesController(ICategoryService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get all categories as a tree structure
    /// </summary>
    /// <param name="activeOnly">
    /// If true, returns only active categories (default: true)
    /// </param>
    /// <returns>List of categories with nested subcategories</returns>
    /// <response code="200">Categories retrieved successfully</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<CategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = true)
    {
        var categories = await _service.GetAllAsync(activeOnly);
        return Ok(categories);
    }

    /// <summary>
    /// Get a single category by ID
    /// </summary>
    /// <param name="id">Category ID</param>
    /// <returns>Category details</returns>
    /// <response code="200">Category retrieved successfully</response>
    /// <response code="404">Category not found</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var category = await _service.GetByIdAsync(id);

        if (category == null)
            return NotFound();

        return Ok(category);
    }
}