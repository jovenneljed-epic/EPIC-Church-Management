
using EPIC.Api.Authorization;
using EPIC.Api.Data;
using EPIC.Api.Services;
using EPIC.Core.Interfaces;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

using Resend;

using System.Security.Claims;
using System.Text;

// ============================================================
// BUILDER
// ============================================================

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;


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


// ============================================================
// RESEND EMAIL SERVICE
// ============================================================

var resendApiKey = configuration["Resend:ApiKey"];

if (string.IsNullOrWhiteSpace(resendApiKey))
{
    throw new InvalidOperationException(
        "Resend API key is missing. " +
        "Check appsettings.json, User Secrets, " +
        "or environment variables.");
}

builder.Services.AddHttpClient();

builder.Services.Configure<ResendClientOptions>(
    options =>
    {
        options.ApiToken = resendApiKey;
    });

builder.Services.AddScoped<IResend, ResendClient>();

builder.Services.AddScoped<ResendEmailService>();


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

builder.Services.AddDbContext<ApplicationDbContext>(
    options =>
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

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "EPICWebPolicy",
            policy =>
            {
                policy
                    .SetIsOriginAllowed(IsAllowedOrigin)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
    });


// ============================================================
// APPLICATION SERVICES
// ============================================================

// Permission service
builder.Services.AddScoped<
    IPermissionService,
    PermissionService>();

// Subscription lifecycle
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
        // --------------------------------------------------------
        // HTTPS
        // --------------------------------------------------------

        options.RequireHttpsMetadata = false;

        options.SaveToken = true;


        // --------------------------------------------------------
        // TOKEN VALIDATION
        // --------------------------------------------------------

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,


                // ------------------------------------------------
                // ISSUER
                // ------------------------------------------------

                ValidIssuer =
                    jwtIssuer,


                // ------------------------------------------------
                // AUDIENCE
                // ------------------------------------------------

                ValidAudiences = new[]
                {
                    jwtAudience,
                    "EPIC.Web",
                    "EPIC.MobileApp"
                },


                // ------------------------------------------------
                // SIGNING KEY
                // ------------------------------------------------

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtKey)),

                RoleClaimType = ClaimTypes.Role,
                NameClaimType = ClaimTypes.Name,
                // ------------------------------------------------
                // CLOCK SKEW
                // ------------------------------------------------

                ClockSkew =
                    TimeSpan.Zero
            };


        // ========================================================
        // JWT DEBUGGING
        // ========================================================

        options.Events =
            new JwtBearerEvents
            {
                // ------------------------------------------------
                // AUTHENTICATION FAILED
                // ------------------------------------------------

                OnAuthenticationFailed =
                    context =>
                    {
                        Console.WriteLine();

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine(
                            "JWT AUTHENTICATION FAILED");

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine(
                            "Exception Type:");

                        Console.WriteLine(
                            context.Exception
                                .GetType()
                                .FullName);

                        Console.WriteLine();

                        Console.WriteLine(
                            "Message:");

                        Console.WriteLine(
                            context.Exception.Message);

                        Console.WriteLine();

                        Console.WriteLine(
                            "Full Exception:");

                        Console.WriteLine(
                            context.Exception);

                        if (context.Exception.InnerException != null)
                        {
                            Console.WriteLine();

                            Console.WriteLine(
                                "Inner Exception:");

                            Console.WriteLine(
                                context.Exception.InnerException);
                        }

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine();

                        return Task.CompletedTask;
                    },


                // ------------------------------------------------
                // TOKEN VALIDATED
                // ------------------------------------------------

                OnTokenValidated =
                    context =>
                    {
                        Console.WriteLine();

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine(
                            "JWT TOKEN VALIDATED");

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine(
                            $"User: {context.Principal?.Identity?.Name}");

                        Console.WriteLine(
                            $"Authenticated: " +
                            $"{context.Principal?.Identity?.IsAuthenticated}");

                        Console.WriteLine();

                        foreach (
                            var claim
                            in context.Principal?.Claims
                            ?? Enumerable.Empty<Claim>())
                        {
                            Console.WriteLine(
                                $"CLAIM: {claim.Type} = {claim.Value}");
                        }

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine();

                        return Task.CompletedTask;
                    },


                // ------------------------------------------------
                // AUTHORIZATION CHALLENGE
                // ------------------------------------------------

                OnChallenge =
                    context =>
                    {
                        Console.WriteLine();

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine(
                            "JWT AUTHORIZATION CHALLENGE");

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine(
                            $"Error: " +
                            $"{context.Error ?? "(none)"}");

                        Console.WriteLine(
                            $"Description: " +
                            $"{context.ErrorDescription ?? "(none)"}");

                        Console.WriteLine(
                            $"AuthenticateFailure: " +
                            $"{context.AuthenticateFailure?.GetType().FullName ?? "(none)"}");

                        if (context.AuthenticateFailure != null)
                        {
                            Console.WriteLine();

                            Console.WriteLine(
                                "Authentication Failure:");

                            Console.WriteLine(
                                context.AuthenticateFailure);
                        }

                        Console.WriteLine(
                            "================================================");

                        Console.WriteLine();

                        return Task.CompletedTask;
                    }
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

builder.Services.AddSwaggerGen(
    options =>
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
        // BEARER SECURITY DEFINITION
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
        // BEARER SECURITY REQUIREMENT
        // --------------------------------------------------------

        options.AddSecurityRequirement(
            document =>
                new Microsoft.OpenApi.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi
                            .OpenApiSecuritySchemeReference(
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

app.UseSwaggerUI(
    options =>
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

app.UseCors(
    "EPICWebPolicy");


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
// Disabled for current LAN development.
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


// ============================================================
// CORS HELPER
// ============================================================

static bool IsAllowedOrigin(
    string origin)
{
    // --------------------------------------------------------
    // LOCALHOST
    // --------------------------------------------------------

    if (origin.StartsWith(
        "http://localhost:",
        StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }


    // --------------------------------------------------------
    // LAN
    // --------------------------------------------------------

    if (origin.StartsWith(
        "http://192.168.1.10:",
        StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }


    // --------------------------------------------------------
    // PRODUCTION
    // --------------------------------------------------------

    if (origin.Equals(
        "https://epic-cms.vercel.app",
        StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }


    return false;
}

