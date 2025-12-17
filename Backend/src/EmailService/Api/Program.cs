using Api.Consumers;
using MassTransit;
using Api.Consumers;
using EmailService.Api.Consumers;
using Shared.Events;

var builder = WebApplication.CreateBuilder(args);

// ... (các phần register khác giữ nguyên)

// Cấu hình MassTransit RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Đăng ký Consumer vừa tạo
    x.AddConsumer<ContractCreatedConsumer>();
    x.AddConsumer<AccountCreatedConsumer>();
    x.AddConsumer<InvoiceReminderConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        // Cấu hình kết nối RabbitMQ (Lấy từ docker-compose hoặc env var)
        var rabbitMqUrl = builder.Configuration["RabbitMQ:Host"];
        
        // Fallback cho local
        if (string.IsNullOrEmpty(rabbitMqUrl))
        {
            rabbitMqUrl = "amqp://guest:guest@localhost:5672";
        }

        // --- SỬA Ở ĐÂY ---
        // Bọc rabbitMqUrl vào trong "new Uri(...)"
        try 
        {
            cfg.Host(new Uri(rabbitMqUrl));
        }
        catch (Exception ex)
        {
            // Log ra để biết nếu url bị sai format
            Console.WriteLine($"Lỗi cấu hình RabbitMQ URL: {rabbitMqUrl}. Chi tiết: {ex.Message}");
            throw; 
        }
        // -----------------

        // Cấu hình hàng đợi (Queue) - Giữ nguyên
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
app.MapGet("/", () => "Email Service is running properly!");
app.Run();