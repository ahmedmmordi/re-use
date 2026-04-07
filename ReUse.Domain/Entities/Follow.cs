using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Domain.Entities;

public class Follow : BaseEntity
{

    public Guid FollowerId { get; set; }
    public User FollowerUser { get; set; } = null!;
    public Guid FollowingId { get; set; }
    public User FollowingUser { get; set; } = null!;
}