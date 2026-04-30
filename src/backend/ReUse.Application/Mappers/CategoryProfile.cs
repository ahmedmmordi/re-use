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

        // Update DTO → Entity
        CreateMap<UpdateCategoryRequest, Category>()
            .ForMember(d => d.Name, opt => opt.Condition(s => s.Name != null))
            .ForMember(d => d.Slug, opt => opt.Condition(s => s.Slug != null))
            .ForMember(d => d.Description, opt => opt.Condition(s => s.Description != null))
            .ForMember(d => d.IconUrl, opt => opt.Condition(s => s.IconUrl != null))
            .ForMember(d => d.IsActive, opt =>
            {
                opt.Condition(s => s.IsActive.HasValue);
                opt.MapFrom(s => s.IsActive!.Value);
            })
            .ForMember(d => d.ParentId, opt =>
                opt.Condition(s => s.ParentId.HasValue));
    }
}