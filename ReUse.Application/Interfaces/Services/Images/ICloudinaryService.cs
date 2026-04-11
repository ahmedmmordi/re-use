using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

using ReUse.Application.DTOs.Users.UserProfile.Commands;
using ReUse.Application.DTOs.Users.UserProfile.Contracts;

namespace ReUse.Application.Interfaces.Services.Images;

public interface ICloudinaryService
{
    Task<ImageUpdatedDto> UpdateAsync(IFormFile file, string folder);
    Task DeleteAsync(string publicId);

}