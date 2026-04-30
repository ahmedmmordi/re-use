using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using ReUse.API.Responses;
using ReUse.Application.DTOs.Categories;
using ReUse.Application.Interfaces.Services;

namespace ReUse.API.Controllers;

[ApiController]
[Route("api/categories")]
[Tags("Categories")]
[Authorize(Roles = "Admin")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _service;

    public CategoriesController(ICategoryService service)
    {
        _service = service;
    }


    [HttpGet("tree")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllTree()
    {
        var categories = await _service.GetCategoryTreeAsync();
        return Ok(categories);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] CategoriesFilterParams filterParams)
    {
        var categories = await _service.GetCategoriesAsync(filterParams);
        return Ok(categories);
    }

    [AllowAnonymous]
    [HttpGet("{categoryId}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid categoryId)
    {
        var category = await _service.GetByIdAsync(categoryId);

        return Ok(category);
    }


    [HttpPost]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var category = await _service.CreateAsync(request);

        return CreatedAtAction(nameof(GetById), new { categoryId = category.Id }, category);
    }


    [HttpPatch("{categoryId}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid categoryId, [FromBody] UpdateCategoryRequest request)
    {
        var category = await _service.UpdateAsync(categoryId, request);
        return NoContent();
    }


    [HttpDelete("{categoryId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid categoryId)
    {
        await _service.DeleteAsync(categoryId);
        return NoContent();
    }

}