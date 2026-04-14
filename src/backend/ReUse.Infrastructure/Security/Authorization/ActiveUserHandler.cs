using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using ReUse.Application.Exceptions;
using ReUse.Application.Interfaces;

namespace ReUse.Infrastructure.Security.Authorization;

public class ActiveUserHandler : AuthorizationHandler<ActiveUserRequirement>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDistributedCache _cache;
    private readonly ILogger<ActiveUserHandler> _logger;
    private readonly ActiveUserOptions _options;

    public ActiveUserHandler(
        IUnitOfWork unitOfWork,
        IDistributedCache cache,
        ILogger<ActiveUserHandler> logger,
        IOptions<ActiveUserOptions> options)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task HandleRequirementAsync(
      AuthorizationHandlerContext context,
      ActiveUserRequirement requirement)
    {
        var user = context.User;

        if (user?.Identity?.IsAuthenticated != true)
            return;

        var identityUserId = user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(identityUserId))
        {
            _logger.LogWarning("Missing NameIdentifier claim");
            context.Fail();
            return;
        }

        try
        {
            var domainUser = await _unitOfWork.User.GetByIdentityIdAsync(identityUserId);

            if (domainUser == null)
            {
                _logger.LogWarning("Domain user not found for IdentityUserId {IdentityUserId}", identityUserId);
                context.Fail();
                return;
            }

            var cacheKey = $"user:active:{domainUser.Id}";

            var cached = await _cache.GetStringAsync(cacheKey);

            if (cached == "true")
            {
                context.Succeed(requirement);
                return;
            }

            if (cached == "false")
            {
                context.Fail(new AuthorizationFailureReason(this, "Account is deactivated"));
                return;
            }

            var isActive = domainUser.IsActive;

            await _cache.SetStringAsync(
                cacheKey,
                isActive ? "true" : "false",
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow =
                        TimeSpan.FromMinutes(_options.CacheTTLMinutes)
                });

            if (isActive)
                context.Succeed(requirement);
            else
                context.Fail(new AuthorizationFailureReason(this, "Account is deactivated"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authorization check failed for IdentityUserId {IdentityUserId}", identityUserId);

            if (_options.FailClosedOnError)
                context.Fail();
        }
    }
}