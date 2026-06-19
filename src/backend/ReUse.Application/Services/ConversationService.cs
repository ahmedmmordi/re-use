using AutoMapper;

using ReUse.Application.DTOs;
using ReUse.Application.DTOs.Chat.Requests;
using ReUse.Application.DTOs.Chat.Responses;
using ReUse.Application.DTOs.Notification.NotificationData;
using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services;
using ReUse.Application.Interfaces.Services.External;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Services;

public class ConversationService : IConversationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationPublisher _notificationPublisher;
    private readonly IMapper _mapper;
    private readonly IImageValidator _imageValidator;
    private readonly ICloudinaryService _cloudinaryService;

    public ConversationService(
        IUnitOfWork unitOfWork,
        INotificationPublisher notificationPublisher,
        IMapper mapper,
        IImageValidator imageValidator,
        ICloudinaryService cloudinaryService)
    {
        _unitOfWork = unitOfWork;
        _notificationPublisher = notificationPublisher;
        _mapper = mapper;
        _imageValidator = imageValidator;
        _cloudinaryService = cloudinaryService;
    }

    public async Task<ConversationResponse> StartConversationAsync(
        Guid productId, StartConversationRequest request, Guid reactantId)
    {
        var product = await _unitOfWork.Product.GetByIdAsync(productId)
            ?? throw new NotFoundException("Product");

        if (product.Status != ProductStatus.Active)
            throw new BadRequestException("Cannot start a conversation on an inactive listing.");

        var ownerId = product.OwnerUserId;

        if (reactantId == product.OwnerUserId)
            throw new BadRequestException("You cannot start a conversation on your own listing.");

        var existing = await _unitOfWork.Conversation
            .GetByParticipantsAndProductAsync(productId, ownerId, reactantId);

        if (existing is not null)
            throw new ConflictException("Conversation");

        var now = DateTime.UtcNow;

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            ReactantId = reactantId,
            OwnerId = ownerId,
            Status = ConversationStatus.Active,
            IsActive = true,
            LastActivityAt = now,
            CreatedAt = now
        };

        _unitOfWork.Conversation.Add(conversation);
        await _unitOfWork.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            var message = BuildMessage(
                conversation.Id, reactantId, MessageType.Text, request.InitialMessage, null, now);

            _unitOfWork.Message.Add(message);

            conversation.LastActivityAt = now;
            await _unitOfWork.SaveChangesAsync();

            await NotifyNewMessageAsync(conversation.Id, reactantId, ownerId);
        }

        var created = await _unitOfWork.Conversation.GetWithDetailsAsync(conversation.Id)
            ?? conversation;

        return MapToConversationResponse(created, reactantId, unreadCount: 0);
    }

    public async Task<ConversationDetailResponse> GetConversationAsync(
        Guid conversationId, Guid callerId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        var unreadCount = await _unitOfWork.Message.GetUnreadCountAsync(conversationId, callerId);

        var messages = await _unitOfWork.Message
            .GetConversationMessagesAsync(conversationId, callerId, pageNumber: 1, pageSize: 30);

        return new ConversationDetailResponse
        {
            Conversation = MapToConversationResponse(conversation, callerId, unreadCount),
            Messages = MapToPagedMessageResponse(messages, callerId)
        };
    }

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

    public async Task<MessageResponse> SendMessageAsync(
        Guid conversationId, SendMessageRequest request, Guid senderId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, senderId);

        if (!conversation.IsActive)
            throw new ForbiddenException("This conversation is closed.");

        var now = DateTime.UtcNow;

        string? mediaUrl = request.MediaUrl;
        var messageType = request.MessageType;

        if (request.ImageFile != null)
        {
            _imageValidator.Validate(request.ImageFile);
            var uploadResult = await _cloudinaryService.UpdateAsync(request.ImageFile, "chat_media");
            mediaUrl = uploadResult.Url;
            messageType = MessageType.Media;
        }

        var message = BuildMessage(
            conversationId,
            senderId,
            messageType,
            request.Content,
            mediaUrl,
            now);

        _unitOfWork.Message.Add(message);

        conversation.LastActivityAt = now;
        _unitOfWork.Conversation.Update(conversation);

        await _unitOfWork.SaveChangesAsync();

        // Notify the other participant
        var receiverId = senderId == conversation.OwnerId
            ? conversation.ReactantId
            : conversation.OwnerId;

        await NotifyNewMessageAsync(conversationId, senderId, receiverId);

        var sender = await _unitOfWork.User.GetByIdAsync(senderId);
        message.Sender = sender!;

        return MapToMessageResponse(message, callerId: senderId);
    }


    public async Task<int> MarkAsReadAsync(Guid conversationId, Guid callerId)
    {
        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(conversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        return await _unitOfWork.Message.MarkConversationAsReadAsync(conversationId, callerId);
    }

    public async Task DeleteMessageAsync(Guid messageId, Guid callerId)
    {
        var message = await _unitOfWork.Message.GetByIdAsync(messageId)
            ?? throw new NotFoundException("Message");

        var conversation = await _unitOfWork.Conversation.GetWithDetailsAsync(message.ConversationId)
            ?? throw new NotFoundException("Conversation");

        EnsureParticipant(conversation, callerId);

        if (callerId == message.SenderId)
            message.IsDeletedBySender = true;
        else
            message.IsDeletedByReceiver = true;

        _unitOfWork.Message.Update(message);
        await _unitOfWork.SaveChangesAsync();
    }

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

    private static void EnsureParticipant(Conversation conversation, Guid userId)
    {
        if (conversation.ReactantId != userId && conversation.OwnerId != userId)
            throw new ForbiddenException("You are not a participant in this conversation.");
    }

    private static Message BuildMessage(
        Guid conversationId,
        Guid senderId,
        MessageType type,
        string? content,
        string? mediaUrl,
        DateTime now)
    {
        return new Message
        {
            ConversationId = conversationId,
            SenderId = senderId,
            MessageType = type,
            Content = content,
            MediaUrl = mediaUrl,
            SentAt = now
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

}