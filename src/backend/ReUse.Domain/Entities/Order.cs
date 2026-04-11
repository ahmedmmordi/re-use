using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class Order : BaseEntity
{
    public Guid BuyerId { get; set; }
    public User Buyer { get; set; } = default!;

    public Guid SellerId { get; set; }
    public User Seller { get; set; } = default!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public Guid? PaymentId { get; set; }
    public Payment? Payment { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "USD";

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public string? Notes { get; set; }

    // optimistic concurrency
    public byte[] RowVersion { get; set; } = default!;
}