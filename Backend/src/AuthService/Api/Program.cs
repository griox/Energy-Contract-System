using System;
using System.Text;
using Api.Infrastructures.Data;
using Api.Services;
using Api.Services.Interfaces;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Shared.Logging;
using Microsoft.AspNetCore.HttpOverrides; // 👈 Cần thêm cái này

var builder = WebApplication.CreateBuilder(args);

// ... (Đoạn 1, 2 giữ nguyên) ...

builder.Host.ConfigureSerilog("AuthService");
builder.Services.AddDbContext<AuthDBContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IAuthService, AuthService>();

// ... (Đoạn JWT giữ nguyên) ...
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ... (Đoạn Swagger giữ nguyên) ...
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Auth Service API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

// ✅ CORS: Đảm bảo có đúng domain production của frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
            b => b.WithOrigins(
                    "https://energy-contract-system-six.vercel.app", // Domain frontend thật
                    "http://localhost:5173" // (Giữ lại để lỡ cần debug)
                 )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials()); // Quan trọng
});

// ✅ COOKIE POLICY: Ép cứng bảo mật
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.CheckConsentNeeded = context => false;
    options.MinimumSameSitePolicy = SameSiteMode.None; // Bắt buộc None cho cross-site
    options.Secure = CookieSecurePolicy.Always; // Luôn luôn Secure
});

// ✅ FORWARDED HEADERS: Rất quan trọng khi Deploy
// Giúp app nhận biết được nó đang chạy HTTPS sau lớp Proxy/LoadBalancer
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

// ... (Đoạn MassTransit giữ nguyên) ...
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitMqUrl = builder.Configuration["RabbitMQ:Host"]; 
        if (string.IsNullOrEmpty(rabbitMqUrl)) rabbitMqUrl = "amqp://guest:guest@localhost:5672";
        cfg.Host(new Uri(rabbitMqUrl));
    });
});

var app = builder.Build();

// ==========================================
// 4. PIPELINE
// ==========================================

// ✅ Kích hoạt Forwarded Headers đầu tiên
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");    
app.UseCookiePolicy(); 
// app.UseHttpsRedirection(); // Có thể tắt dòng này nếu Nginx/Proxy đã xử lý redirect rồi, nhưng để cũng không sao

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDBContext>();
    db.Database.Migrate();
}
app.MapGet("/", () => "Auth Service is running!");
app.MapControllers();
app.Run();