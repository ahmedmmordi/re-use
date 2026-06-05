using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Repository;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Application.Options;
using ReUse.Application.Services;

namespace ReUse.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services,
           IConfiguration configuration)
    {
        #region Services
        services.AddScoped<IFollowService, FollowService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICategoryFollowService, CategoryFollowService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IPromotionService, PromotionService>();
        services.AddScoped<IFavoriteService, FavoriteService>();
        services.AddScoped<INotificationPublisher, NotificationPublisher>();
        services.AddScoped<INotificationFactory, NotificationFactory>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IRecommendationService, RecommendationService>();
        services.AddScoped<IFeedbackService, FeedbackService>();
        services.AddScoped<IOfferService, OfferService>();
        #endregion

        // Recommendation weights 
        services.Configure<RecommendationWeights>(
            configuration.GetSection("RecommendationWeights"));

        return services;
    }
}