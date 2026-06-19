using AutoMapper;

using ReUse.Application.DTOs.Chat.Responses;
using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class ConversationProfile : Profile
{
    public ConversationProfile()
    {
        // Conversation → ConversationResponse
        // Used only for StartConversation (single entity, no list)
        CreateMap<Conversation, ConversationResponse>()
            .ForMember(d => d.ProductTitle,
                opt => opt.MapFrom(s => s.Product != null ? s.Product.Title : string.Empty))
            .ForMember(d => d.ProductCoverImageUrl,
                opt => opt.MapFrom(s => s.Product != null
                    ? s.Product.ProductImages
                        .OrderBy(i => i.DisplayOrder)
                        .Select(i => i.Url)
                        .FirstOrDefault()
                    : null))
            .ForMember(d => d.ProductStatus,
                opt => opt.MapFrom(s => s.Product != null ? s.Product.Status : default))
            .ForMember(d => d.ReactantName,
                opt => opt.MapFrom(s => s.Reactant != null ? s.Reactant.FullName : string.Empty))
            .ForMember(d => d.ReactantAvatarUrl,
                opt => opt.MapFrom(s => s.Reactant != null ? s.Reactant.ProfileImageUrl : null))
            .ForMember(d => d.OwnerName,
                opt => opt.MapFrom(s => s.Owner != null ? s.Owner.FullName : string.Empty))
            .ForMember(d => d.OwnerAvatarUrl,
                opt => opt.MapFrom(s => s.Owner != null ? s.Owner.ProfileImageUrl : null))
            .ForMember(d => d.LastMessagePreview, opt => opt.Ignore())
            .ForMember(d => d.UnreadCount, opt => opt.Ignore());

        // ConversationProjection → ConversationResponse
        // Used for GetMyConversations — preview already computed in SQL
        CreateMap<ConversationProjection, ConversationResponse>()
            .ForMember(d => d.UnreadCount, opt => opt.Ignore());

        // Message → MessageResponse (unchanged)
        CreateMap<Message, MessageResponse>()
            .ForMember(d => d.SenderName,
                opt => opt.MapFrom(s => s.Sender != null ? s.Sender.FullName : string.Empty))
            .ForMember(d => d.SenderAvatarUrl,
                opt => opt.MapFrom(s => s.Sender != null ? s.Sender.ProfileImageUrl : null));
    }
}