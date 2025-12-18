using Infrastructure;
using Serilog;
using Serilog.Events;
using FluentValidation;
using Api.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Api.Common.Messaging.Contracts;
using Application.Features.Orders.Commands.GetMyOrder;
using MassTransit;
using Shared.Logging;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. GIAI ĐOẠN ĐĂNG KÝ SERVICES (DI CONTAINER)
// ==========================================

builder.Host.ConfigureSerilog("CustomerService");

try
{
    Log.Information("Starting web host for EnergyContractService...");
    
    var applicationAssembly = typeof(Application.Features.Contracts.Commands.CreateContract.CreateContractHandler).Assembly;

    builder.Services.AddInfrastructureServices(builder.Configuration);
    builder.Services.AddValidatorsFromAssembly(applicationAssembly);

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

    // ĐĂNG KÝ HANDLERS
    builder.Services.AddTransient<Application.Features.Contracts.Commands.CreateContract.CreateContractHandler>();
    builder.Services.AddTransient<Application.Features.Contracts.Commands.UpdateContract.UpdateContractHandler>();
    builder.Services.AddTransient<Application.Features.Contracts.Commands.GetContract.GetContractByIdHandler>();
    builder.Services.AddTransient<Application.Features.Contracts.Commands.GetContractsByChoice.GetContractsByChoiceHandler>();
    builder.Services.AddTransient<Application.Features.Contracts.Commands.DeleteContract.DeleteContractHandler>();
    builder.Services.AddTransient<Application.Features.Contracts.Commands.GetContractByEmail.GetMyContractsHandler>();
    // Trong Program.cs
    builder.Services.AddScoped<Application.Features.Contracts.Commands.UpdatePdfUrl.UpdatePdfUrlHandler>();

    builder.Services.AddTransient<Application.Features.Addresses.Commands.CreateAddress.CreateAddressHandler>();
    builder.Services.AddTransient<Application.Features.Addresses.Commands.GetAllAddresses.GetAllAddressesHandler>();
    builder.Services.AddTransient<Application.Features.Addresses.Commands.GetAddress.GetAddressByIdHandler>();
    builder.Services.AddTransient<Application.Features.Addresses.Commands.DeleteAddress.DeleteAddressHandler>();
    builder.Services.AddTransient<Application.Features.Addresses.Commands.UpdateAddress.UpdateAddressHandler>();

    builder.Services.AddTransient<Application.Features.Resellers.Commands.CreateReseller.CreateResellerHandler>();
    builder.Services.AddTransient<Application.Features.Resellers.Commands.GetAllResellers.GetAllResellerHandler>();
    builder.Services.AddTransient<Application.Features.Resellers.Commands.UpdateReseller.UpdateResellerHandler>();
    builder.Services.AddTransient<Application.Features.Resellers.Commands.GetResellerById.GetResellerByIdHandler>();
    builder.Services.AddTransient<Application.Features.Resellers.Commands.DeleteReseller.DeleteResellerHandler>();

    builder.Services.AddTransient<Application.Features.Orders.Commands.CreateOrder.CreateOrderHandler>();
    builder.Services.AddTransient<Application.Features.Orders.Commands.GetAllOrders.GetAllOrdersHandler>();
    builder.Services.AddTransient<Application.Features.Orders.Commands.GetOrderById.GetOrderByIdHandler>();
    builder.Services.AddTransient<Application.Features.Orders.Commands.UpdateOrder.UpdateOrderHandler>();
    builder.Services.AddTransient<Application.Features.Orders.Commands.DeleteOrder.DeleteOrderHandler>();
    builder.Services.AddScoped<GetMyOrdersHandler>();

    builder.Services.AddTransient<Application.Features.ContractHistories.Commands.CreateContractHistory.CreateContractHistoryHandler>();
    builder.Services.AddTransient<Application.Features.ContractHistories.Commands.GetHistoryByContractId.GetHistoryByContractIdHandler>();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddHttpContextAccessor();
    // ==========================================
    // SWAGGER VỚI BEARER TOKEN - SỬA LẠI
    // ==========================================
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Energy Contract Service API",
            Version = "v1",
            Description = "API for managing energy contracts, addresses, and resellers"
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

    // CORS Configuration
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
                
        });
    });
    // Cấu hình RabbitMQ Producer
    builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        // 👇 Đọc từ biến môi trường
        var rabbitMqUrl = builder.Configuration["RabbitMQ:Host"]; 
        
        // Fallback cho local (nếu không có biến môi trường thì dùng localhost)
        if (string.IsNullOrEmpty(rabbitMqUrl)) 
        {
            rabbitMqUrl = "amqp://guest:guest@localhost:5672";
        }

        cfg.Host(rabbitMqUrl); // MassTransit sẽ tự parse username/password từ URL này

        cfg.Message<ContractChangedEvent>(m => m.SetEntityName("contract-changed"));
    });
});

    var app = builder.Build();

    // ==========================================
    // 2. GIAI ĐOẠN PIPELINE (MIDDLEWARE)
    // ==========================================

    app.UseMiddleware<ExceptionMiddleware>();
    app.UseMiddleware<AuthenticationMiddleware>();
    

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Energy Contract Service API V1");
            c.RoutePrefix = string.Empty;
        });
    }

    app.UseCors("AllowAll");
    app.UseHttpsRedirection();
    
    // ⚠️ QUAN TRỌNG: Thứ tự phải đúng!
    app.UseAuthentication();  // ← Phải trước UseAuthorization
    app.UseAuthorization();
    
    app.MapControllers();

    // ==========================================
    // 3. TỰ ĐỘNG MIGRATE DATABASE
    // ==========================================
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<Infrastructure.Persistence.EnergyDbContext>();

        if (context.Database.GetPendingMigrations().Any())
        {
            context.Database.Migrate();
        }
    }
    app.MapGet("/", () => "Customer Service is running!");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
