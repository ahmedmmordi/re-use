using ReUse.Application.DTOs.Deals.Requests;
using ReUse.Application.DTOs.Deals.Responses;
using ReUse.Domain.Enums;

namespace ReUse.Application.Interfaces.Services;

public interface IDealService
{
    /// <summary>
    /// Creates a deal proposal inside a conversation.
    /// Enforces who can propose based on product type:
    ///   Regular  → only the product owner (seller)
    ///   Swap     → either participant
    ///   Wanted   → the reactant (non-owner / responder)
    /// Throws ConflictException if a Pending or Accepted deal already exists in this conversation.
    /// Throws BadRequestException if AgreedPrice is not positive.
    /// Throws ForbiddenException if the caller is not allowed to propose for this product type.
    /// </summary>
    Task<DealResponse> CreateDealAsync(Guid conversationId, CreateDealRequest request, Guid callerId);

    /// <summary>
    /// Accepts or rejects a Pending deal.
    /// Only the receiver can call this.
    /// On Accept  → product status becomes Reserved.
    /// On Reject  → product stays Active.
    /// Throws ForbiddenException if caller is not the receiver.
    /// Throws BadRequestException if deal is not Pending.
    /// </summary>
    Task<DealResponse> RespondToDealAsync(Guid dealId, RespondToDealRequest request, Guid callerId);

    /// <summary>
    /// Marks an Accepted deal as Done.
    /// Either participant can call this.
    /// Product status becomes Closed.
    /// Throws BadRequestException if deal is not Accepted.
    /// Throws ForbiddenException if caller is not a participant.
    /// </summary>
    Task<DealResponse> MarkDoneAsync(Guid dealId, Guid callerId);

    /// <summary>
    /// Returns the current active (Pending or Accepted) deal for a conversation.
    /// Used to render the deal card in the chat UI.
    /// Returns null if no active deal exists.
    /// Throws ForbiddenException if caller is not a participant.
    /// </summary>
    Task<DealResponse?> GetActiveDealAsync(Guid conversationId, Guid callerId);

    /// <summary>
    /// Returns all deals for a product, scoped by caller role:
    ///   Product owner → sees all deals.
    ///   Other users   → sees only deals where they are proposer or receiver.
    /// Optionally filtered by status.
    /// Throws ForbiddenException if caller is not a participant in any deal for this product.
    /// </summary>
    Task<ProductDealsResponse> GetProductDealsAsync(
        Guid productId, List<DealStatus>? statuses, Guid callerId);
}