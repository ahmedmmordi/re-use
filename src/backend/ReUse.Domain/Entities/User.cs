using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Domain.Entities;

public class User : BaseEntity
{
    // FK to ASP.NET Identity user
    public string IdentityUserId { get; set; } = null!;

    // Personal Info
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }

    // Profile
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }

    public string? CoverImageUrl { get; set; }

    //For Deactive
    public bool IsActive { get; set; } = true;
    public DateTime? DeactivatedAt { get; set; }
    public string? DeactivationReason { get; set; }

    //Cloudinary doesn't delete by URL I need Id 
    public string? ProfileImagePublicId { get; set; }
    public string? CoverImagePublicId { get; set; }

    // Location 
    public string? AddressLine1 { get; set; }
    public string? City { get; set; }
    public string? StateProvince { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }

    public ICollection<Follow> Followers { get; set; } = new List<Follow>();
    public ICollection<Follow> Following { get; set; } = new List<Follow>();
}