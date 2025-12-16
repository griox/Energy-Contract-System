using Api.Infrastructures.Persistence;
using Api.Common.Messaging.Contracts;
using MassTransit;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DB
builder.Services.AddDbContext<ContractHistoryDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin() // Chấp nhận mọi domain (localhost, vercel,...)
            .AllowAnyMethod() // Chấp nhận mọi method (GET, POST, PUT, DELETE...)
            .AllowAnyHeader()
            .AllowCredentials(); // Chấp nhận mọi header
    });
});

// RabbitMQ consumer
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<ContractChangedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq", "/", h => // nếu chạy local
        {
            h.Username("guest");
            h.Password("guest");
        });

        // cố định exchange name để 2 bên không lệch
        cfg.Message<ContractChangedEvent>(m => m.SetEntityName("contract-changed"));

        cfg.ReceiveEndpoint("contract-history-queue", e =>
        {
            // có thể giữ bind như bạn đang làm:
            e.Bind("contract-changed");

            e.ConfigureConsumer<ContractChangedConsumer>(context);
        });
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.Run();