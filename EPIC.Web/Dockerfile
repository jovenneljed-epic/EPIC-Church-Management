FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY EPIC.Core/EPIC.Core.csproj EPIC.Core/
COPY EPIC.Api/EPIC.Api.csproj EPIC.Api/

RUN dotnet restore EPIC.Api/EPIC.Api.csproj

COPY EPIC.Core/ EPIC.Core/
COPY EPIC.Api/ EPIC.Api/

RUN dotnet publish EPIC.Api/EPIC.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "EPIC.Api.dll"]