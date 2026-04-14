using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Domain.Entities;

namespace ReUse.Application.Mappers;

public class UserMappingSource
{
    public User DomainUser { get; init; } = null!;
    public string? IdentityUserName { get; init; }
    public bool EmailConfirmed { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public IEnumerable<string> Roles { get; init; } = [];

    /// <summary>Computed once here, mapped directly to UserDto.Status.</summary>
    public string ResolvedStatus { get; init; } = null!;
}