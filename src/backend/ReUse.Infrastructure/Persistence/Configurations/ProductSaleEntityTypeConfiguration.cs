using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class ProductSaleEntityTypeConfiguration : IEntityTypeConfiguration<ProductSale>
{
    public void Configure(EntityTypeBuilder<ProductSale> builder)
    {
        builder.ToTable("ProductSales");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FinalPrice)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(x => x.SoldAt)
            .IsRequired();

        // Product
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Buyer
        builder.HasOne(x => x.Buyer)
            .WithMany()
            .HasForeignKey(x => x.BuyerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.ProductId)
            .IsUnique();

        builder.HasIndex(x => x.BuyerUserId);

        builder.HasIndex(x => x.SoldAt);
    }
}