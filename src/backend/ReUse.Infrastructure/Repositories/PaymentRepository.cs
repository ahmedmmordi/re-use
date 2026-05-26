
using Microsoft.EntityFrameworkCore;

using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class PaymentRepository : BaseRepository<Payment>, IPaymentRepository
{
    private readonly ApplicationDbContext _context;
    public PaymentRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<Payment?> GetByTransactionId(string transactionId)
    {
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.TransactionId == transactionId);
        return payment;
    }
}