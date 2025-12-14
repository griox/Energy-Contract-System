using Api.Consumers;
using MassTransit;
using Api.Consumers;
using EmailService.Api.Consumers;
using Shared.Events;
// Add any missing using statements for services, e.g., Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Register additional services if needed (e.g., DbContext, email service)
// Example: builder.Services.AddDbContext<YourDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
// Example: builder.Services.AddScoped<IEmailService, EmailService>();

// Cấu hình MassTransit RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Đăng ký Consumer vừa tạo
    x.AddConsumer<ContractCreatedConsumer>();
    x.AddConsumer<AccountCreatedConsumer>();
    x.AddConsumer<InvoiceReminderConsumer>();  // Ensure this is defined and registered

    x.UsingRabbitMq((context, cfg) =>
    {
        // Cấu hình kết nối RabbitMQ (Lấy từ docker-compose)
        cfg.Host("rabbitmq", "/", h =>
        {
            h.Username("guest");
            h.Password("guest");
        });

        // Cấu hình hàng đợi (Queue)
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
app.Run();
    