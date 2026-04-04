using System;
using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;

using ReUse.Infrastructure.Identity;
using ReUse.Infrastructure.Persistence;

namespace ReUse.API;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(
                new JsonStringEnumConverter());
        });
        builder.Services.AddOpenApi();

        builder.Services.AddEndpointsApiExplorer();

        // add swagger
        builder.Services.AddSwaggerGen(options =>
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

        // DB
        var connectionString = builder.Configuration.GetConnectionString("pgsql");
        builder.Services.AddDbContext<ApplicationDbContext>(
            options => options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        builder.Services.AddDbContext<AppIdentityDbContext>(
            options => options.UseNpgsql(connectionString,
                b => b.MigrationsAssembly(typeof(AppIdentityDbContext).Assembly.FullName)));

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        app.UseAuthorization();


        app.MapControllers();

        app.Run();
    }
}