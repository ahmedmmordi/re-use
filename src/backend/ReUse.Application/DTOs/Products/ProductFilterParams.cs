using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.Enums;
using ReUse.Domain.Enums;

namespace ReUse.Application.DTOs.Products;

public class ProductFilterParams
{
    public PaginationParams Pagination { get; set; } = new();

    // Sort
    public ProductSortBy SortBy { get; set; } = ProductSortBy.Newest;

    public SortDirection SortDirection { get; set; } = SortDirection.Desc;

    // Search 
    public string? SearchTerm { get; set; }

    // Type & Condition multi-select
    public List<ProductType>? Types { get; set; }


    public List<ProductCondition>? Conditions { get; set; }

    //  Category 

    public Guid? CategoryId { get; set; }

    // Price range 
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    // Location
    public string? Location { get; set; }   // maps to Product.LocationCity


    // public double? MinSellerRating { get; set; }
}