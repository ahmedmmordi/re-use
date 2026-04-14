using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Repository;
using ReUse.Application.Interfaces.Services.Account_Managemet;
using ReUse.Application.Interfaces.Services.Auth;
using ReUse.Application.Interfaces.Services.Images;
using ReUse.Application.Interfaces.Services.UserProfile;
using ReUse.Application.Options.Cloudniary;
using ReUse.Infrastructure.Repositories;
using ReUse.Infrastructure.Security.Authorization;
using ReUse.Infrastructure.Services.Account_Management;
using ReUse.Infrastructure.Services.Auth;
using ReUse.Infrastructure.Services.Images;
using ReUse.Infrastructure.Services.UserProfile;
namespace ReUse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services,
           IConfiguration configuration)
    {



        #region UnitOfWork
        services.AddScoped<IUnitOfWork, UnitOfWork.UnitOfWork>();
        #endregion

        #region Repositorises
        services.AddScoped<IFollowsRepository, FollowsRepository>();
        #endregion


        #region Services
        services.AddScoped<IAuthService, JwtAuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IAuthorizationHandler, ActiveUserHandler>();
        #endregion

        #region ImageServic
        services.AddScoped<IImageValidator, ImageValidator>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.Configure<CloudinaryOptions>(
        configuration.GetSection("CloudinarySettings"));
        #endregion

        #region DistributedCache
        services.AddDistributedMemoryCache();
        #endregion


        return services;
    }


}