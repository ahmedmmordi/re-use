using Microsoft.EntityFrameworkCore;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<ProductComment> ProductComments { get; set; }

    public DbSet<Follow> Follows { get; set; }

    public DbSet<CategoryFollow> CategoryFollows { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Conversation> Conversations { get; set; }

    public DbSet<Favorite> Favorites { get; set; }
    public DbSet<ActivityEvent> ActivityEvents { get; set; }

    public DbSet<Payment> Payments { get; set; }

    public DbSet<Notification> Notifications { get; set; }
    public DbSet<NotificationDelivery> NotificationDeliveries { get; set; }
    public DbSet<UserNotificationSetting> UserNotificationSettings { get; set; }

    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<ProductDeal> ProductDeals { get; set; }

    public DbSet<Report> Reports { get; set; }

    public DbSet<BroadcastMessage> BroadcastMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply Fluent Configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    // Auto Set Time => For CreatedAt and UpdatedAt
    public override async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}