using Api.Consumers;
using Api.Data;
using Api.Models;
using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Shared.Events;
using Shared.Tests;
using Xunit;

namespace InvoiceService.Tests.Consumers
{
    public class SyncOrderConsumerTests : TestBase
    {
        private readonly Mock<ILogger<SyncOrderConsumer>> _mockLogger;

        public SyncOrderConsumerTests()
        {
            _mockLogger = new Mock<ILogger<SyncOrderConsumer>>();
        }

        // Helper để tạo DB riêng biệt cho mỗi test (tránh đụng độ dữ liệu)
        private InvoiceDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<InvoiceDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Tên ngẫu nhiên
                .Options;
            return new InvoiceDbContext(options);
        }

        [Fact]
        public async Task Consume_ShouldAddNewInvoice_WhenOrderDoesNotExist()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var consumer = new SyncOrderConsumer(context, _mockLogger.Object);

            var mockContext = new Mock<ConsumeContext<OrderCreatedEvent>>();
            var message = new OrderCreatedEvent
            {
                Id = 101, // ID mới
                ContractNumber = "HD-NEW",
                Email = "test@mail.com",
                TopupFee = 500000,
                FullName = "Nguyen Van A",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(30)
            };
            mockContext.Setup(x => x.Message).Returns(message);

            // --- ACT ---
            await consumer.Consume(mockContext.Object);

            // --- ASSERT ---
            // Kiểm tra DB có 1 record
            var savedInvoice = await context.InvoiceOrders.FirstOrDefaultAsync();
            savedInvoice.Should().NotBeNull();
            savedInvoice!.OriginalOrderId.Should().Be(101);
            savedInvoice.ContractNumber.Should().Be("HD-NEW");
            savedInvoice.Status.Should().Be("Unpaid");
            savedInvoice.IsReminderSent.Should().BeFalse();
        }

        [Fact]
        public async Task Consume_ShouldDoNothing_WhenOrderAlreadyExists()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            
            // 1. Giả lập trong DB đã có sẵn Order ID 101
            context.InvoiceOrders.Add(new InvoiceOrder 
            { 
                OriginalOrderId = 101, 
                ContractNumber = "HD-EXIST",
                Status = "Paid",
                // 👇 [SỬA LỖI TẠI ĐÂY] Thêm đầy đủ các trường bắt buộc (Required)
                // Nếu thiếu các trường này, EF Core sẽ báo lỗi DbUpdateException
                Email = "existing@test.com",
                FullName = "Existing User",
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(30),
                Amount = 100000,
                IsReminderSent = false
            });
            
            // Bây giờ hàm này sẽ chạy thành công vì đủ dữ liệu
            await context.SaveChangesAsync();

            var consumer = new SyncOrderConsumer(context, _mockLogger.Object);

            // 2. Message gửi đến cũng có ID 101 (để kích hoạt logic kiểm tra trùng)
            var mockContext = new Mock<ConsumeContext<OrderCreatedEvent>>();
            mockContext.Setup(x => x.Message).Returns(new OrderCreatedEvent 
            { 
                Id = 101, 
                ContractNumber = "HD-DUPLICATE",
                // Các field khác trong message không quan trọng vì Consumer sẽ return ngay khi check thấy ID trùng
                Email = "duplicate@test.com", 
                FullName = "Duplicate User"
            });

            // --- ACT ---
            await consumer.Consume(mockContext.Object);

            // --- ASSERT ---
            // Kiểm tra DB vẫn chỉ có 1 record cũ, không bị ghi đè hoặc thêm mới
            var invoices = await context.InvoiceOrders.ToListAsync();
            invoices.Count.Should().Be(1);
            invoices.First().ContractNumber.Should().Be("HD-EXIST"); // Vẫn là cái cũ (HD-EXIST), không phải cái mới (HD-DUPLICATE)
            
            // Kiểm tra Logger có cảnh báo
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("đã tồn tại")), // Check nội dung log
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception, string>>((v, t) => true)),
                Times.Once);
        }
    }
}