using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Services;
using EPIC.Core.Interfaces;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// CONFIGURATION
// ============================================================

builder.Configuration.Sources
    .OfType<Microsoft.Extensions.Configuration.Json.JsonConfigurationSource>()
    .ToList()
    .ForEach(source =>
    {
        source.ReloadOnChange = false;
    });

builder.Configuration.Sources.Clear();

builder.Configuration
    .AddJsonFile(
        "appsettings.json",
        optional: false,
        reloadOnChange: false)
    .AddJsonFile(
        $"appsettings.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: false)
    .AddEnvironmentVariables();

var configuration = builder.Configuration;

// ============================================================
// DATABASE
// ============================================================

var connectionString =
    configuration.GetConnectionString("EPICChurchDB");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string 'EPICChurchDB' is missing.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("EPICWebPolicy", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                // LOCAL DEVELOPMENT
                if (origin.StartsWith(
                    "http://localhost:",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                // LAN DEVELOPMENT
                if (origin.StartsWith(
                    "http://192.168.1.10:",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                // PRODUCTION FRONTEND
                if (origin.Equals(
                    "https://epic-cms.vercel.app",
                    StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }

                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ============================================================
// APPLICATION SERVICES
// ============================================================

// ------------------------------------------------------------
// PERMISSION SERVICE
// ------------------------------------------------------------

builder.Services.AddScoped<
    IPermissionService,
    PermissionService>();

// ------------------------------------------------------------
// SUBSCRIPTION SERVICES
// ------------------------------------------------------------

builder.Services.AddScoped<
    SubscriptionLifecycleService>();

builder.Services.AddHostedService<
    SubscriptionLifecycleWorker>();

// ============================================================
// JWT CONFIGURATION
// ============================================================

var jwtKey =
    configuration["Jwt:Key"];

var jwtIssuer =
    configuration["Jwt:Issuer"];

var jwtAudience =
    configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "JWT Key is missing. Check appsettings.json.");
}

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException(
        "JWT Issuer is missing. Check appsettings.json.");
}

if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "JWT Audience is missing. Check appsettings.json.");
}

// ============================================================
// AUTHENTICATION
// ============================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    jwtIssuer,

                ValidAudience =
                    jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)),

                ClockSkew =
                    TimeSpan.Zero
            };
    });

// ============================================================
// AUTHORIZATION
// ============================================================

builder.Services.AddAuthorization();

// ============================================================
// SWAGGER
// ============================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new Microsoft.OpenApi.OpenApiInfo
        {
            Title =
                "EPIC Church Management API",

            Version =
                "v1",

            Description =
                "EPIC Church Management System API"
        });

    // --------------------------------------------------------
    // JWT SECURITY DEFINITION
    // --------------------------------------------------------

    options.AddSecurityDefinition(
        "Bearer",
        new Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Name =
                "Authorization",

            Type =
                Microsoft.OpenApi.SecuritySchemeType.Http,

            Scheme =
                "bearer",

            BearerFormat =
                "JWT",

            In =
                Microsoft.OpenApi.ParameterLocation.Header,

            Description =
                "Enter your JWT token."
        });

    // --------------------------------------------------------
    // JWT SECURITY REQUIREMENT
    // --------------------------------------------------------

    options.AddSecurityRequirement(
        document =>
            new Microsoft.OpenApi.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.OpenApiSecuritySchemeReference(
                        "Bearer",
                        document),

                    new List<string>()
                }
            });
});

// ============================================================
// BUILD
// ============================================================

var app = builder.Build();

// ============================================================
// MEMBER PHOTO STORAGE
// ============================================================

var memberPhotoFolder =
    Path.Combine(
        app.Environment.ContentRootPath,
        "root-uploads-members");

Directory.CreateDirectory(
    memberPhotoFolder);

// ============================================================
// SWAGGER
// ============================================================

app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint(
        "/swagger/v1/swagger.json",
        "EPIC Church Management API v1");

    options.DocumentTitle =
        "EPIC Church Management API";
});

// ============================================================
// CORS
// ============================================================
//
// MUST RUN BEFORE AUTHENTICATION/AUTHORIZATION
//
// ============================================================

app.UseCors("EPICWebPolicy");

// ============================================================
// STATIC MEMBER PHOTOS
// ============================================================

app.UseStaticFiles(
    new StaticFileOptions
    {
        FileProvider =
            new PhysicalFileProvider(
                memberPhotoFolder),

        RequestPath =
            "/member-photos"
    });

// ============================================================
// HTTPS REDIRECTION
// ============================================================
//
// INTENTIONALLY DISABLED FOR CURRENT LAN DEVELOPMENT.
//
// Local:
// http://localhost:5109
//
// LAN:
// http://192.168.1.10:5109
//
// ============================================================

// app.UseHttpsRedirection();

// ============================================================
// AUTHENTICATION
// ============================================================

app.UseAuthentication();

// ============================================================
// AUTHORIZATION
// ============================================================

app.UseAuthorization();

// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();

// ============================================================
// RUN
// ============================================================

app.Run();