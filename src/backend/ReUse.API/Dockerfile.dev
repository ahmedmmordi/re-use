# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /app

# Copy csproj files first (for caching)
COPY ReUse.sln .
COPY ["ReUse.API/ReUse.API.csproj", "ReUse.API/"]
COPY ["ReUse.Application/ReUse.Application.csproj", "ReUse.Application/"]
COPY ["ReUse.Domain/ReUse.Domain.csproj", "ReUse.Domain/"]
COPY ["ReUse.Infrastructure/ReUse.Infrastructure.csproj", "ReUse.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "ReUse.API/ReUse.API.csproj"

# Copy the rest of the source code
COPY . .

WORKDIR "/app/ReUse.API"

# Run in watch mode (hot reload)
CMD ["dotnet", "run", "--urls=http://0.0.0.0:5000"]