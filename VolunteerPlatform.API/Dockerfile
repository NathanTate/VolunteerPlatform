# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution + project files (layer-cache friendly)
COPY VolunteerPlatform.sln ./
COPY VolunteerPlatform.API/VolunteerPlatform.API.csproj             VolunteerPlatform.API/
COPY VolunteerPlatform.Application/VolunteerPlatform.Application.csproj  VolunteerPlatform.Application/
COPY VolunteerPlatform.Domain/VolunteerPlatform.Domain.csproj       VolunteerPlatform.Domain/
COPY VolunteerPlatform.Infrastructure/VolunteerPlatform.Infrastructure.csproj VolunteerPlatform.Infrastructure/

RUN dotnet restore

# Copy full source and publish
COPY . .
RUN dotnet publish VolunteerPlatform.API/VolunteerPlatform.API.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "VolunteerPlatform.API.dll"]
