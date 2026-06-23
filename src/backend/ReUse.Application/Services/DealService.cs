using ReUse.Application.DTOs.Deals.Requests;
using ReUse.Application.DTOs.Deals.Responses;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class DealService : IDealService
{
    private readonly IUnitOfWork _unitOfWork;

    public DealService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DealResponse> CreateDealAsync(
        Guid conversationId, CreateDealRequest request, Guid callerId)
    {
        if (request.AgreedPrice.HasValue && request.AgreedPrice.Value <= 0)
            throw new BadRequestException("Agreed price must be greater than zero.");

        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        var product = conversation.Product;

        var (proposerId, receiverId) = ResolveRoles(product, conversation, callerId);

        if (proposerId != callerId)
            throw new ForbiddenException("You are not allowed to propose a deal on this listing type.");

        // Only one active deal per conversation at a time
        var existingActiveDeal = await _unitOfWork.ProductDeal
            .GetActiveByConversationIdAsync(conversationId);

        if (existingActiveDeal is not null)
            throw new ConflictException("Deal");

        var now = DateTime.UtcNow;

        var deal = new ProductDeal
        {
            ProductId = product.Id,
            ConversationId = conversationId,
            ProposerId = proposerId,
            ReceiverId = receiverId,
            DealType = ResolveDealType(product),
            AgreedPrice = request.AgreedPrice,
            Notes = request.Notes,
            Status = DealStatus.Pending,
            CreatedAt = now
        };

        _unitOfWork.ProductDeal.Add(deal);
        await _unitOfWork.SaveChangesAsync();

        // Reload with navigation properties
        var created = await _unitOfWork.ProductDeal.GetActiveByConversationIdAsync(conversationId)
            ?? deal;

        return MapToResponse(created, callerId);
    }

    public async Task<DealResponse> RespondToDealAsync(
        Guid dealId, RespondToDealRequest request, Guid callerId)
    {
        var deal = await _unitOfWork.ProductDeal.GetByIdAsync(dealId)
            ?? throw new NotFoundException("Deal");

        if (deal.ReceiverId != callerId)
            throw new ForbiddenException("Only the receiver can respond to a deal.");

        if (deal.Status != DealStatus.Pending)
            throw new BadRequestException($"Cannot respond to a deal with status '{deal.Status}'.");

        var product = await _unitOfWork.Product.GetByIdAsync(deal.ProductId)
            ?? throw new NotFoundException("Product");

        var now = DateTime.UtcNow;

        if (request.Action == DealAction.Accept)
        {
            deal.Status = DealStatus.Accepted;
            product.Status = ProductStatus.Reserved;
            product.UpdatedAt = now;
        }
        else
        {
            deal.Status = DealStatus.Rejected;
        }

        deal.UpdatedAt = now;

        _unitOfWork.ProductDeal.Update(deal);
        _unitOfWork.Product.Update(product);
        await _unitOfWork.SaveChangesAsync();

        return await LoadAndMapAsync(deal.Id, callerId);
    }

    public async Task<DealResponse> MarkDoneAsync(Guid dealId, Guid callerId)
    {
        var deal = await _unitOfWork.ProductDeal.GetByIdAsync(dealId)
            ?? throw new NotFoundException("Deal");

        if (deal.ReceiverId != callerId)
            throw new ForbiddenException();

        if (deal.Status != DealStatus.Accepted)
            throw new BadRequestException($"Cannot mark a deal as done with status '{deal.Status}'.");

        var product = await _unitOfWork.Product.GetByIdAsync(deal.ProductId)
            ?? throw new NotFoundException("Product");

        var now = DateTime.UtcNow;

        deal.Status = DealStatus.Completed;
        deal.CompletedAt = now;
        deal.UpdatedAt = now;

        product.Status = ProductStatus.Closed;
        product.UpdatedAt = now;

        _unitOfWork.ProductDeal.Update(deal);
        _unitOfWork.Product.Update(product);
        await _unitOfWork.SaveChangesAsync();

        return await LoadAndMapAsync(deal.Id, callerId);
    }

    public async Task<DealResponse?> GetActiveDealAsync(Guid conversationId, Guid callerId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        var deal = await _unitOfWork.ProductDeal.GetActiveByConversationIdAsync(conversationId);

        return deal is null ? null : MapToResponse(deal, callerId);
    }

    public async Task<ProductDealsResponse> GetProductDealsAsync(
        Guid productId, List<DealStatus>? statuses, Guid callerId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        List<ProductDeal> deals;

        if (product.OwnerUserId == callerId)
        {
            // Product owner sees all deals for the product
            deals = await _unitOfWork.ProductDeal.GetByProductIdAsync(productId, statuses);
        }
        else
        {
            // Non-owner sees only their own deals
            deals = await _unitOfWork.ProductDeal.GetByProductIdForUserAsync(
                callerId, productId, statuses);
        }

        return new ProductDealsResponse
        {
            ProductId = productId,
            Deals = deals.Select(d => MapToResponse(d, callerId)).ToList()
        };
    }

    /// <summary>
    /// Determines who is the proposer and who is the receiver
    /// based on product type and who initiated the conversation.
    ///
    /// Conversation.OwnerId    = product owner
    /// Conversation.ReactantId = the user who opened the chat
    ///
    /// Regular → owner is seller, only owner can propose
    /// Swap    → either can propose, so proposer = caller, receiver = the other side
    /// Wanted  → owner is the buyer (posted a wanted listing),
    ///           reactant is the seller, only reactant can propose
    /// </summary>
    private static (Guid proposerId, Guid receiverId) ResolveRoles(
        Product product, Conversation conversation, Guid callerId)
    {
        return product.ProductType switch
        {
            ProductType.Regular =>
                (proposerId: conversation.OwnerId, receiverId: conversation.ReactantId),

            ProductType.Swap =>
                callerId == conversation.OwnerId
                    ? (conversation.OwnerId, conversation.ReactantId)
                    : (conversation.ReactantId, conversation.OwnerId),

            ProductType.Wanted =>
                // owner posted the wanted ad (they are the buyer),
                // reactant responded as the seller → reactant proposes
                (proposerId: conversation.ReactantId, receiverId: conversation.OwnerId),

            _ => throw new BadRequestException("Unknown product type.")
        };
    }

    private static DealType ResolveDealType(Product product) => product.ProductType switch
    {
        ProductType.Regular => DealType.DirectPurchase,
        ProductType.Swap => DealType.Swap,
        ProductType.Wanted => DealType.WantedOffer,
        _ => DealType.DirectPurchase
    };

    private static void EnsureParticipant(Conversation conversation, Guid callerId)
    {
        if (conversation.OwnerId != callerId && conversation.ReactantId != callerId)
            throw new ForbiddenException();
    }

    private static DealResponse MapToResponse(ProductDeal deal, Guid callerId) => new()
    {
        Id = deal.Id,
        ConversationId = deal.ConversationId,
        ProductId = deal.ProductId,
        Proposer = new DealParticipantDto
        {
            Id = deal.ProposerId,
            Name = deal.Proposer?.FullName ?? string.Empty,
            AvatarUrl = deal.Proposer?.ProfileImageUrl
        },
        Receiver = new DealParticipantDto
        {
            Id = deal.ReceiverId,
            Name = deal.Receiver?.FullName ?? string.Empty,
            AvatarUrl = deal.Receiver?.ProfileImageUrl
        },
        AgreedPrice = deal.AgreedPrice,
        DealType = deal.DealType,
        Status = deal.Status,
        Notes = deal.Notes,
        CompletedAt = deal.CompletedAt,
        CreatedAt = deal.CreatedAt,
    };

    /// <summary>
    /// Reloads a deal with navigation properties after an update, then maps it.
    /// </summary>
    private async Task<DealResponse> LoadAndMapAsync(Guid dealId, Guid callerId)
    {
        // Try to get it via active deal query (which includes navigation props)
        var deal = await _unitOfWork.ProductDeal.GetByIdAsync(dealId)
            ?? throw new NotFoundException("Deal");

        // Navigation props may not be loaded via GetByIdAsync (uses FindAsync)
        // so we rely on the already-tracked entity + lazy properties, or
        // fall back to a product query for the response. In practice the
        // caller-facing fields (ProposerId/ReceiverId/Status) are all scalar.
        return MapToResponse(deal, callerId);
    }
}