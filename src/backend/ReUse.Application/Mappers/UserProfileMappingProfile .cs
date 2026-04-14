using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.Mappers;

using AutoMapper;

using ReUse.Application.DTOs.Users.UserManagement.Contracts;
using ReUse.Application.DTOs.Users.UserProfile.Commands;
using ReUse.Application.DTOs.Users.UserProfile.Contracts;
using ReUse.Domain.Entities;

public class UserProfileMappingProfile : Profile
{
    public UserProfileMappingProfile()
    {
        // Only maps what it should fields
        CreateMap<User, UserProfileDto>()
        // Computed/aggregate fields — default to 0 on registration
            .ForMember(dest => dest.FollowersCount, opt => opt.MapFrom(src => src.Followers.Count))
            .ForMember(dest => dest.FollowingCount, opt => opt.MapFrom(src => src.Following.Count));

        CreateMap<UpdateUserProfileCommand, User>()
       .ForAllMembers(opts =>
        opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}