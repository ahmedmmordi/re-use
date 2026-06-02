using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Comments;
using ReUse.Application.Enums;
using ReUse.Application.Interfaces.Repository;
using ReUse.Domain.Entities;
using ReUse.Infrastructure.Extensions;
using ReUse.Infrastructure.Persistence;

namespace ReUse.Infrastructure.Repositories;

public class CommentRepository : BaseRepository<ProductComment>, ICommentRepository
{
    private readonly ApplicationDbContext _context;

    public CommentRepository(ApplicationDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<PagedResult<CommentResponse>> GetByProductIdAsync(
        Guid productId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Desc)
    {
        var query = _context.ProductComments
            .AsNoTracking()
            .Where(c => c.ProductId == productId
                     && !c.IsDeleted
                     && c.ParentCommentId == null);

        query = sortDirection == SortDirection.Asc
            ? query.OrderBy(c => c.CreatedAt).ThenBy(c => c.Id)
            : query.OrderByDescending(c => c.CreatedAt).ThenByDescending(c => c.Id);

        return await query
            .Select(c => new CommentResponse
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ParentCommentId = c.ParentCommentId,
                Body = c.Body,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                ReplyCount = c.Replies.Count(r => !r.IsDeleted),
                Author = new CommentAuthorResponse
                {
                    Id = c.User.Id,
                    FullName = c.User.FullName,
                    ProfileImageUrl = c.User.ProfileImageUrl
                }
            })
            .ToPagedListAsync(pagination.PageNumber, pagination.PageSize);
    }

    public async Task<CommentResponse?> GetByIdWithAuthorAsync(Guid commentId)
    {
        return await _context.ProductComments
            .AsNoTracking()
            .Where(c => c.Id == commentId && !c.IsDeleted)
            .Select(c => new CommentResponse
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ParentCommentId = c.ParentCommentId,
                Body = c.Body,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                ReplyCount = c.Replies.Count(r => !r.IsDeleted),
                Author = new CommentAuthorResponse
                {
                    Id = c.User.Id,
                    FullName = c.User.FullName,
                    ProfileImageUrl = c.User.ProfileImageUrl
                }
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PagedResult<CommentResponse>> GetRepliesAsync(
        Guid parentCommentId,
        PaginationParams pagination,
        SortDirection sortDirection = SortDirection.Asc)
    {
        var query = _context.ProductComments
            .AsNoTracking()
            .Where(c => c.ParentCommentId == parentCommentId && !c.IsDeleted);

        query = sortDirection == SortDirection.Asc
            ? query.OrderBy(c => c.CreatedAt).ThenBy(c => c.Id)
            : query.OrderByDescending(c => c.CreatedAt).ThenByDescending(c => c.Id);

        return await query
            .Select(c => new CommentResponse
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ParentCommentId = c.ParentCommentId,
                Body = c.Body,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                ReplyCount = 0,
                Author = new CommentAuthorResponse
                {
                    Id = c.User.Id,
                    FullName = c.User.FullName,
                    ProfileImageUrl = c.User.ProfileImageUrl
                }
            })
            .ToPagedListAsync(pagination.PageNumber, pagination.PageSize);
    }

    public async Task<ProductComment?> GetCommentWithAuthorAsync(Guid commentId)
    {
        return await _context.ProductComments
            .Include(c => c.User)
            .Where(c => c.Id == commentId && !c.IsDeleted)
            .FirstOrDefaultAsync();
    }

    public async Task<int> CountRecentCommentsByUserOnProductAsync(
        Guid userId,
        Guid productId,
        DateTime since)
    {
        return await _context.ProductComments
            .AsNoTracking()
            .CountAsync(c => c.UserId == userId
                          && c.ProductId == productId
                          && c.CreatedAt >= since
                          && !c.IsDeleted);
    }
}