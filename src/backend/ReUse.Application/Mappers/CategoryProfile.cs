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
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}