using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Domain.Entities;

public class ProductImage : BaseEntity
{
    public string Url { get; set; } = null!;
    public int DisplayOrder { get; set; }
    //public bool IsPrimary { get; set; } // not needed since we can determine the primary image by the display order (the one with the lowest display order is the primary image)
    // cloudinary public id for deletion
    public string PublicId { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }
}