using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class FeedbackEntityTypeConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.ToTable("feedbacks");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id)
               .ValueGeneratedNever();

        builder.Property(r => r.Stars)
               .IsRequired();

        builder.Property(r => r.Comment)
               .IsRequired()
               .HasMaxLength(1000);

        builder.Property(r => r.IsDeleted)
               .IsRequired()
               .HasDefaultValue(false);

        builder.Property(r => r.DeletedAt);

        builder.Property(r => r.CreatedAt)
               .IsRequired();

        // Relationships
        builder.HasOne(r => r.Product)
               .WithMany()
               .HasForeignKey(r => r.ProductId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Rater)
               .WithMany(u => u.FeedbackGiven)
               .HasForeignKey(r => r.RaterUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Ratee)
               .WithMany(u => u.FeedbackReceived)
               .HasForeignKey(r => r.RateeUserId)
               .OnDelete(DeleteBehavior.Restrict);

        // One feedback per direction per product (Rater rates Ratee on this product only once)
        builder.HasIndex(r => new { r.ProductId, r.RaterUserId })
               .IsUnique();

        // Read paths (filtered to active rows; reads always exclude soft-deleted feedback)
        builder.HasIndex(r => new { r.RateeUserId, r.CreatedAt })
               .HasFilter("\"IsDeleted\" = false");
        builder.HasIndex(r => new { r.ProductId, r.CreatedAt })
               .HasFilter("\"IsDeleted\" = false");
        builder.HasIndex(r => r.RaterUserId);

        // Domain invariants
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_Feedback_Stars_1_5",
                "\"Stars\" BETWEEN 1 AND 5"
            );

            t.HasCheckConstraint(
                "CK_Feedback_Rater_Not_Ratee",
                "\"RaterUserId\" <> \"RateeUserId\""
            );
        });
    }
}