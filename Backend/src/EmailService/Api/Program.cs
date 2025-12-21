using MassTransit;
using Shared.Events;
// Import các namespace chứa Consumer của bạn
using Api.Consumers; 
using Shared.Logging;
using Api.Service;
var builder = WebApplication.CreateBuilder(args);

builder.Host.ConfigureSerilog("EmailService");

builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

// --- Cấu hình MassTransit RabbitMQ ---
builder.Services.AddMassTransit(x =>
{
    // 1. Đăng ký tất cả các Consumer
    x.AddConsumer<ContractCreatedConsumer>();
    x.AddConsumer<AccountCreatedConsumer>();    
    x.AddConsumer<InvoiceReminderConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // 2. Lấy chuỗi kết nối từ biến môi trường
        var rabbitMqUrl = builder.Configuration["RabbitMQ:Host"];
        
        // Fallback cho local (nếu quên config)
        if (string.IsNullOrEmpty(rabbitMqUrl))
        {
            rabbitMqUrl = "amqp://guest:guest@localhost:5672";
        }

        // 3. Cấu hình Host (Quan trọng để parse user/pass/vhost từ URL)
        try 
        {
            cfg.Host(new Uri(rabbitMqUrl));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Lỗi cấu hình RabbitMQ URL: {rabbitMqUrl}. Chi tiết: {ex.Message}");
            throw; 
        }

        // 4. Cấu hình các Hàng đợi (Queues)
        cfg.ReceiveEndpoint("contract-created-queue", e =>
        {
            e.ConfigureConsumer<ContractCreatedConsumer>(context);
        });
        
        cfg.ReceiveEndpoint("account-created-queue", e =>
        {
            e.ConfigureConsumer<AccountCreatedConsumer>(context);
        });
        
        cfg.ReceiveEndpoint("invoice-reminder-queue", e =>
        {
            e.ConfigureConsumer<InvoiceReminderConsumer>(context);
        });
    });
});

var app = builder.Build();

// --- Endpoint Health Check (Để Render biết Service đang sống) ---
app.MapGet("/", () => "Email Service is running properly with Brevo!");

app.Run();