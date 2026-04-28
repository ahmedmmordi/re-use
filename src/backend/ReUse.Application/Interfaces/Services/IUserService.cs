using System;

using ReUse.Application.DTOs.Users.UserProfile;
using ReUse.Application.Enums;

namespace ReUse.Application.Interfaces.Services;

public interface IUserService
{
    public Task<UserProfileResponse> GetUserProfileAsync(Guid userId);

    public Task UpdateUserProfileAsync(Guid userId, UpdateUserProfileRequest command);
    public Task UpdateImageProfileAsync(Guid userId, UpdateProfileImageRequest command);
    public Task DeleteProfileImageAsync(Guid userId, ProfileImageOptions imageType);
}