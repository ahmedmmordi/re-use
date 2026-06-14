using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class ProductDealEntityTypeConfiguration : IEntityTypeConfiguration<ProductDeal>
{
    public void Configure(EntityTypeBuilder<ProductDeal> builder)
    {
        builder.ToTable("ProductDeals");

        builder.HasKey(x => x.Id);

        // Product
        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Conversation
        builder.HasOne(x => x.Conversation)
            .WithMany()
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seller
        builder.HasOne(x => x.Seller)
            .WithMany()
            .HasForeignKey(x => x.SellerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Buyer
        builder.HasOne(x => x.Buyer)
            .WithMany()
            .HasForeignKey(x => x.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.DealType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.AgreedPrice)
            .HasColumnType("decimal(18,2)");

        builder.Property(x => x.Notes)
            .HasMaxLength(1000);

        builder.Property(x => x.SellerConfirmed)
            .HasDefaultValue(false);

        builder.Property(x => x.BuyerConfirmed)
            .HasDefaultValue(false);

        // Indexes
        builder.HasIndex(x => x.ProductId);

        builder.HasIndex(x => x.ConversationId)
            .IsUnique();

        builder.HasIndex(x => x.SellerId);

        builder.HasIndex(x => x.BuyerId);
    }
}