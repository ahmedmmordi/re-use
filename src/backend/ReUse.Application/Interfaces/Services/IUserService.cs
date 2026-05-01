using System;

using ReUse.Application.DTOs.Users.UserProfile;
using ReUse.Application.Enums;

namespace ReUse.Application.Interfaces.Services;

public interface IUserService
{
    public Task<UserProfileResponse> GetUserProfileAsync(Guid userId);

    public Task UpdateUserProfileAsync(Guid userId, UpdateUserProfileRequest request);
    public Task UpdateImageProfileAsync(Guid userId, UpdateImageRequest request, ProfileImageOptions imageType);
    public Task DeleteProfileImageAsync(Guid userId, ProfileImageOptions imageType);
}