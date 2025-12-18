using System.Text;
using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using Api.Infrastructures;
using Api.Infrastructures.Data;
using Api.Infrastructures.MiddleWare;
using Api.Services;
using Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using QuestPDF.Infrastructure;
using Shared.Logging;

var builder = WebApplication.CreateBuilder(args);
builder.Host.ConfigureSerilog("PdfService");
// Configure QuestPDF License
QuestPDF.Settings.License = LicenseType.Community; // Add this line

builder.Host.UseSerilog();
try
{
    Log.Information("Starting PdfService with AWS S3...");

    // PostgreSQL Configuration
    builder.Services.AddDbContext<PdfDbContext>(options =>
        options.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsqlOptions =>
            {
                npgsqlOptions.MigrationsHistoryTable("__ef_migrations_history");
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null);
            })
    );


// ========================================
   // AWS S3 / MinIO Configuration
   // ========================================
   var awsAccessKey = builder.Configuration["AWS:AccessKey"];
   var awsSecretKey = builder.Configuration["AWS:SecretKey"];
   var awsRegion = builder.Configuration["AWS:Region"] ?? "ap-southeast-1";
   var serviceUrl = builder.Configuration["AWS:ServiceURL"];
   var forcePathStyle = builder.Configuration.GetValue<bool>("AWS:ForcePathStyle");
   
   if (string.IsNullOrEmpty(awsAccessKey) || string.IsNullOrEmpty(awsSecretKey))
   {
       Log.Warning("AWS credentials not found in configuration. Trying default credential chain...");
       
       var awsOptions = builder.Configuration.GetAWSOptions();
       awsOptions.Region = RegionEndpoint.GetBySystemName(awsRegion);
       builder.Services.AddDefaultAWSOptions(awsOptions);
   }
   else
   {
       var storageType = string.IsNullOrEmpty(serviceUrl) ? "AWS S3" : "MinIO";
       Log.Information($"Using {storageType}. Region: {awsRegion}");
   
       var awsOptions = new Amazon.Extensions.NETCore.Setup.AWSOptions
       {
           Credentials = new BasicAWSCredentials(awsAccessKey, awsSecretKey),
           Region = RegionEndpoint.GetBySystemName(awsRegion)
       };
   
       builder.Services.AddDefaultAWSOptions(awsOptions);
   }
   
   // Configure S3 Client cho MinIO hoặc AWS S3
   builder.Services.AddSingleton<IAmazonS3>(sp =>
   {
       var awsOptions = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<Amazon.Extensions.NETCore.Setup.AWSOptions>>().Value;
       
       var s3Config = new AmazonS3Config
       {
           RegionEndpoint = RegionEndpoint.GetBySystemName(awsRegion),
           ForcePathStyle = forcePathStyle,
           UseHttp = !string.IsNullOrEmpty(serviceUrl)
       };
   
       // Nếu có ServiceURL (MinIO), sử dụng nó
       if (!string.IsNullOrEmpty(serviceUrl))
       {
           s3Config.ServiceURL = serviceUrl;
           s3Config.UseHttp = serviceUrl.StartsWith("http://");
       }

       return new AmazonS3Client(
           new BasicAWSCredentials(awsAccessKey, awsSecretKey),
           s3Config
       );
   });
   // ==========================================
   // JWT AUTHENTICATION - THÊM MỚI
   // ==========================================
   var jwtKey = builder.Configuration["Jwt:Key"];
   var jwtIssuer = builder.Configuration["Jwt:Issuer"];
   var jwtAudience = builder.Configuration["Jwt:Audience"];

   builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddJwtBearer(options =>
       {
           options.TokenValidationParameters = new TokenValidationParameters
           {
               ValidateIssuer = true,
               ValidateAudience = true,
               ValidateLifetime = true,
               ValidateIssuerSigningKey = true,
               ValidIssuer = jwtIssuer,
               ValidAudience = jwtAudience,
               IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
               ClockSkew = TimeSpan.Zero
           };
       });

   builder.Services.AddAuthorization();

    // Register Services - UPDATED
    builder.Services.AddScoped<IPdfGenerator, PdfGenerator>();
    builder.Services.AddScoped<IStorageService, AwsS3StorageService>(); 
    builder.Services.AddScoped<ITemplateService, TemplateService>();
    builder.Services.AddScoped<IPdfService, PdfService>();
    // Trong Program.cs của PdfService
    builder.Services.AddHttpClient<ICustomerApiClient, CustomerApiClient>();

    // Controllers
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    // ==========================================
    // SWAGGER VỚI BEARER TOKEN - SỬA LẠI
    // ==========================================
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Energy PDF Service API",
            Version = "v1",
            Description = "API for managing PDF and common template "
        });

        // Thêm Bearer Token vào Swagger
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });

        c.OrderActionsBy(api => api.RelativePath);
    });

    // CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
    });

    var app = builder.Build();

    // Auto-migrate database on startup
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<PdfDbContext>();
        try
        {
            Log.Information("Applying database migrations...");
            await db.Database.MigrateAsync();
            Log.Information("Database migrations applied successfully");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error applying database migrations");
        }
    }

    // Middleware
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "PDF Service API V1");
            c.RoutePrefix = string.Empty;
        });
    }
    app.UseMiddleware<AuthenticationMiddleware>();

    app.UseSerilogRequestLogging();
    app.UseCors("AllowAll");
    app.UseHttpsRedirection();
    app.UseAuthorization();
    app.MapControllers();
    Log.Information("PdfService started successfully with AWS S3 storage");
    app.MapGet("/", () => "PDF Service is running!");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application start-up failed");
}
finally
{
    Log.CloseAndFlush();
}