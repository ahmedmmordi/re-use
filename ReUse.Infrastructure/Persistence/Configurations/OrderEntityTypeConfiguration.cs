using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Infrastructure.Persistence.Configurations;

public class OrderEntityTypeConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(o => o.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();

        builder.Property(o => o.Amount)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(o => o.Currency)
            .HasMaxLength(3)
            .IsRequired()
            .HasDefaultValue("USD");

        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired()
            .HasDefaultValue(OrderStatus.Pending);

        builder.Property(o => o.Notes)
            .HasMaxLength(2000);

        builder.Property(o => o.CreatedAt)
            .IsRequired();

        builder.Property(o => o.UpdatedAt)
            .IsRequired();

        builder.Property(o => o.RowVersion)
            .IsRowVersion();

        // Buyer relationship
        builder.HasOne(o => o.Buyer)
            .WithMany()
            .HasForeignKey(o => o.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seller relationship
        builder.HasOne(o => o.Seller)
            .WithMany()
            .HasForeignKey(o => o.SellerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Product relationship
        builder.HasOne(o => o.Product)
            .WithMany()
            .HasForeignKey(o => o.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Payment relationship
        builder.HasOne(o => o.Payment)
            .WithMany()
            .HasForeignKey(o => o.PaymentId)
            .OnDelete(DeleteBehavior.SetNull);

        // For performance
        builder.HasIndex(o => o.BuyerId);
        builder.HasIndex(o => o.SellerId);
        builder.HasIndex(o => o.ProductId);
        builder.HasIndex(o => o.Status);
        builder.HasIndex(o => o.CreatedAt);

        // Composite indexes
        builder.HasIndex(o => new { o.BuyerId, o.Status });
        builder.HasIndex(o => new { o.SellerId, o.Status });

        // CHECK constraint
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "CK_Order_Buyer_Not_Seller",
                "\"BuyerId\" <> \"SellerId\""
            );
        });
    }
}