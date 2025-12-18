using Api.Data;
using Quartz;
using MassTransit;
using Api.Jobs;
using Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Shared.Logging;

// ... imports khác

var builder = WebApplication.CreateBuilder(args);
builder.Host.ConfigureSerilog("InvoiceService");
// 1. Cấu hình Quartz
builder.Services.AddQuartz(q =>
{
    // Đăng ký Job
    var jobKey = new JobKey("DailyInvoiceJob");
    q.AddJob<DailyInvoiceJob>(opts => opts.WithIdentity(jobKey));

    // Đăng ký Trigger (Chạy lúc 8:00 sáng mỗi ngày)
    // Trong phần cấu hình Quartz
    q.AddTrigger(opts => opts
            .ForJob(jobKey)
            .WithIdentity("DailyInvoiceJob-trigger")
            .WithCronSchedule("0 0 10 * * ?", x => x
                .WithMisfireHandlingInstructionFireAndProceed()) 
    ); 
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

// 2. Cấu hình MassTransit
// ...
builder.Services.AddMassTransit(x =>
{
    // Đổi sang Consumer mới
    x.AddConsumer<Api.Consumers.SyncOrderConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitMqUrl = builder.Configuration["RabbitMQ:Host"];
        if (string.IsNullOrEmpty(rabbitMqUrl))
        {
            rabbitMqUrl = "amqp://guest:guest@localhost:5672";
        }
        
        // 👇 SỬA Ở ĐÂY: Bọc nó vào new Uri()
        cfg.Host(new Uri(rabbitMqUrl));

        // Queue nhận tin tạo Order
        cfg.ReceiveEndpoint("invoice-sync-order", e =>
        {
            e.ConfigureConsumer<Api.Consumers.SyncOrderConsumer>(context);
        });
    });
});
// ...

// ... Đăng ký DB, Controller ...
// 1. Đăng ký InvoiceDbContext
builder.Services.AddDbContext<InvoiceDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
var app = builder.Build();

// 2. Auto Migration (Tự động tạo bảng khi chạy)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();
    db.Database.Migrate();
}

app.Run();