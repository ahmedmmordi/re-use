using System.Security.Claims;

using ReUse.Application.Exceptions;

namespace ReUse.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("business_user_id");

        if (string.IsNullOrWhiteSpace(value))
            throw new UnauthorizedException();

        return int.Parse(value);
    }

    public static int GetAdminId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("business_admin_id");

        if (string.IsNullOrWhiteSpace(value))
            throw new UnauthorizedException();

        return int.Parse(value);
    }
}