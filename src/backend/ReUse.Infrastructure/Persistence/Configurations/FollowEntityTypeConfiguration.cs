using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class FollowEntityTypeConfiguration : IEntityTypeConfiguration<Follow>
{
    public void Configure(EntityTypeBuilder<Follow> builder)
    {
        builder.ToTable("Follows");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .ValueGeneratedNever(); // We control Guid generation in the model

        // Foreign Keys
        builder.Property(x => x.FollowerId)
            .IsRequired();

        builder.Property(x => x.FollowingId)
            .IsRequired();

        // A user cannot follow the same person twice
        builder.HasIndex(x => new { x.FollowerId, x.FollowingId })
            .IsUnique();

        // FollowerUser: the person who initiated the follow
        builder.HasOne(x => x.FollowerUser)
            .WithMany(x => x.Following)
            .HasForeignKey(x => x.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);

        // FollowingUser: the person being followed
        builder.HasOne(x => x.FollowingUser)
            .WithMany(x => x.Followers)
            .HasForeignKey(x => x.FollowingId)
            .OnDelete(DeleteBehavior.Restrict);

        // Audit
        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();
    }
}