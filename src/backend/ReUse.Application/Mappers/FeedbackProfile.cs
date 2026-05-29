using AutoMapper;

using ReUse.Application.DTOs.Feedback;
using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class FeedbackProfile : Profile
{
    public FeedbackProfile()
    {
        CreateMap<Domain.Entities.Feedback, FeedbackResponse>()
            .ForMember(dest => dest.Rater, opt => opt.MapFrom(src => src.Rater))
            .ForMember(dest => dest.Ratee, opt => opt.MapFrom(src => src.Ratee));

        CreateMap<User, FeedbackUserResponse>();
    }
}