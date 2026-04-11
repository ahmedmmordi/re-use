using System;

using ReUse.Application.DTOs.Users.UserProfile.Commands;
using ReUse.Application.DTOs.Users.UserProfile.Contracts;
using ReUse.Application.Options.Enums;

namespace ReUse.Application.Interfaces.Services.UserProfile;

public interface IUserService
{
    public Task<UserProfileDto> GetUserProfileAsync(Guid userId);

    public Task UpdateUserProfileAsync(Guid userId, UpdateUserProfileCommand command);
    public Task UpdateImageProfileAsync(Guid userId, UpdateProfileImageCommand command);
    public Task DeleteProfileImageAsync(Guid userId, ProfileImageOptions imageType);
}