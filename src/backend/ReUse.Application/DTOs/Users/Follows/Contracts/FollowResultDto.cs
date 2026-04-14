using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Users.Follows.Contracts;

public record FollowResultDto(
    Guid FollowingId,
    string FullName,
    bool IsNowFollowing
);