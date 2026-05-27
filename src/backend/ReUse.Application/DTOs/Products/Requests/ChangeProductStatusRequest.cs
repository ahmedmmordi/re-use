using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products.Requests;

public record ChangeProductStatusRequest(ProductStatus Status);