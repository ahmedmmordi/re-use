using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Offers;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class PurchaseRequestRepository : BaseRepository<PurchaseRequest>, IPurchaseRequestRepository
{
    private readonly ApplicationDbContext _context;

    public PurchaseRequestRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<PurchaseRequest> GetByIdWithProductAndBuyerAsync(Guid id)
    {
        return await _context.PurchaseRequests
            .AsNoTracking()
            .Include(x => x.Product)
            .ThenInclude(p => p.ProductImages)
            .Include(x => x.Buyer)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PagedResult<PurchaseRequest>> GetSentAsync(Guid buyerId, OffersFilterParams filterParams)
    {
        return await _context.PurchaseRequests
            .AsNoTracking()
            .Include(x => x.Product)
            .ThenInclude(p => p.ProductImages)
            .Include(x => x.Buyer)
            .Where(p => p.BuyerUserId == buyerId)
            .FilterByProduct(filterParams.ProductId)
            .ApplySort(filterParams.SortBy, filterParams.SortDirection)
            .ToPagedListAsync(filterParams.Pagination.PageNumber, filterParams.Pagination.PageSize);
    }

    public async Task<PagedResult<PurchaseRequest>> GetReceivedAsync(Guid sellerId, OffersFilterParams filterParams)
    {
        return await _context.PurchaseRequests
            .AsNoTracking()
            .Include(x => x.Product)
            .ThenInclude(p => p.ProductImages)
            .Include(x => x.Buyer)
            .Where(p => p.Product.OwnerUserId == sellerId)
            .FilterByProduct(filterParams.ProductId)
            .ApplySort(filterParams.SortBy, filterParams.SortDirection)
            .ToPagedListAsync(filterParams.Pagination.PageNumber, filterParams.Pagination.PageSize);
    }

    public async Task<List<PurchaseRequest>> GetPendingByProductAsync(Guid productId)
    {
        return await _context.PurchaseRequests
            .AsNoTracking()
            .Where(p => p.ProductId == productId && p.Status == PurchaseRequestStatus.Pending)
            .ToListAsync();
    }
}