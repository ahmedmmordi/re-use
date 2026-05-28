using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Enums;

namespace ReUse.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public decimal Amount { get; set; }

    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    public string PaymentMethod { get; set; }

    public string TransactionId { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
}