using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Chat.Requests;

public record SendMessageRequest(
    MessageType MessageType,

    // Required for Text messages. Optional for Offer (used as offer note/description).
    string? Content,

    // Required for Media messages.
    // Client uploads to Cloudinary first, then sends us the URL.
    // This keeps message sending stateless — no binary data through the API.
    string? MediaUrl,

    Microsoft.AspNetCore.Http.IFormFile? ImageFile = null
);