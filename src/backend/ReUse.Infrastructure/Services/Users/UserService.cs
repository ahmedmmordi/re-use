using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AutoMapper;

using ReUse.Application.DTOs.Users.UserProfile.Commands;
using ReUse.Application.DTOs.Users.UserProfile.Contracts;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.Images;
using ReUse.Application.Interfaces.Services.UserProfile;
using ReUse.Application.Options.Enums;


//using ReUse.Application.Utilities.Enums;
using ReUse.Domain.Entities;

using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ReUse.Infrastructure.Services.UserProfile;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IImageValidator _imageValidator;
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IMapper _mapper;
    public UserService(IUnitOfWork unitOfWork, IImageValidator imageValidator, ICloudinaryService cloudinaryService, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _imageValidator = imageValidator;
        _cloudinaryService = cloudinaryService;
        _mapper = mapper;
    }
    public async Task<UserProfileDto> GetUserProfileAsync(Guid userId)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);
        // I don't need Check if user is null as iam sure user already Authenticated 
        return _mapper.Map<UserProfileDto>(user);

    }

    public async Task UpdateUserProfileAsync(Guid userId, UpdateUserProfileCommand command)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);
        // I don't need Check if user is null as iam sure user already Authenticated
        _mapper.Map(command, user);
        _unitOfWork.User.Update(user!);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateImageProfileAsync(Guid userId, UpdateProfileImageCommand command)
    {
        _imageValidator.Validate(command.Image);

        var user = await _unitOfWork.User.GetByIdAsync(userId);

        var folder = $"userImages/{userId}/{command.ImageType.ToString().ToLower()}";
        var newImage = await _cloudinaryService.UpdateAsync(command.Image, folder);

        string? oldPublicId;

        if (command.ImageType == ProfileImageOptions.Profile)
        {
            oldPublicId = user!.ProfileImagePublicId;
            user.ProfileImageUrl = newImage.Url;
            user.ProfileImagePublicId = newImage.PublicId;
        }
        else
        {
            oldPublicId = user!.CoverImagePublicId;
            user.CoverImageUrl = newImage.Url;
            user.CoverImagePublicId = newImage.PublicId;
        }

        _unitOfWork.User.Update(user);
        await _unitOfWork.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(oldPublicId))
            await _cloudinaryService.DeleteAsync(oldPublicId);
    }

    public async Task DeleteProfileImageAsync(Guid userId, ProfileImageOptions imageType)
    {
        var user = await _unitOfWork.User.GetByIdAsync(userId);

        var publicId = imageType == ProfileImageOptions.Profile
            ? user!.ProfileImagePublicId
            : user!.CoverImagePublicId;

        if (string.IsNullOrWhiteSpace(publicId))
            return;

        if (imageType == ProfileImageOptions.Profile)
        {
            user.ProfileImageUrl = null;
            user.ProfileImagePublicId = null;
        }
        else
        {
            user.CoverImageUrl = null;
            user.CoverImagePublicId = null;
        }

        _unitOfWork.User.Update(user);
        await _unitOfWork.SaveChangesAsync();
        await _cloudinaryService.DeleteAsync(publicId);
    }
}