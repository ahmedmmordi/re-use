using System.Text.Json.Serialization;

using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

using ReUse.Infrastructure.Identity;
using ReUse.Infrastructure.Persistence;

namespace ReUse.API;

public static class DependencyInjection
{
    public static IServiceCollection AddPresentation(this IServiceCollection services)
    {
        services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(
                new JsonStringEnumConverter());
        });

        services.AddOpenApi();
        services.AddEndpointsApiExplorer();

        return services;
    }

    public static IServiceCollection AddSwagger(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "ReUse API",
                Version = "v1",
                Description = "ReUse",
                Contact = new OpenApiContact
                {
                    Name = "ReUse Team"
                }
            });

            options.UseInlineDefinitionsForEnums();

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter JWT token like: Bearer {your_token}"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });

            // options.IncludeXmlComments(
            //     Path.Combine(AppContext.BaseDirectory, "ReUse.API.xml"));
            //
            // options.IncludeXmlComments(
            //     Path.Combine(AppContext.BaseDirectory, "ReUse.ApplicationCore.xml"));
        });

        return services;
    }

    public static IServiceCollection AddDatabase(this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("pgsql");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddDbContext<AppIdentityDbContext>(options =>
            options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(AppIdentityDbContext).Assembly.FullName)));

        return services;
    }
}