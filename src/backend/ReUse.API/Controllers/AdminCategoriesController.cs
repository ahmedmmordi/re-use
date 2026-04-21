using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs.Categories.Commands;
using ReUse.Application.DTOs.Categories.Contracts;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.Categories;

namespace ReUse.API.Controllers;

/// <summary>
/// Admin endpoints for managing categories
/// </summary>
[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
[Tags("Categories - Admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly ICategoryService _service;

    public AdminCategoriesController(ICategoryService service)
    {
        _service = service;
    }

    /// <summary>
    /// Create a new category (root or subcategory)
    /// </summary>
    /// <param name="dto">Category creation data</param>
    /// <returns>The created category</returns>
    /// <response code="201">Category created successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="404">Parent category not found</response>
    [HttpPost]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        var category = await _service.CreateAsync(dto);

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    /// <summary>
    /// Get a category by ID (Admin view)
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

    /// <summary>
    /// Update an existing category
    /// </summary>
    /// <param name="id">Category ID</param>
    /// <param name="dto">Updated category data</param>
    /// <returns>Updated category</returns>
    /// <response code="200">Category updated successfully</response>
    /// <response code="400">Invalid request data</response>
    /// <response code="404">Category not found</response>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _service.UpdateAsync(id, dto);
        return Ok(category);
    }

    /// <summary>
    /// Delete a category
    /// </summary>
    /// <param name="id">Category ID</param>
    /// <returns>Success message</returns>
    /// <response code="200">Category deleted successfully</response>
    /// <response code="404">Category not found</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return Ok(new { message = "Category deleted successfully" });
    }
}