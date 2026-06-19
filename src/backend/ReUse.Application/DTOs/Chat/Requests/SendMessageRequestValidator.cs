
using FluentValidation;

using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Chat.Requests;

public class SendMessageRequestValidator : AbstractValidator<SendMessageRequest>
{
    public SendMessageRequestValidator()
    {
        RuleFor(x => x.MessageType)
            .IsInEnum().WithMessage("Invalid message type.");

        // Text must have content
        When(x => x.MessageType == MessageType.Text, () =>
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Text messages must have content.")
                .MaximumLength(4000).WithMessage("Message cannot exceed 4000 characters.");
        });

        // Media must have a URL or an Image File
        When(x => x.MessageType == MessageType.Media, () =>
        {
            RuleFor(x => x)
                .Must(x => !string.IsNullOrEmpty(x.MediaUrl) || x.ImageFile != null)
                .WithMessage("Media messages must include either a Media URL or an image file.");

            RuleFor(x => x.MediaUrl)
                .MaximumLength(2048).WithMessage("Media URL is too long.");
        });
    }
}