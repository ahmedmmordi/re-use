using ReUse.Application.Interfaces.Repository;

namespace ReUse.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
    IUserRepository User { get; }
    IFollowRepository Follow { get; }
    IProductImageRepository ProductImages { get; }
    ICategoryRepository Category { get; }

    IProductRepository Product { get; }

    ICategoryFollowRepository CategoryFollow { get; }
    IFavoriteRepository Favorites { get; }

    INotificationRepository Notifications { get; }
    IBroadcastRepository Broadcasts { get; }

    IPaymentRepository Payments { get; }

    IRecommendationRepository Recommendations { get; }
    IConversationRepository Conversation { get; }
    IMessageRepository Message { get; }


    ICommentRepository Comments { get; }
    IActivityRepository activities { get; }

    IFeedbackRepository Feedback { get; }

    IReportRepository Reports { get; }
    IProductDealRepository ProductDeal { get; }

    Task<int> SaveChangesAsync();
    void Dispose();
}