using ReUse.API.Extensions;
using ReUse.Application;
using ReUse.Application.Hubs;
using ReUse.Infrastructure;
using ReUse.Infrastructure.Notifications.SignalR;

using Serilog;

namespace ReUse.API;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        #region Layers
        builder.Services.AddPresentation();
        builder.Services.AddApplication(builder.Configuration);
        builder.Services.AddInfrastructure(builder.Configuration);
        #endregion

        #region Cross-cutting
        builder.Services.AddHttpServices();
        builder.Services.AddIdentityServices();
        builder.Services.AddAuth(builder.Configuration);
        builder.Services.AddValidation();
        builder.Services.AddAutoMapperProfiles();
        builder.Services.AddCorsPolicy();
        #endregion

        // Add Swagger

        builder.Services.AddSwagger();

        builder.Host.UseSerilog((context, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration));

        var app = builder.Build();

        app.ApplyMigrations();


        if (app.Environment.IsDevelopment())
        {
            app.SeedData();
        }

        if (app.Environment.IsDevelopment())
        {
            app.UseSwaggerServices();
        }

        app.UsePipeline();

        app.MapHub<NotificationHub>("/hubs/notifications");
        app.MapHub<ChatHub>("/hubs/chat");
        app.MapGet("/health", () => Results.Ok()).AllowAnonymous();
        app.Run();
    }
}