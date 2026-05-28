using AutoMapper;

using ReUse.Application.DTOs.Ratings;
using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class RatingProfile : Profile
{
    public RatingProfile()
    {
        CreateMap<UserRating, RatingResponse>()
            .ForMember(dest => dest.Rater, opt => opt.MapFrom(src => src.Rater))
            .ForMember(dest => dest.Ratee, opt => opt.MapFrom(src => src.Ratee));

        CreateMap<User, RatingUserResponse>();
    }
}