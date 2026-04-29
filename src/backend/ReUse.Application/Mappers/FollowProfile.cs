using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AutoMapper;

using ReUse.Application.DTOs.Follows;
using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class FollowProfile : Profile
{
    public FollowProfile()
    {
        // User -> FollowDto (for GetFollowers / GetFollowings)
        CreateMap<User, FollowDto>()
            .ForMember(dest => dest.Id,
                opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.FullName,
                opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.ProfileImageUrl,
                opt => opt.MapFrom(src => src.ProfileImageUrl))
            .ForMember(dest => dest.Bio,
                opt => opt.MapFrom(src => src.Bio))
            .ForMember(dest => dest.FollowersCount,
                opt => opt.MapFrom(src => src.Followers.Count));

        // Follow -> FollowResultDto (for FollowUser endpoint)
        CreateMap<Follow, FollowResultDto>()
            .ForMember(dest => dest.FollowingId,
                opt => opt.MapFrom(src => src.FollowingUser.Id))
            .ForMember(dest => dest.FullName,
                opt => opt.MapFrom(src => src.FollowingUser.FullName))
            .ForMember(dest => dest.IsNowFollowing,
                opt => opt.MapFrom(_ => true));


    }
}