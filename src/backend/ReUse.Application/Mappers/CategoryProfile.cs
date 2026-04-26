using AutoMapper;

using ReUse.Application.DTOs.Categories.Commands;
using ReUse.Application.DTOs.Categories.Contracts;
using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class CategoryProfile : Profile
{
    public CategoryProfile()
    {
        // Entity → DTO
        CreateMap<Category, CategoryDto>()
            .ForMember(dest => dest.Subcategories,
                opt => opt.MapFrom(src => src.Subcategories));

        // Create DTO → Entity
        CreateMap<CreateCategoryDto, Category>();

        // Update DTO → Entity
        CreateMap<UpdateCategoryDto, Category>()
            .ForMember(d => d.Name, opt => opt.Condition(s => s.Name != null))
            .ForMember(d => d.Slug, opt => opt.Condition(s => s.Slug != null))
            .ForMember(d => d.Description, opt => opt.Condition(s => s.Description != null))
            .ForMember(d => d.IconUrl, opt => opt.Condition(s => s.IconUrl != null))
            .ForMember(d => d.IsActive, opt => opt.Condition(s => s.IsActive.HasValue))
            .ForMember(d => d.ParentId, opt => opt.Condition(s => s.ParentId.HasValue));
    }
}