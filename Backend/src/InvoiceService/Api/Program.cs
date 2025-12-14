using Quartz;
using MassTransit;
using Api.Jobs;
using InvoiceService.Api.Infrastructures.Data;
using Microsoft.EntityFrameworkCore;

// ... imports khác

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Quartz
builder.Services.AddQuartz(q =>
{
    // Đăng ký Job
    var jobKey = new JobKey("DailyInvoiceJob");
    q.AddJob<DailyInvoiceJob>(opts => opts.WithIdentity(jobKey));

    // Đăng ký Trigger (Chạy lúc 8:00 sáng mỗi ngày)
    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("DailyInvoiceJob-trigger")
        .WithCronSchedule("0 0 8 * * ?")); // Cron expression: Giây Phút Giờ ...
});

builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

// 2. Cấu hình MassTransit
builder.Services.AddMassTransit(x =>
{
    // Consumer đồng bộ dữ liệu
    x.AddConsumer<SyncContractConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq", "/", h => { 
            h.Username("guest"); 
            h.Password("guest"); 
        });

        // Queue nhận tin tạo hợp đồng để đồng bộ
        cfg.ReceiveEndpoint("invoice-sync-contract", e =>
        {
            e.ConfigureConsumer<SyncContractConsumer>(context);
        });
    });
});

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