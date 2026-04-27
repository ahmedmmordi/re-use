using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class ProductEntityTypeConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        // PK
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        // TPH Discriminator
        builder.HasDiscriminator(p => p.ProductType)
            .HasValue<RegularProduct>(ProductType.Regular)
            .HasValue<WantedProduct>(ProductType.Wanted);

        // Core properties
        builder.Property(p => p.Title)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(p => p.Description)
            .IsRequired();

        builder.Property(p => p.ProductType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(p => p.Condition)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue(ProductStatus.Active);


        // Location
        builder.Property(p => p.LocationCity)
            .HasMaxLength(100);
        builder.Property(p => p.LocationCountry)
            .HasMaxLength(100);

        //Discriminator 
        builder.HasDiscriminator(p => p.ProductType)
    .HasValue<RegularProduct>(ProductType.Regular)
    .HasValue<WantedProduct>(ProductType.Wanted)
    .HasValue<SwapProduct>(ProductType.Swap);

        // Audit
        builder.Property(p => p.CreatedAt)
            .IsRequired();

        // Relationships

        builder.HasOne(p => p.Owner)
            .WithMany()
            .HasForeignKey(p => p.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany()
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(p => p.OwnerUserId);
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.Title);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.ProductType);
    }

}