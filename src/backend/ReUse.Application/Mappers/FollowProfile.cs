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
            .ForMember(d => d.FollowersCount,
                opt => opt.MapFrom(s => s.Followers.Count()));

        // Follow -> FollowResultDto (for FollowUser endpoint)
        CreateMap<Follow, FollowResultDto>()
            .ConstructUsing(src => new FollowResultDto(
                src.FollowingUser.Id,
                src.FollowingUser.FullName,
                true));


    }
}