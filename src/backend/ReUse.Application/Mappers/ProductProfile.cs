using AutoMapper;

using ReUse.Application.DTOs.Products.Requests;
using ReUse.Application.DTOs.Products.Responses;
using ReUse.Domain.Entities;
using ReUse.Domain.Enums;

namespace ReUse.Application.Mappers;

public class ProductProfile : Profile
{
    private static string? FormatCondition(ProductCondition? condition) => condition switch
    {
        ProductCondition.New => "New",
        ProductCondition.LikeNew => "Like New",
        ProductCondition.Used => "Used",
        ProductCondition.Broken => "Broken",
        null => null,
        _ => condition.ToString()
    };

    public ProductProfile()
    {
        #region CreateRequests

        CreateMap<BasicInfoRequest, Product>()
              .ForMember(dest => dest.OwnerUserId, opt => opt.Ignore())
              .ForMember(dest => dest.ProductImages, opt => opt.Ignore());

        #region RegularProduct
        CreateMap<BasicInfoRequest, RegularProduct>()
            .IncludeBase<BasicInfoRequest, Product>();

        CreateMap<CreateRegularProductRequest, RegularProduct>()
            .IncludeMembers(src => src.BasicInfo);
        #endregion

        #region Wanted Product
        CreateMap<BasicInfoRequest, WantedProduct>()
            .IncludeBase<BasicInfoRequest, Product>();

        CreateMap<CreateWantedProductRequest, WantedProduct>()
            .IncludeMembers(src => src.BasicInfo);
        #endregion

        #region Swap Product
        CreateMap<BasicInfoRequest, SwapProduct>()
            .IncludeBase<BasicInfoRequest, Product>();

        CreateMap<CreateSwapProductRequest, SwapProduct>()
            .IncludeMembers(src => src.BasicInfo);
        #endregion

        #endregion

        #region UpdateRequests

        CreateMap<BasicInfoUpdateRequest, Product>()
            .ForMember(dest => dest.Title, opt => opt.Condition(src => src.Title != null))
            .ForMember(dest => dest.Description, opt => opt.Condition(src => src.Description != null))
            .ForMember(dest => dest.LocationCity, opt => opt.Condition(src => src.LocationCity != null))
            .ForMember(dest => dest.LocationCountry, opt => opt.Condition(src => src.LocationCountry != null))
            .ForMember(dest => dest.CategoryId, opt => opt.Condition(src => src.CategoryId.HasValue))
            .ForMember(dest => dest.Condition, opt => opt.Condition(src => src.Condition.HasValue))
            .ForMember(dest => dest.ProductImages, opt => opt.Ignore())
            .ForMember(dest => dest.OwnerUserId, opt => opt.Ignore());

        #region Regular Update
        CreateMap<BasicInfoUpdateRequest, RegularProduct>()
            .IncludeBase<BasicInfoUpdateRequest, Product>();

        CreateMap<UpdateRegularProductRequest, RegularProduct>()
            //.IncludeMembers(src => src.BasicInfo)
            .ForMember(dest => dest.Price, opt => opt.Condition(src => src.Price.HasValue))
            .ForMember(dest => dest.AllowNegotiation, opt => opt.Condition(src => src.AllowNegotiation.HasValue));
        #endregion

        #region Swap Update
        CreateMap<BasicInfoUpdateRequest, SwapProduct>()
            .IncludeBase<BasicInfoUpdateRequest, Product>();

        CreateMap<UpdateSwapProductRequest, SwapProduct>()
            //  .IncludeMembers(src => src.BasicInfo)
            .ForMember(dest => dest.WantedItemTitle, opt => opt.Condition(src => src.WantedItemTitle != null))
            .ForMember(dest => dest.WantedItemDescription, opt => opt.Condition(src => src.WantedItemDescription != null));
        #endregion

        #region Wanted Update
        CreateMap<BasicInfoUpdateRequest, WantedProduct>()
            .IncludeBase<BasicInfoUpdateRequest, Product>();

        CreateMap<UpdateWantedProductRequest, WantedProduct>()
            //   .IncludeMembers(src => src.BasicInfo)
            .ForMember(dest => dest.DesiredPriceMin, opt => opt.Condition(src => src.DesiredPriceMin.HasValue))
            .ForMember(dest => dest.DesiredPriceMax, opt => opt.Condition(src => src.DesiredPriceMax.HasValue));
        #endregion

        #endregion

        #region Responses

        #region ForGetById
        CreateMap<Product, ProductDetailsResponse>()
          .Include<RegularProduct, ProductDetailsResponse>()
          .Include<SwapProduct, ProductDetailsResponse>()
          .Include<WantedProduct, ProductDetailsResponse>()
          .ForMember(dest => dest.Type,
              opt => opt.MapFrom(src => src.ProductType.ToString()))
          .ForMember(dest => dest.Condition,
              opt => opt.MapFrom(src => FormatCondition(src.Condition)))
          .ForMember(dest => dest.Status,
              opt => opt.MapFrom(src => src.Status.ToString().ToLower()))
          .ForMember(dest => dest.CategoryName,
              opt => opt.MapFrom(src => src.Category.Name))
          .ForMember(dest => dest.Images,
              opt => opt.MapFrom(src =>
                  src.ProductImages
                     .OrderBy(i => i.DisplayOrder)
                     .Select(i => i.Url)
                     .ToList()))
          .ForMember(dest => dest.OwnerUserName,
              opt => opt.MapFrom(src => src.Owner.FullName))
          .ForMember(dest => dest.OwnerProfileImageUrl,
              opt => opt.MapFrom(src => src.Owner.ProfileImageUrl))
          .ForMember(dest => dest.MemberSince,
              opt => opt.MapFrom(src => src.Owner.CreatedAt.ToString("MMMM yyyy")))
          .ForMember(dest => dest.OwnerRatingsAverage,
              opt => opt.MapFrom(src => src.Owner.RatingsAverage))
          .ForMember(dest => dest.OwnerRatingsCount,
              opt => opt.MapFrom(src => src.Owner.RatingsCount))
          .ForMember(dest => dest.OwnerIsVerified, opt => opt.Ignore())
          .ForMember(dest => dest.WantedCondition, opt => opt.Ignore());


        // RegularProduct → ProductDetailsResponse
        CreateMap<RegularProduct, ProductDetailsResponse>()
            .IncludeBase<Product, ProductDetailsResponse>();

        // SwapProduct → ProductDetailsResponse
        CreateMap<SwapProduct, ProductDetailsResponse>()
            .IncludeBase<Product, ProductDetailsResponse>()

            .ForMember(dest => dest.WantedCondition,
               opt => opt.MapFrom(src => FormatCondition(src.WantedCondition)));

        // WantedProduct → ProductDetailsResponse
        CreateMap<WantedProduct, ProductDetailsResponse>()
            .IncludeBase<Product, ProductDetailsResponse>();

        CreateMap<ProductCondition?, string>()
            .ConvertUsing<ConditionToStringConverter>();
        #endregion

        #region ForGetAll

        CreateMap<Product, ProductResponse>()
            .Include<RegularProduct, ProductResponse>()
            .Include<SwapProduct, ProductResponse>()
            .Include<WantedProduct, ProductResponse>()
            .ForMember(dest => dest.Type,
                opt => opt.MapFrom(src => src.ProductType))
            .ForMember(dest => dest.Images,
                opt => opt.MapFrom(src =>
                    src.ProductImages
                       .OrderBy(i => i.DisplayOrder)
                       .Select(i => new UploadedImageResponse(i.Id, i.Url, i.PublicId))
                       .ToList()))
            .ForMember(dest => dest.CoverImageUrl,
                opt => opt.MapFrom(src =>
                    src.ProductImages
                       .OrderBy(i => i.DisplayOrder)
                       .Select(i => i.Url)
                       .FirstOrDefault() ?? string.Empty))
            .ForMember(dest => dest.SellerName,
                opt => opt.MapFrom(src => src.Owner != null ? src.Owner.FullName : string.Empty))
            .ForMember(dest => dest.SellerAvatarUrl,
                opt => opt.MapFrom(src => src.Owner != null ? src.Owner.ProfileImageUrl : null))
            .ForMember(dest => dest.CategoryName,
                opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
            .ForMember(dest => dest.FavoritesCount,
                opt => opt.MapFrom(src => src.Favorites != null ? src.Favorites.Count : 0))
            // Type-specific fields
            .ForMember(dest => dest.Price, opt => opt.Ignore())
            .ForMember(dest => dest.AllowNegotiation, opt => opt.Ignore())
            .ForMember(dest => dest.WantedItem, opt => opt.Ignore())
            .ForMember(dest => dest.WantedItemDescription, opt => opt.Ignore())
            .ForMember(dest => dest.MinPrice, opt => opt.Ignore())
            .ForMember(dest => dest.MaxPrice, opt => opt.Ignore());

        CreateMap<RegularProduct, ProductResponse>()
            .IncludeBase<Product, ProductResponse>()
            .ForMember(dest => dest.Price,
                opt => opt.MapFrom(src => (decimal?)src.Price))
            .ForMember(dest => dest.AllowNegotiation,
                opt => opt.MapFrom(src => src.AllowNegotiation));

        CreateMap<SwapProduct, ProductResponse>()
            .IncludeBase<Product, ProductResponse>()
            .ForMember(dest => dest.WantedItem,
                opt => opt.MapFrom(src => src.WantedItemTitle))
            .ForMember(dest => dest.WantedItemDescription,
                opt => opt.MapFrom(src => src.WantedItemDescription));

        CreateMap<WantedProduct, ProductResponse>()
            .IncludeBase<Product, ProductResponse>()
            .ForMember(dest => dest.MinPrice,
                opt => opt.MapFrom(src => src.DesiredPriceMin))
            .ForMember(dest => dest.MaxPrice,
                opt => opt.MapFrom(src => src.DesiredPriceMax));

        #endregion

        #region sellerProducts
        CreateMap<SellerSummary, SellerSummaryResponse>()
          .ForMember(dest => dest.TotalProducts, opt => opt.MapFrom(src => src.Total))
          .ForMember(dest => dest.ActiveCount, opt => opt.MapFrom(src => src.Active))
          .ForMember(dest => dest.SoldCount, opt => opt.MapFrom(src => src.Sold));
        #endregion

        #region adminSummary
        CreateMap<AdminProductsSummary, AdminProductsSummaryResponse>()
          .ForMember(dest => dest.TotalProducts, opt => opt.MapFrom(src => src.Total))
          .ForMember(dest => dest.ActiveCount, opt => opt.MapFrom(src => src.Active))
          .ForMember(dest => dest.SoldCount, opt => opt.MapFrom(src => src.Sold))
          .ForMember(dest => dest.ClosedCount, opt => opt.MapFrom(src => src.Closed))
          .ForMember(dest => dest.DeletedCount, opt => opt.MapFrom(src => src.Deleted))
          .ForMember(dest => dest.UnderReviewCount, opt => opt.MapFrom(src => src.UnderReview));
        #endregion

        #endregion
    }
}