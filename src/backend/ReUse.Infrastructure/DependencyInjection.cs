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
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Application.Options;
using ReUse.Application.Services;
using ReUse.Infrastructure.Repositories;
using ReUse.Infrastructure.Security.Authorization;
using ReUse.Infrastructure.Services.Auth;
using ReUse.Infrastructure.Services.Identity;
using ReUse.Infrastructure.Services.Storage;
namespace ReUse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {

        #region UnitOfWork
        services.AddScoped<IUnitOfWork,
        UnitOfWork.UnitOfWork>();
        #endregion

        #region Repositorises
        services.AddScoped<IFollowRepository,
        FollowRepository>();
        services.AddScoped<IProductImageRepository,
        ProductImageRepository>();
        services.AddScoped<ICategoryRepository,
        CategoryRepository>();
        #endregion

        #region Services
        services.AddScoped<IAuthService,
        JwtAuthService>();
        services.AddScoped<IAccountService,
        AccountService>();
        services.AddScoped<IAuthorizationHandler,
        ActiveUserHandler>();
        #endregion

        #region ImageServic
        services.AddScoped<IImageValidator,
        ImageValidator>();
        services.AddScoped<ICloudinaryService,
        CloudinaryService>();
        services.AddScoped<IProductImageService,
        ProductImageService>();

        services.Configure<CloudinaryOptions>(
        configuration.GetSection("CloudinarySettings"));
        #endregion

        #region DistributedCache
        services.AddDistributedMemoryCache();
        #endregion

        return services;
    }
}