using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Chat.Requests;
using ReUse.Application.DTOs.Chat.Responses;
using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class ConversationService : IConversationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationPublisher _notificationPublisher;
    private readonly IMapper _mapper;

    public ConversationService(
        IUnitOfWork unitOfWork,
        INotificationPublisher notificationPublisher,
        IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _notificationPublisher = notificationPublisher;
        _mapper = mapper;
    }

    // ── Start conversation ───────────────────────────────────────────────────

    public async Task<ConversationResponse> StartConversationAsync(
        Guid productId, StartConversationRequest request, Guid callerId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (product.Status != ProductStatus.Active)
            throw new BadRequestException("Cannot start a conversation on an inactive listing.");

        // Resolve buyer/seller roles based on product type
        Guid buyerId;
        Guid sellerId;
        ConversationType type;

        switch (product.ProductType)
        {
            case ProductType.Regular:
                // Caller is the buyer, product owner is the seller
                if (callerId == product.OwnerUserId)
                    throw new BadRequestException("You cannot start a conversation on your own listing.");
                buyerId = callerId;
                sellerId = product.OwnerUserId;
                type = ConversationType.BuyerSeller;
                break;

            case ProductType.Wanted:
                // Caller is the seller (making an offer), product owner is the buyer
                if (callerId == product.OwnerUserId)
                    throw new BadRequestException("You cannot respond to your own wanted listing.");
                buyerId = product.OwnerUserId;
                sellerId = callerId;
                type = ConversationType.WantedOffer;
                break;

            case ProductType.Swap:
                // Caller is the buyer (proposing swap), product owner is the seller
                if (callerId == product.OwnerUserId)
                    throw new BadRequestException("You cannot propose a swap on your own listing.");
                buyerId = callerId;
                sellerId = product.OwnerUserId;
                type = ConversationType.SwapRequest;
                break;

            default:
                throw new BadRequestException("Unknown product type.");
        }

        // One thread per (product, buyer, seller) triplet
        var existing = await _unitOfWork.Conversation
            .GetByParticipantsAndProductAsync(productId, buyerId, sellerId);

        if (existing is not null)
            throw new ConflictException("Conversation");

        var now = DateTime.UtcNow;

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            BuyerId = buyerId,
            SellerId = sellerId,
            ConversationType = type,
            Status = ConversationStatus.Active,
            IsActive = true,
            LastActivityAt = now,
            CreatedAt = now
        };

        _unitOfWork.Conversation.Add(conversation);
        await _unitOfWork.SaveChangesAsync();

        // Send the optional opening message in the same operation
        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            var message = BuildMessage(
                conversation.Id, callerId, MessageType.Text, request.InitialMessage, null, null, now);

            _unitOfWork.Message.Add(message);

            conversation.LastActivityAt = now;
            await _unitOfWork.SaveChangesAsync();

            // Notify the other participant
            var receiverId = callerId == buyerId ? sellerId : buyerId;
            await NotifyNewMessageAsync(conversation.Id, callerId, receiverId);
        }

        // Load details for the response
        var created = await _unitOfWork.Conversation.GetWithDetailsAsync(conversation.Id)
            ?? conversation;

        return MapToConversationResponse(created, callerId, unreadCount: 0);
    }

    // ── Get conversation detail ──────────────────────────────────────────────

    public async Task<ConversationDetailResponse> GetConversationAsync(
        Guid conversationId, Guid callerId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        var unreadCount = await _unitOfWork.Message.GetUnreadCountAsync(conversationId, callerId);

        // First page of messages — oldest first
        var messages = await _unitOfWork.Message
            .GetConversationMessagesAsync(conversationId, callerId, pageNumber: 1, pageSize: 30);

        return new ConversationDetailResponse
        {
            Conversation = MapToConversationResponse(conversation, callerId, unreadCount),
            Messages = MapToPagedMessageResponse(messages, callerId)
        };
    }

    // ── Get my conversations ─────────────────────────────────────────────────

    public async Task<PagedResult<ConversationResponse>> GetMyConversationsAsync(
        Guid callerId, PaginationParams pagination)
    {
        var paged = await _unitOfWork.Conversation
            .GetUserConversationsAsync(callerId, pagination.PageNumber, pagination.PageSize);

        var responses = new List<ConversationResponse>();

        foreach (var projection in paged.Data)
        {
            var unread = await _unitOfWork.Message
                .GetUnreadCountAsync(projection.Id, callerId);

            var response = _mapper.Map<ConversationResponse>(projection);
            response = response with { UnreadCount = unread };
            responses.Add(response);
        }

        return new PagedResult<ConversationResponse>
        {
            Data = responses,
            PageNumber = paged.PageNumber,
            PageSize = paged.PageSize,
            TotalRecords = paged.TotalRecords
        };
    }

    // ── Get messages (infinite scroll) ───────────────────────────────────────

    public async Task<PagedResult<MessageResponse>> GetMessagesAsync(
        Guid conversationId, PaginationParams pagination, Guid callerId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        var messages = await _unitOfWork.Message
            .GetConversationMessagesAsync(conversationId, callerId, pagination.PageNumber, pagination.PageSize);

        return MapToPagedMessageResponse(messages, callerId);
    }

    // ── Send message ─────────────────────────────────────────────────────────

    public async Task<MessageResponse> SendMessageAsync(
        Guid conversationId, SendMessageRequest request, Guid senderId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, senderId);

        if (!conversation.IsActive)
            throw new ForbiddenException("This conversation is closed.");

        // ── WantedOffer offer-lock ────────────────────────────────────────────
        if (request.MessageType == MessageType.Offer)
        {
            if (conversation.ConversationType != ConversationType.WantedOffer)
                throw new BadRequestException("Offer messages are only valid in WantedOffer conversations.");

            if (senderId != conversation.SellerId)
                throw new ForbiddenException("Only the seller can send an offer.");

            var hasPending = await _unitOfWork.Conversation
                .HasPendingOfferAsync(conversationId, senderId);

            if (hasPending)
                throw new BadRequestException(
                    "You cannot send a new offer until the buyer responds to your current one.");
        }

        var now = DateTime.UtcNow;

        var message = BuildMessage(
            conversationId,
            senderId,
            request.MessageType,
            request.Content,
            request.MediaUrl,
            request.OfferPrice,
            now);

        _unitOfWork.Message.Add(message);

        // Bump activity clock
        conversation.LastActivityAt = now;
        _unitOfWork.Conversation.Update(conversation);

        await _unitOfWork.SaveChangesAsync();

        // Notify the other participant
        var receiverId = senderId == conversation.BuyerId
            ? conversation.SellerId
            : conversation.BuyerId;

        await NotifyNewMessageAsync(conversationId, senderId, receiverId);

        // Populate sender nav for mapping
        var sender = await _unitOfWork.User.GetByIdAsync(senderId);
        message.Sender = sender!;

        return MapToMessageResponse(message, callerId: senderId);
    }

    // ── Accept offer ─────────────────────────────────────────────────────────

    public async Task<MessageResponse> AcceptOfferAsync(Guid conversationId, Guid callerId)
        => await RespondToOfferAsync(conversationId, callerId, MessageType.OfferAccepted);

    // ── Decline offer ────────────────────────────────────────────────────────

    public async Task<MessageResponse> DeclineOfferAsync(Guid conversationId, Guid callerId)
        => await RespondToOfferAsync(conversationId, callerId, MessageType.OfferDeclined);

    private async Task<MessageResponse> RespondToOfferAsync(
        Guid conversationId, Guid callerId, MessageType responseType)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        if (conversation.ConversationType != ConversationType.WantedOffer)
            throw new BadRequestException("Offer actions are only valid in WantedOffer conversations.");

        if (callerId != conversation.BuyerId)
            throw new ForbiddenException("Only the buyer can accept or decline an offer.");

        if (!conversation.IsActive)
            throw new ForbiddenException("This conversation is closed.");

        var pendingOffer = await _unitOfWork.Message
            .GetLatestPendingOfferAsync(conversationId, conversation.SellerId)
            ?? throw new NotFoundException("Pending offer");

        var now = DateTime.UtcNow;
        var content = responseType == MessageType.OfferAccepted
            ? "Offer accepted."
            : "Offer declined.";

        var systemMessage = BuildMessage(
            conversationId, callerId, responseType, content, null, null, now);

        _unitOfWork.Message.Add(systemMessage);

        conversation.LastActivityAt = now;
        _unitOfWork.Conversation.Update(conversation);

        await _unitOfWork.SaveChangesAsync();

        // Notify the seller that their offer was answered
        await NotifyNewMessageAsync(conversationId, callerId, conversation.SellerId);

        var caller = await _unitOfWork.User.GetByIdAsync(callerId);
        systemMessage.Sender = caller!;

        return MapToMessageResponse(systemMessage, callerId);
    }

    // ── Mark as read ─────────────────────────────────────────────────────────

    public async Task<int> MarkAsReadAsync(Guid conversationId, Guid callerId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        return await _unitOfWork.Message.MarkConversationAsReadAsync(conversationId, callerId);
    }

    // ── Delete message ───────────────────────────────────────────────────────

    public async Task DeleteMessageAsync(Guid messageId, Guid callerId)
    {
        var message = await _unitOfWork.Message.GetByIdAsync(messageId)
            ?? throw new NotFoundException("Message");

        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(message.ConversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        if (callerId != message.SenderId)
            throw new ForbiddenException("Only the sender can delete a message.");

        // Soft-delete for both participants: the content is removed but a
        // "Message deleted" placeholder remains visible on both sides.
        message.IsDeletedBySender = true;
        message.IsDeletedByReceiver = true;

        _unitOfWork.Message.Update(message);
        await _unitOfWork.SaveChangesAsync();
    }

    // ── Close conversation ───────────────────────────────────────────────────

    public async Task CloseConversationAsync(Guid conversationId, Guid callerId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        if (!conversation.IsActive)
            throw new BadRequestException("Conversation is already closed.");

        conversation.Status = ConversationStatus.Closed;
        conversation.IsActive = false;

        _unitOfWork.Conversation.Update(conversation);
        await _unitOfWork.SaveChangesAsync();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static void EnsureParticipant(Conversation conversation, Guid userId)
    {
        if (conversation.BuyerId != userId && conversation.SellerId != userId)
            throw new ForbiddenException("You are not a participant in this conversation.");
    }

    private static Message BuildMessage(
        Guid conversationId,
        Guid senderId,
        MessageType type,
        string? content,
        string? mediaUrl,
        decimal? offerPrice,
        DateTime now)
    {
        // For Offer messages, embed the price at the start of Content so it can be
        // extracted by ExtractOfferPrice without a dedicated column.
        // Format: "{price}|{note}" e.g. "250.00|Good condition, barely used"
        // Note is optional — "250.00|" is valid.
        var storedContent = type == MessageType.Offer && offerPrice.HasValue
            ? $"{offerPrice.Value:F2}|{content ?? string.Empty}"
            : content;

        return new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = senderId,
            MessageType = type,
            Content = storedContent,
            MediaUrl = mediaUrl,
            SentAt = now,
            CreatedAt = now
        };
    }

    private async Task NotifyNewMessageAsync(
        Guid conversationId, Guid senderId, Guid receiverId)
    {
        var sender = await _unitOfWork.User.GetByIdAsync(senderId);

        await _notificationPublisher.PublishAsync<MessageNotificationData>(
            userId: receiverId,
            type: NotificationType.NewMessage,
            title: "New Message",
            body: $"{sender?.FullName ?? "Someone"} sent you a message.",
            data: new MessageNotificationData
            {
                ChatId = conversationId,
                SenderId = senderId
            });
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private ConversationResponse MapToConversationResponse(Conversation c, Guid callerId, int unreadCount)
    {
        var response = _mapper.Map<ConversationResponse>(c);
        // UnreadCount requires an async DB call so it's set here after mapping
        return response with { UnreadCount = unreadCount };
    }

    private MessageResponse MapToMessageResponse(Message m, Guid callerId)
    {
        var response = _mapper.Map<MessageResponse>(m);
        var isSender = m.SenderId == callerId;

        // Hide content for the caller's deleted side
        if ((isSender && m.IsDeletedBySender) ||
            (!isSender && m.IsDeletedByReceiver))
            return response with { Content = null, MediaUrl = null };

        return response;
    }

    private PagedResult<MessageResponse> MapToPagedMessageResponse(
        PagedResult<Message> paged, Guid callerId)
    {
        return new PagedResult<MessageResponse>
        {
            Data = paged.Data
                .Select(m => MapToMessageResponse(m, callerId))
                .ToList(),
            PageNumber = paged.PageNumber,
            PageSize = paged.PageSize,
            TotalRecords = paged.TotalRecords
        };
    }

    // OfferPrice is stored in Content as "{price}|{note}" — handled in ConversationProfile
    private static string? ExtractOfferNote(string? content)
    {
        if (string.IsNullOrEmpty(content)) return null;
        var pipeIndex = content.IndexOf('|');
        if (pipeIndex < 0 || pipeIndex == content.Length - 1) return null;
        return content[(pipeIndex + 1)..];
    }

}