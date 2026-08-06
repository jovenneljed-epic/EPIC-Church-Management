FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy project files first
COPY EPIC.Api/EPIC.Api.csproj EPIC.Api/
COPY EPIC.Core/EPIC.Core.csproj EPIC.Core/
COPY EPIC.Infrastructure/EPIC.Infrastructure.vbproj EPIC.Infrastructure/
COPY EPIC.Shared/EPIC.Shared.csproj EPIC.Shared/

# Restore dependencies
RUN dotnet restore EPIC.Api/EPIC.Api.csproj

# Copy the remaining source code
COPY EPIC.Api/ EPIC.Api/
COPY EPIC.Core/ EPIC.Core/
COPY EPIC.Infrastructure/ EPIC.Infrastructure/
COPY EPIC.Shared/ EPIC.Shared/

# Publish
RUN dotnet publish EPIC.Api/EPIC.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "EPIC.Api.dll"]