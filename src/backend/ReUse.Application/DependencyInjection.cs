using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Application.Interfaces.Services;
using ReUse.Application.Options;
using ReUse.Application.Services;
using ReUse.Application.Services.Assistant;

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
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<IAssistantService, AssistantService>();
        services.AddScoped<ISystemActivityLogService, SystemActivityLogService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IDealService, DealService>();

        #endregion

        // Recommendation weights 
        services.Configure<RecommendationWeights>(
            configuration.GetSection("RecommendationWeights"));

        return services;
    }
}