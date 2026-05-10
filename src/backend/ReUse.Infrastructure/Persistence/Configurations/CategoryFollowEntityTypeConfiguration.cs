using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class CategoryFollowEntityTypeConfiguration : IEntityTypeConfiguration<CategoryFollow>
{
    public void Configure(EntityTypeBuilder<CategoryFollow> builder)
    {
        builder.ToTable("category_follows");

        // PK
        builder.HasKey(cf => cf.Id);
        builder.Property(cf => cf.Id)
               .ValueGeneratedNever();

        // FK → User
        builder.Property(cf => cf.UserId)
               .IsRequired();

        builder.HasOne(cf => cf.User)
               .WithMany(u => u.CategoryFollows)
               .HasForeignKey(cf => cf.UserId)
               .OnDelete(DeleteBehavior.Cascade);

        // FK → Category
        builder.Property(cf => cf.CategoryId)
               .IsRequired();

        builder.HasOne(cf => cf.Category)
               .WithMany(c => c.Followers)
               .HasForeignKey(cf => cf.CategoryId)
               .OnDelete(DeleteBehavior.Cascade);

        // Unique
        builder.HasIndex(cf => new { cf.UserId, cf.CategoryId })
               .IsUnique();

        // Audit
        builder.Property(cf => cf.CreatedAt)
               .IsRequired();
    }
}