using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

using ReUse.API.Responses;

public class AuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Forbidden &&
            authorizeResult.AuthorizationFailure?.FailureReasons
                .Any(r => r.Message == "Account is deactivated") == true)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new ErrorResponse
            {
                Code = "ACCOUNT_DEACTIVATED",
                Message = "Your account has been deactivated."
            });
            return;
        }

        await _default.HandleAsync(next, context, policy, authorizeResult);
    }
}