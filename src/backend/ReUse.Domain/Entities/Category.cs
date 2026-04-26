namespace ReUse.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public bool IsActive { get; set; } = true;

    // Self-referencing relationship (Hierarchy)
    public Guid? ParentId { get; set; }
    public Category? Parent { get; set; }
    public ICollection<Category> Subcategories { get; set; } = new List<Category>();
}