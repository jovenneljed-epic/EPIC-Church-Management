using EPIC.Api.Data;
using EPIC.Api.Services;
using EPIC.Api.Authorization;
using EPIC.Core.Interfaces;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

using System.Text;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    EnvironmentName = Environments.Production
});
builder.Configuration.Sources.Clear();

builder.Configuration
    .AddJsonFile(
        "appsettings.json",
        optional: false,
        reloadOnChange: false
    )
    .AddJsonFile(
        $"appsettings.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: false
    )
    .AddEnvironmentVariables();

// ============================================================
// 1. CONFIGURATION
// ============================================================

var configuration = builder.Configuration;


// ============================================================
// 2. DATABASE
// ============================================================

var connectionString =
    configuration.GetConnectionString("EPICChurchDB");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string 'EPICChurchDB' is missing."
    );
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});


// ============================================================
// 3. CONTROLLERS
// ============================================================

builder.Services.AddControllers();


// ============================================================
// 4. CORS
// ============================================================
//
// EPIC FRONTEND
//
// Local development:
// http://localhost:5173
// http://localhost:5174
// http://localhost:5175
// http://localhost:5176
//
// LAN development:
// http://192.168.1.10:5173
// http://192.168.1.10:5174
// http://192.168.1.10:5175
// http://192.168.1.10:5176
//
// Preview:
// http://localhost:4173
// http://192.168.1.10:4173
//
// EPIC API:
// http://192.168.1.10:5109
//
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("EPICWebPolicy", policy =>
    {
        policy
            .WithOrigins(
          

                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://localhost:5177",

                "http://192.168.1.10:5173",
                "http://192.168.1.10:5174",
                "http://192.168.1.10:5175",
                "http://192.168.1.10:5176",
                "http://192.168.1.10:5177",

                "http://localhost:4173",
                "http://192.168.1.10:4173",
                "https://epic-cms.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
// ============================================================
// 5. APPLICATION SERVICES
// ============================================================

builder.Services.AddScoped<
    IPermissionService,
    PermissionService>();


// ============================================================
// 6. JWT CONFIGURATION
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
        "JWT Key is missing. Check appsettings.json."
    );
}

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException(
        "JWT Issuer is missing. Check appsettings.json."
    );
}

if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "JWT Audience is missing. Check appsettings.json."
    );
}


// ============================================================
// 7. AUTHENTICATION
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
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                ClockSkew =
                    TimeSpan.Zero
            };
    });


// ============================================================
// 8. AUTHORIZATION
// ============================================================

builder.Services.AddAuthorization();


// ============================================================
// 9. SWAGGER
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
        }
    );


    // --------------------------------------------------------
    // JWT AUTHORIZATION
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
        }
    );


    options.AddSecurityRequirement(
        document =>
            new Microsoft.OpenApi.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.OpenApiSecuritySchemeReference(
                        "Bearer",
                        document
                    ),

                    new List<string>()
                }
            }
    );
});


// ============================================================
// 10. BUILD APPLICATION
// ============================================================

var app = builder.Build();


// ============================================================
// 11. MEMBER PHOTO STORAGE
// ============================================================

var memberPhotoFolder =
    Path.Combine(
        app.Environment.ContentRootPath,
        "root-uploads-members"
    );

Directory.CreateDirectory(
    memberPhotoFolder
);


// ============================================================
// ============================================================
// ============================================================
// 12. SWAGGER
// ============================================================

app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint(
        "/swagger/v1/swagger.json",
        "EPIC Church Management API v1"
    );

    options.DocumentTitle =
        "EPIC Church Management API";
});

// ============================================================
// 13. CORS
// ============================================================
//
// MUST COME BEFORE AUTHENTICATION/AUTHORIZATION
//
// This allows:
// React :5176
//     ↓
// API  :5109
//
// ============================================================

app.UseCors("EPICWebPolicy");

app.UseAuthentication();

app.UseAuthorization();

// ============================================================
// 14. STATIC FILES - MEMBER PHOTOS
// ============================================================

app.UseStaticFiles(
    new StaticFileOptions
    {
        FileProvider =
            new PhysicalFileProvider(
                memberPhotoFolder
            ),

        RequestPath =
            "/member-photos"
    }
);


// ============================================================
// 15. HTTPS REDIRECTION
// ============================================================
//
// INTENTIONALLY DISABLED
//
// EPIC is currently using:
//
// http://192.168.1.10:5109
//
// Do NOT enable UseHttpsRedirection() while testing
// the LAN HTTP API.
//
// ============================================================


// ============================================================
// 16. AUTHENTICATION
// ============================================================

app.UseAuthentication();


// ============================================================
// 17. AUTHORIZATION
// ============================================================

app.UseAuthorization();


// ============================================================
// 18. CONTROLLERS
// ============================================================

app.MapControllers();


// ============================================================
// 19. START APPLICATION
// ============================================================

app.Run();