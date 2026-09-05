
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
//
// Prevent JSON configuration files from automatically
// reloading while the application is running.
//

foreach (var source in builder.Configuration.Sources
    .OfType<Microsoft.Extensions.Configuration.Json.JsonConfigurationSource>())
{
    source.ReloadOnChange = false;
}


// ============================================================
// SERVICES
// ============================================================

ConfigureResend(
    builder,
    configuration);

ConfigureApplicationServices(
    builder);

ConfigureDatabase(
    builder.Services,
    configuration);

ConfigureCors(
    builder.Services);

ConfigureJwtAuthentication(
    builder.Services,
    configuration);

ConfigureSwagger(
    builder.Services);


// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();
builder.Services.AddMemoryCache();

// ============================================================
// AUTHORIZATION
// ============================================================

builder.Services.AddAuthorization();


// ============================================================
// BUILD
// ============================================================

var app = builder.Build();


// ============================================================
// DATABASE SEEDING
// ============================================================

await SeedDatabaseAsync(app);


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
// Enable when HTTPS is configured for production.
//

// app.UseHttpsRedirection();


// ============================================================
// AUTHENTICATION
// ============================================================
//
// IMPORTANT:
// Authentication MUST run before Authorization.
//

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
// APPLICATION SERVICES
// ============================================================

static void ConfigureApplicationServices(
    WebApplicationBuilder builder)
{
    // --------------------------------------------------------
    // HTTP CONTEXT
    // --------------------------------------------------------

    builder.Services.AddHttpContextAccessor();


    // --------------------------------------------------------
    // CURRENT USER
    // --------------------------------------------------------

    builder.Services.AddScoped<
        ICurrentUserService,
        CurrentUserService>();


    // --------------------------------------------------------
    // MEMBER ACCOUNT PROVISIONING
    // --------------------------------------------------------

    builder.Services.AddScoped<
        MemberAccountProvisioningService>();


    // --------------------------------------------------------
    // CLIENT PERMISSIONS
    // --------------------------------------------------------

    builder.Services.AddScoped<
        IClientPermissionService,
        ClientPermissionService>();

    builder.Services.AddScoped<
        ClientPermissionAuthorization>();


    // --------------------------------------------------------
    // GENERAL PERMISSIONS
    // --------------------------------------------------------

    builder.Services.AddScoped<
        IPermissionService,
        PermissionService>();


    // --------------------------------------------------------
    // SUBSCRIPTIONS
    // --------------------------------------------------------

    builder.Services.AddScoped<
        SubscriptionLifecycleService>();

    builder.Services.AddHostedService<
        SubscriptionLifecycleWorker>();
}


// ============================================================
// RESEND EMAIL CONFIGURATION
// ============================================================

static void ConfigureResend(
    WebApplicationBuilder builder,
    IConfiguration configuration)
{
    var resendApiKey =
        configuration["Resend:ApiKey"];

    if (string.IsNullOrWhiteSpace(
        resendApiKey))
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
            options.ApiToken =
                resendApiKey;
        });


    builder.Services.AddScoped<
        IResend,
        ResendClient>();


    builder.Services.AddScoped<
        ResendEmailService>();
}


// ============================================================
// DATABASE CONFIGURATION
// ============================================================

static void ConfigureDatabase(
    IServiceCollection services,
    IConfiguration configuration)
{
    var connectionString =
        configuration.GetConnectionString(
            "EPICChurchDB");

    if (string.IsNullOrWhiteSpace(
        connectionString))
    {
        throw new InvalidOperationException(
            "Database connection string " +
            "'EPICChurchDB' is missing.");
    }


    services.AddDbContext<ApplicationDbContext>(
        options =>
        {
            options.UseSqlServer(
                connectionString);
        });
}


// ============================================================
// CORS CONFIGURATION
// ============================================================

static void ConfigureCors(
    IServiceCollection services)
{
    services.AddCors(
        options =>
        {
            options.AddPolicy(
                "EPICWebPolicy",
                policy =>
                {
                    policy
                        .SetIsOriginAllowed(
                            IsAllowedOrigin)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
        });
}


// ============================================================
// JWT CONFIGURATION
// ============================================================

static void ConfigureJwtAuthentication(
    IServiceCollection services,
    IConfiguration configuration)
{
    // --------------------------------------------------------
    // READ SETTINGS
    // --------------------------------------------------------

    var jwtKey =
        configuration["Jwt:Key"];

    var jwtIssuer =
        configuration["Jwt:Issuer"];

    var jwtAudience =
        configuration["Jwt:Audience"];


    // --------------------------------------------------------
    // VALIDATE SETTINGS
    // --------------------------------------------------------

    if (string.IsNullOrWhiteSpace(jwtKey))
    {
        throw new InvalidOperationException(
            "JWT Key is missing. " +
            "Check appsettings.json.");
    }


    if (string.IsNullOrWhiteSpace(jwtIssuer))
    {
        throw new InvalidOperationException(
            "JWT Issuer is missing. " +
            "Check appsettings.json.");
    }


    if (string.IsNullOrWhiteSpace(jwtAudience))
    {
        throw new InvalidOperationException(
            "JWT Audience is missing. " +
            "Check appsettings.json.");
    }


    // --------------------------------------------------------
    // SECURITY KEY
    // --------------------------------------------------------

    var securityKey =
        new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                jwtKey));


    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    services
        .AddAuthentication(
            JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(
            options =>
            {
                // ------------------------------------------------
                // IMPORTANT
                // ------------------------------------------------
                //
                // Keep custom JWT claims exactly as generated
                // by ClientAuthController.
                //
                // Examples:
                //
                // clientMemberId
                // customerId
                // CustomerId
                // memberId
                // MemberId
                // clientRoleId
                // clientRoleName
                //
                // ------------------------------------------------

                options.MapInboundClaims =
                    false;


                // ------------------------------------------------
                // TOKEN VALIDATION
                // ------------------------------------------------

                options.TokenValidationParameters =
                    new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey =
                            true,

                        IssuerSigningKey =
                            securityKey,

                        ValidateIssuer =
                            true,

                        ValidIssuer =
                            jwtIssuer,

                        ValidateAudience =
                            true,

                        ValidAudience =
                            jwtAudience,

                        ValidateLifetime =
                            true,

                        ClockSkew =
                            TimeSpan.Zero,

                        // ------------------------------------------------
                        // ROLE CLAIM
                        // ------------------------------------------------
                        //
                        // ClientAuthController creates:
                        //
                        // ClaimTypes.Role = "CLIENT"
                        //
                        // Explicitly tell JWT authentication to use
                        // ClaimTypes.Role for [Authorize(Roles = "...")].
                        //

                        RoleClaimType =
                            ClaimTypes.Role,

                        // ------------------------------------------------
                        // NAME CLAIM
                        // ------------------------------------------------

                        NameClaimType =
                            ClaimTypes.Name
                    };


                // ------------------------------------------------
                // JWT EVENTS
                // ------------------------------------------------

                options.Events =
                    new JwtBearerEvents
                    {
                        // ============================================
                        // AUTHENTICATION FAILED
                        // ============================================

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
                                    $"Exception Type: " +
                                    $"{context.Exception.GetType().FullName}");

                                Console.WriteLine(
                                    $"Message: " +
                                    $"{context.Exception.Message}");

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


                        // ============================================
                        // TOKEN VALIDATED
                        // ============================================

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
                                    $"User: " +
                                    $"{context.Principal?.Identity?.Name}");

                                Console.WriteLine(
                                    $"Authenticated: " +
                                    $"{context.Principal?.Identity?.IsAuthenticated}");

                                Console.WriteLine(
                                    $"Authentication Type: " +
                                    $"{context.Principal?.Identity?.AuthenticationType}");

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


                        // ============================================
                        // AUTHORIZATION CHALLENGE
                        // ============================================

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

                                var failureType =
                                    context.AuthenticateFailure
                                        ?.GetType()
                                        .FullName
                                    ?? "(none)";

                                Console.WriteLine(
                                    $"Authenticate Failure: " +
                                    $"{failureType}");

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
}


// ============================================================
// SWAGGER CONFIGURATION
// ============================================================

static void ConfigureSwagger(
    IServiceCollection services)
{
    services.AddEndpointsApiExplorer();


    services.AddSwaggerGen(
        options =>
        {
            // ----------------------------------------------------
            // DOCUMENT
            // ----------------------------------------------------

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


            // ----------------------------------------------------
            // BEARER SECURITY DEFINITION
            // ----------------------------------------------------

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


            // ----------------------------------------------------
            // SECURITY REQUIREMENT
            // ----------------------------------------------------

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
}


// ============================================================
// DATABASE SEEDING
// ============================================================

static async Task SeedDatabaseAsync(
    WebApplication app)
{
    using var scope =
        app.Services.CreateScope();

    var services =
        scope.ServiceProvider;


    try
    {
        var context =
            services.GetRequiredService<
                ApplicationDbContext>();


        // --------------------------------------------------------
        // CLIENT ROLES
        // --------------------------------------------------------

        await ClientRoleSeeder.SeedAsync(
            context);


        // --------------------------------------------------------
        // CLIENT PERMISSIONS
        // --------------------------------------------------------

        await ClientPermissionSeeder.SeedAsync(
            context);

        // --------------------------------------------------------
        // SUBSCRIPTION PLANS
        // --------------------------------------------------------

        await DatabaseSeeder.SeedSubscriptionPlansAsync(
            context);
    }
    catch (Exception ex)
    {
        var logger =
            services.GetRequiredService<
                ILogger<Program>>();

        logger.LogError(
            ex,
            "An error occurred while seeding client roles and permissions.");
    }
}


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
    // LOCAL LAN
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


    // --------------------------------------------------------
    // DENY EVERYTHING ELSE
    // --------------------------------------------------------

    return false;
}

