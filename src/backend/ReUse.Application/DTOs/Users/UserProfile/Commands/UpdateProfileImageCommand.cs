using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

using ReUse.Application.Options.Enums;

namespace ReUse.Application.DTOs.Users.UserProfile.Commands;

public record UpdateProfileImageCommand(IFormFile Image, ProfileImageOptions ImageType);