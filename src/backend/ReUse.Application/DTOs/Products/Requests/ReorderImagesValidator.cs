using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using FluentValidation;

namespace ReUse.Application.DTOs.Products.Requests;

public class ReorderImagesValidator : AbstractValidator<ReorderImagesRequest>
{
    public ReorderImagesValidator()
    {
        // Basic validation
        RuleFor(x => x.Items)
            .NotNull().WithMessage("Items are required")
            .NotEmpty().WithMessage("At least one item is required");

        // Detailed validation only if items exist
        When(x => x.Items is not null && x.Items.Any(), () =>
        {
            // Validate each item
            RuleForEach(x => x.Items)
                .ChildRules(item =>
                {
                    item.RuleFor(x => x.ImageId)
                        .NotEmpty()
                        .WithMessage("ImageId cannot be empty");

                    item.RuleFor(x => x.DisplayOrder)
                        .GreaterThanOrEqualTo(0)
                        .WithMessage("DisplayOrder must be non-negative");
                });

            // Ensure sequential order starting from 0 Cover = 0 guaranteed
            RuleFor(x => x.Items)
                .Must(items =>
                {
                    var orders = items
                        .Select(i => i.DisplayOrder)
                        .OrderBy(x => x)
                        .ToList();

                    return orders.SequenceEqual(
                        Enumerable.Range(0, items.Count)
                    );
                })
                .WithMessage("DisplayOrder must start from 0 and be sequential without gaps");

            //  Ensure no duplicate image IDs
            RuleFor(x => x.Items)
                .Must(items =>
                {
                    var ids = items.Select(i => i.ImageId).ToList();
                    return ids.Distinct().Count() == ids.Count;
                })
                .WithMessage("Duplicate image IDs are not allowed");
        });
    }
}