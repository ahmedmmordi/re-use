# Dto Guide

## Naming
- Dto should be named <Name>Request.cs or <Name>Response.cs depending on the use case, where <Name> is the name of the entity or operation they represent
  - For example, If you have an operation called CreateUser, you can have CreateUserRequest.cs for the data needed to create a user, and CreateUserResponse.cs for the data returned after creating a user
- Dto may also be named <Name>Dto.cs if it represents the data not used in request or response scenarios, but rather for internal data transfer between layers

## Type
- Dto should be record types to ensure immutability and value-based equality 
- use Positional Record Types or Property-based Record Types depending on the complexity of the data and the need for default values
ex:
- Positional Record Type:
```csharp
public record CreateUserRequest(string FullName, string Email, string Password);
```
- Property-based Record Type:
```csharp
public record UploadProductImagesRequest
{
    public Guid Id { get; init; }
    public int Order { get; init; }
    public IReadOnlyList<IFormFile> Images { get; init; } = null!;
}
```

## Validation
- for request Dto, use fluent validation to ensure that the data is valid before processing it in the application layer
- create a validator class for each request Dto in the same folder as the Dto, and name it <DtoName>Validator.cs
- for example, if you have a CreateCategoryRequest.cs, you can create a CreateCategoryRequestValidator.cs with the following content:
```csharp
using FluentValidation;
namespace ReUse.Application.DTOs.Categories;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100)
            .Must(name => !string.IsNullOrWhiteSpace(name))
            .WithMessage("Name cannot be whitespace");

        RuleFor(x => x.Slug)
            .NotEmpty()
            .MaximumLength(100)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug must be lowercase, hyphen-separated, and valid");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => x.Description != null);
    
}
```

## Mapping
- for mapping between Dto and domain entities, use AutoMapper to simplify the mapping process and reduce boilerplate code
- create a mapping profile for each entity in the `src/backend/ReUse.Application/Mappers` folder and name it <EntityName>Profile.cs
- for example, if you have a Category entity, you can create a CategoryProfile.cs with the following content:
```csharp
using AutoMapper;

using ReUse.Application.DTOs.Categories;
using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class CategoryProfile : Profile
{
    public CategoryProfile()
    {
        // Entity → DTO 
        CreateMap<Category, CategoryResponse>();

        // Create DTO → Entity
        CreateMap<CreateCategoryRequest, Category>();
}
```