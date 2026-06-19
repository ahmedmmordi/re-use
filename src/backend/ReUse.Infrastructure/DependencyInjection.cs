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
using ReUse.Infrastructure.BackgroundJobs;
using ReUse.Infrastructure.Identity;
using ReUse.Infrastructure.Interfaces.Repositories;
using ReUse.Infrastructure.Interfaces.Services;
using ReUse.Infrastructure.Notifications;
using ReUse.Infrastructure.Persistence;
using ReUse.Infrastructure.Repositories;
using ReUse.Infrastructure.Security.Authorization;
using ReUse.Infrastructure.Services;
using ReUse.Infrastructure.Services.Auth;
using ReUse.Infrastructure.Services.Caching;
using ReUse.Infrastructure.Services.Communication;
using ReUse.Infrastructure.Services.Identity;
using ReUse.Infrastructure.Services.Storage;
using ReUse.Infrastructure.Services.User_Management;

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
        services.AddScoped<IUnitOfWork, UnitOfWork.UnitOfWork>();
        #endregion

        #region Repositories
        services.AddScoped<IFollowRepository, FollowRepository>();
        services.AddScoped<IProductImageRepository, ProductImageRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ICategoryFollowRepository, CategoryFollowRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IFavoriteRepository, FavoriteRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<IActivityRepository, ActivityRepository>();
        services.AddScoped<IRecommendationRepository, RecommendationRepository>();
        services.AddScoped<IFeedbackRepository, FeedbackRepository>();
        services.AddScoped<ISystemActivityLogRepository, SystemActivityLogRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<IBroadcastRepository, BroadcastRepository>();
        #endregion

        #region Services
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailConfirmationService, EmailConfirmationService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IOtpService, OtpService>();
        services.AddScoped<IIdentityUserRepository, IdentityUserRepository>();
        services.AddScoped<IAuthService, JwtAuthService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IAuthorizationHandler, ActiveUserHandler>();
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
        services.AddScoped<IActivityService, ActivityService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminBroadcastService, ReUse.Infrastructure.Services.Broadcast.AdminBroadcastService>();
        services.AddHttpClient<IPaymentService, PaymobService>();

        // View tracking (fire-and-forget, session-deduplicated)
        services.AddScoped<IViewTrackingService, ViewTrackingService>();
        #endregion

        #region AI Assistant
        services.Configure<AssistantOptions>(configuration.GetSection("Assistant"));

        var assistantOptions = configuration.GetSection("Assistant").Get<AssistantOptions>()
                               ?? new AssistantOptions();

        services.AddHttpClient<IEmbeddingService, EmbeddingService>(client =>
        {
            client.BaseAddress = new Uri(assistantOptions.EmbeddingBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient<IAssistantLlmService, GroqAssistantService>(client =>
        {

            client.Timeout = TimeSpan.FromSeconds(180);
        });
        #endregion

        #region ImageService
        services.AddScoped<IImageValidator, ImageValidator>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddScoped<IProductImageService, ProductImageService>();

        services.Configure<CloudinaryOptions>(
            configuration.GetSection("CloudinarySettings"));
        #endregion

        #region Cache
        services.AddDistributedMemoryCache();
        services.AddMemoryCache();
        services.AddSingleton<IAppCache, MemoryCacheService>();
        #endregion

        services.AddSignalR();

        services.AddScoped<INotificationChannelHandler, SignalRNotificationChannelHandler>();

        // Background jobs
        services.AddHostedService<RecentFavoriteCountRefreshJob>();
        services.AddHostedService<ScheduledBroadcastJob>();

        return services;
    }
}