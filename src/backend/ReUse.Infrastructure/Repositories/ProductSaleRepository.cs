using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Offers;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class ProductSaleRepository : BaseRepository<ProductSale>, IProductSaleRepository
{
    private readonly ApplicationDbContext _context;

    public ProductSaleRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }
}