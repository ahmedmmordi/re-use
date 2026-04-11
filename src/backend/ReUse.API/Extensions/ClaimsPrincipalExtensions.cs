using System.Security.Claims;

using ReUse.Application.Exceptions;

namespace ReUse.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    //public static Guid GetUserId(this ClaimsPrincipal user)
    //{
    //    var value = user.FindFirstValue("business_user_id");

    //    if (string.IsNullOrWhiteSpace(value))
    //        throw new UnauthorizedException();

    //    return Guid.Parse(value);
    //}

    //public static int GetAdminId(this ClaimsPrincipal user)
    //{
    //    var value = user.FindFirstValue("business_admin_id");

    //    if (string.IsNullOrWhiteSpace(value))
    //        throw new UnauthorizedException();

    //    return int.Parse(value);
    //}

    public static Guid GetBusinessId(this ClaimsPrincipal user)
    {
        var value = user.FindFirst("business_user_id")?.Value
                 ?? user.FindFirst("business_admin_id")?.Value;

        if (string.IsNullOrWhiteSpace(value))
            throw new UnauthorizedException();

        return Guid.Parse(value);
    }
}