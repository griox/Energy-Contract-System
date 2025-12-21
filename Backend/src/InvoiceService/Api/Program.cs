using Api.Data;
using Quartz;
using MassTransit;
using Api.Jobs;
using Api.Consumers; // Nhớ namespace này
using Microsoft.EntityFrameworkCore;
using Shared.Logging;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// 1. Logging
builder.Host.ConfigureSerilog("InvoiceService");

// 2. DB Context
builder.Services.AddDbContext<InvoiceDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Cấu hình Quartz (Job định kỳ)
builder.Services.AddQuartz(q =>
{
    var jobKey = new JobKey("DailyInvoiceJob");
    q.AddJob<DailyInvoiceJob>(opts => opts.WithIdentity(jobKey));

    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("DailyInvoiceJob-trigger")
        // 👇 LOGIC GIỜ GIẤC:
        // Server thường chạy UTC. Muốn 8:00 sáng VN (UTC+7) thì set 1:00 sáng UTC.
        // Cron: "Giây Phút Giờ Ngày Tháng Thứ"
        .WithCronSchedule("0 0 3 * * ?", x => x 
            .WithMisfireHandlingInstructionFireAndProceed()) 
    ); 
});
builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

// 4. Cấu hình MassTransit (RabbitMQ)
builder.Services.AddMassTransit(x =>
{
    // Đăng ký Consumer
    x.AddConsumer<SyncOrderConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitMqUrl = builder.Configuration["RabbitMQ:Host"];
        if (string.IsNullOrEmpty(rabbitMqUrl)) rabbitMqUrl = "amqp://guest:guest@localhost:5672";
        
        cfg.Host(new Uri(rabbitMqUrl));

        // 👇 CẤU HÌNH RETRY (QUAN TRỌNG):
        // Nếu lỗi DB, thử lại 3 lần, mỗi lần cách nhau 5 giây
        cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));

        cfg.ReceiveEndpoint("invoice-sync-order", e =>
        {
            e.ConfigureConsumer<SyncOrderConsumer>(context);
        });
    });
});

// Thêm Health Check cho Render
builder.Services.AddHealthChecks();

var app = builder.Build();

// 5. Auto Migration an toàn
try 
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();
        // Kiểm tra nếu có migration chưa chạy thì mới chạy
        if (db.Database.GetPendingMigrations().Any())
        {
            db.Database.Migrate();
        }
    }
}
catch (Exception ex)
{
    // Log lỗi nhưng không crash app ngay lập tức nếu DB chưa sẵn sàng (để HealthCheck còn chạy)
    Console.WriteLine($"Migration Failed: {ex.Message}");
}

// Endpoint Health Check (Quan trọng cho Render/K8s)
app.MapHealthChecks("/health");

app.MapGet("/", () => "Invoice Service is running!");

app.Run();