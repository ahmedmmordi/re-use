# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ReUse.sln .
COPY ReUse.API/ReUse.API.csproj ReUse.API/
COPY ReUse.ApplicationCore/ReUse.ApplicationCore.csproj ReUse.ApplicationCore/
COPY ReUse.Infrastructure/ReUse.Infrastructure.csproj ReUse.Infrastructure/
COPY ReUse.Domain/ReUse.Domain.csproj ReUse.Domain/

# Restore dependencies
RUN dotnet restore ReUse.API/ReUse.API.csproj

# Copy the rest of the source code
COPY . .

# Build and publish
RUN dotnet publish ReUse.API/ReUse.API.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Expose HTTP port
EXPOSE 8080

# Copy published output
COPY --from=build /app/publish .

# Start the application
ENTRYPOINT ["dotnet", "ReUse.API.dll"]
