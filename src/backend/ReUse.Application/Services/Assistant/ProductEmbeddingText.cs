using System.Text;

using ReUse.Domain.Entities;

namespace ReUse.Application.Services.Assistant;

// Single source of truth for the text used to embed a product. Used by both
// the sync hooks (on create/update) and the backfill feed, so the embedded
// representation stays identical across both paths.
public static class ProductEmbeddingText
{
    public static string Compose(Product product)
    {
        var sb = new StringBuilder();

        sb.Append(product.Title);

        if (!string.IsNullOrWhiteSpace(product.Description))
            sb.Append(". ").Append(product.Description);

        if (product.Category is not null && !string.IsNullOrWhiteSpace(product.Category.Name))
            sb.Append(". Category: ").Append(product.Category.Name);

        if (product is SwapProduct swap)
        {
            if (!string.IsNullOrWhiteSpace(swap.WantedItemTitle))
                sb.Append(". Wanted: ").Append(swap.WantedItemTitle);

            if (!string.IsNullOrWhiteSpace(swap.WantedItemDescription))
                sb.Append(". ").Append(swap.WantedItemDescription);
        }

        return sb.ToString();
    }
}