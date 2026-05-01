# Configuration Guide

## Introduction
This guide provides an overview of the configuration options available for the application and how to extend them.

## Configuration Style
- we use IOptions pattern to bind the configuration settings to strongly typed classes.
- the configuration classes are located in `src/backend/Options` folder.
example configuration class:
```csharp
namespace ReUse.Application.Options;

public class JwtOptions
{
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int Lifetime { get; set; }
    public string SigningKey { get; set; }
}
```
and then you can register the configuration class in the `Program.cs` file by using the `services.Configure<T>` method.
Like this:
```csharp
builder.Services.Configure<JwtOptions>(
            builder.Configuration.GetSection("Jwt")); // this is sectoin name use to read settings for JwtOptions class
```

### Read Settings from appsettings.json

the appsettings.json file, you should have a section with the same name as the configuration class to bind the settings to the class properties.
for example, for the `JwtOptions` class, you should have a section named `Jwt` (same name as name in `GetSection` method) in the appsettings.json file like this:
```json
{
  "Jwt": {
    "Issuer": "value", 
    "Audience": "value",
    "Lifetime": 30,
    "SigningKey": "value"
  }
}
```

### Override Settings with Environment Variables
you can override the settings in the appsettings.json file with environment variables.
the environment variable name should be in the format of `SectionName:PropertyName` (same as the configuration class and property name).
for example, to override the `Issuer` property of the `JwtOptions` class, you can set the environment variable like this:
```
Jwt:Issuer=value
```
in detnet you can set the environment variable using the `dotnet user-secrets` tool or by setting it in the hosting environment.
but in this project we use docker to run the application, so you can set the environment variable in the `docker-compose.yml` file like this:
```yaml
services:
  backend:
    environment:
      - Jwt__Issuer=${JWT_ISSUER}
      - Jwt__Audience=${JWT_AUDIENCE}
      - Jwt__Lifetime=${JWT_LIFETIME}
      - Jwt__SigningKey=${JWT_KEY}
```

## Extending Configuration
to extend the configuration, you can create a new configuration class and register it in the `Program.cs` file.
like the previous example, you can create a new configuration class and bind it to a section in the appsettings.json file.
then you can use the `IOptions<T>` interface to inject the configuration settings into your services or controllers.

## Use Configuration in Services or Controllers
to use the configuration settings in your services or controllers, you can inject the `IOptions<T>` interface in the constructor and access the configuration values through the `Value` property.
for example, if you want to use the `JwtOptions` in a service, you can do it like this:
```csharp
public class JwtService
{
    private readonly JwtOptions _jwtOptions;

    public JwtService(IOptions<JwtOptions> jwtOptions)
    {
        _jwtOptions = jwtOptions.Value;
    }

    // use _jwtOptions to access the configuration values
}
```

