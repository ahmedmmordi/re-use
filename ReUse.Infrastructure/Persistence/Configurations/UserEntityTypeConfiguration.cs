using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class UserEntityTypeConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {

        builder.ToTable("Users");


        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
               .ValueGeneratedNever(); // We control Guid generation in the model

        // Identity FK 1-to-1
        builder.Property(x => x.IdentityUserId)
               .IsRequired()
               .HasMaxLength(450);


        builder.HasIndex(x => x.IdentityUserId)
               .IsUnique();

        //Profile 
        builder.Property(x => x.Bio)
               .HasMaxLength(500);

        builder.Property(x => x.ProfileImageUrl)
               .HasMaxLength(2048)
               .IsUnicode(false);         // URLs are ASCII

        builder.Property(x => x.CoverImageUrl)
       .HasMaxLength(2048)
       .IsUnicode(false);

        // Location 
        builder.Property(x => x.AddressLine1)
               .HasMaxLength(200);

        builder.Property(x => x.City)
               .HasMaxLength(100);

        builder.Property(x => x.StateProvince)
               .HasMaxLength(100);

        builder.Property(x => x.PostalCode)
               .HasMaxLength(20)
               .IsUnicode(false);

        builder.Property(x => x.Country)
               .HasMaxLength(100);

        //Audit

        builder.Property(o => o.CreatedAt)
            .IsRequired();


        builder.HasMany(x => x.Followers)
            .WithOne(x => x.FollowingUser)
            .HasForeignKey(x => x.FollowingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Following)
            .WithOne(x => x.FollowerUser)
            .HasForeignKey(x => x.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}