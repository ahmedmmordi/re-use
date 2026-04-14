using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AutoMapper;

using ReUse.Application.DTOs.Users.Follows.Contracts;
using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class FollowsMappingProfile : Profile
{
    public FollowsMappingProfile()
    {
        // User -> FollowsDtos (for GetFollowers / GetFollowings)
        CreateMap<User, FollowsDtos>()
            .ForMember(dest => dest.Id,
                opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.FullName,
                opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.ProfileImageUrl,
                opt => opt.MapFrom(src => src.ProfileImageUrl))
            .ForMember(dest => dest.Bio,
                opt => opt.MapFrom(src => src.Bio))
            .ForMember(dest => dest.followersCount,
                opt => opt.MapFrom(src => src.Followers.Count));

        // Follow -> FollowResultDto (for FollowUser endpoint)
        CreateMap<Follow, FollowResultDto>()
            .ConstructUsing((src, ctx) => new FollowResultDto(
                src.FollowingUser.Id,
                src.FollowingUser.FullName,
                true));


    }
}