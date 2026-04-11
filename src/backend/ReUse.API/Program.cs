using System;
using System.Text;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using Reuse.Infrastructure.Identity.Models;

using ReUse.API.Middlewares;
using ReUse.API.Responses;
using ReUse.Application.Errors;
using ReUse.Application.Interfaces;
using ReUse.Application.Interfaces.Services.Auth;
using ReUse.Application.Options.Auth;
using ReUse.Infrastructure;
using ReUse.Infrastructure.Identity;
using ReUse.Infrastructure.Interfaces.Repositories;
using ReUse.Infrastructure.Interfaces.Services;
using ReUse.Infrastructure.Persistence;
using ReUse.Infrastructure.Repositories;
using ReUse.Infrastructure.Seeders;
using ReUse.Infrastructure.Services.Auth;
using ReUse.Infrastructure.UnitOfWork;

using Serilog;

namespace ReUse.API;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddPresentation();
        builder.Services.AddSwagger();
        builder.Services.AddAutoMapperProfiles();
        builder.Services.AddDatabase(builder.Configuration);
        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.AddValidation();

        builder.Host.UseSerilog((context, configuration) =>
            configuration.ReadFrom.Configuration(context.Configuration));

        var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
                         ?? throw new InvalidOperationException("JWT configuration is missing");
        builder.Services.Configure<JwtOptions>(
            builder.Configuration.GetSection("Jwt"));

        builder.Services.Configure<RefreshTokenOptions>(
            builder.Configuration.GetSection("RefreshToken"));

        // Identity
        builder.Services.AddIdentityCore<ApplicationUser>(options =>
                {
                    options.Password.RequiredLength = 8;
                    options.Password.RequireDigit = true;
                    options.Password.RequireLowercase = true;
                    options.Password.RequireUppercase = true;
                    options.Password.RequireNonAlphanumeric = true;

                    options.User.RequireUniqueEmail = true;

                    options.User.AllowedUserNameCharacters =
                        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

                    options.SignIn.RequireConfirmedEmail = true;
                    options.SignIn.RequireConfirmedPhoneNumber = true;
                }
            )
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<AppIdentityDbContext>()
            .AddDefaultTokenProviders();

        // Auth
        builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme,
                options =>
                {
                    options.RequireHttpsMetadata = false; // to dev env
                    options.SaveToken = true;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtOptions.Issuer,
                        ValidAudience = jwtOptions.Audience,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwtOptions.SigningKey)
                        ),
                    };
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            // read token from cookie instead of header
                            var token = context.Request.Cookies["access_token"];

                            if (!string.IsNullOrEmpty(token))
                            {
                                context.Token = token;
                            }

                            return Task.CompletedTask;
                        },
                        OnChallenge = context =>
                        {
                            context.HandleResponse();

                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            context.Response.ContentType = "application/json";

                            var response = new ErrorResponse
                            {
                                Message = "User is not authenticated.",
                                Code = ErrorsCode.Unauthorized
                            };

                            return context.Response.WriteAsJsonAsync(response);
                        },

                        OnForbidden = context =>
                        {
                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            context.Response.ContentType = "application/json";

                            var response = new ErrorResponse
                            {
                                Message = "User is not authorized to access this resource.",
                                Code = ErrorsCode.Forbidden
                            };

                            return context.Response.WriteAsJsonAsync(response);
                        }
                    };
                }
            );

        builder.Services.AddAuthorization();

        builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

        builder.Services.AddScoped<IAuthService, JwtAuthService>();

        builder.Services.AddScoped<ITokenService, TokenService>();
        builder.Services.AddScoped<IEmailConfirmationService, EmailConfirmationService>();
        builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
        builder.Services.AddScoped<IEmailService, EmailService>();
        builder.Services.AddScoped<IOtpService, OtpService>();
        builder.Services.AddScoped<IIdentityUserRepository, IdentityUserRepository>();

        builder.Services.AddMemoryCache();
        builder.Services.AddSingleton<IAppCache, MemoryAppCache>();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowReactApp",
                policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials(); // important if using cookies/auth
                });
        });

        var app = builder.Build();

        // Apply pending migrations automatically
        using (var scope = app.Services.CreateScope())
        {
            var identity = scope.ServiceProvider.GetRequiredService<AppIdentityDbContext>();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            identity.Database.Migrate();
            db.Database.Migrate();
        }

        // Seed Data
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            RoleSeeder.SeedRolesAsync(services).GetAwaiter().GetResult();
            IdentitySeeder.SeedAdminAsync(services).GetAwaiter().GetResult();
        }

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseSerilogRequestLogging();
        app.UseHttpsRedirection();
        app.UseMiddleware<ExceptionMiddleware>();
        app.UseCors("AllowReactApp");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.Run();
    }
}