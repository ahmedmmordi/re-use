using Microsoft.EntityFrameworkCore;

using ReUse.API.Middlewares;
using ReUse.Infrastructure.Identity;
using ReUse.Infrastructure.Persistence;
using ReUse.Infrastructure.Seeders;

using Serilog;

namespace ReUse.API.Extensions;

public static class AppExtensions
{
    public static void ApplyMigrations(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var identity = scope.ServiceProvider.GetRequiredService<AppIdentityDbContext>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        identity.Database.Migrate();
        db.Database.Migrate();
    }

    public static void SeedData(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;

        RoleSeeder.SeedRolesAsync(services).GetAwaiter().GetResult();
        IdentitySeeder.SeedAdminAsync(services).GetAwaiter().GetResult();
    }

    public static void UseSwaggerServices(this WebApplication app)
    {
        app.MapOpenApi();
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    public static void UsePipeline(this WebApplication app)
    {
        app.UseSerilogRequestLogging();
        app.UseHttpsRedirection();
        app.UseCors("AllowReactApp");
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
    }
}