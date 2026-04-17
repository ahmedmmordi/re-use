using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Repository;
using ReUse.Application.Interfaces.Services.Auth;
using ReUse.Application.Interfaces.Services.Follows;
using ReUse.Application.Interfaces.Services.Images;
using ReUse.Application.Interfaces.Services.UserProfile;
using ReUse.Application.Options.Cloudniary;
using ReUse.Application.Services.Follows;

namespace ReUse.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services,
           IConfiguration configuration)
    {

        #region Services
        services.AddScoped<IFollowsService, FollowsService>();
        #endregion


        return services;
    }


}