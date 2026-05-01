using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Repository;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Application.Options;
using ReUse.Application.Services;
using ReUse.Infrastructure.Identity;
using ReUse.Infrastructure.Interfaces.Repositories;
using ReUse.Infrastructure.Interfaces.Services;
using ReUse.Infrastructure.Persistence;
using ReUse.Infrastructure.Repositories;
using ReUse.Infrastructure.Security.Authorization;
using ReUse.Infrastructure.Services.Auth;
using ReUse.Infrastructure.Services.Caching;
using ReUse.Infrastructure.Services.Communication;
using ReUse.Infrastructure.Services.Identity;
using ReUse.Infrastructure.Services.Storage;

namespace ReUse.Infrastructure;

public static class DependencyInjection
{

    #region DataBase
    public static IServiceCollection AddDatabase(this IServiceCollection services,
    IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("pgsql");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddDbContext<AppIdentityDbContext>(options =>
            options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(AppIdentityDbContext).Assembly.FullName)));

        return services;
    }
    #endregion

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDatabase(configuration);

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
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailConfirmationService, EmailConfirmationService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<IIdentityUserRepository, IdentityUserRepository>();
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

        #region Cache
        services.AddDistributedMemoryCache();
        services.AddMemoryCache();
        services.AddSingleton<IAppCache, MemoryCacheService>();
        #endregion

        return services;
    }
}