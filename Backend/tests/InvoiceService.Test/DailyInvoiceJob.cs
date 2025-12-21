using Api.Data;
using Api.Jobs;
using Api.Models;
using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Quartz;
using Shared.Events;
using Shared.Tests;
using Xunit;

namespace InvoiceService.Tests.Jobs
{
    public class DailyInvoiceJobTests : TestBase
    {
        private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
        private readonly Mock<ILogger<DailyInvoiceJob>> _mockLogger;
        private readonly Mock<IJobExecutionContext> _mockJobContext;

        public DailyInvoiceJobTests()
        {
            _mockPublishEndpoint = new Mock<IPublishEndpoint>();
            _mockLogger = new Mock<ILogger<DailyInvoiceJob>>();
            _mockJobContext = new Mock<IJobExecutionContext>();
        }

        private InvoiceDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<InvoiceDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                // 👇 THÊM DÒNG NÀY ĐỂ BỎ QUA LỖI TRANSACTION
                .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning)) 
                .Options;
                
            return new InvoiceDbContext(options);
        }
        [Fact]
        public async Task Execute_ShouldPublishEvent_And_UpdateStatus_ForDueOrders()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1); // Ngày mai hết hạn

            // Data 1: Đủ điều kiện (Ngày mai hết, Chưa trả, Chưa gửi mail)
            var validOrder = new InvoiceOrder
            {
                Id = 1,
                OriginalOrderId = 100,
                ContractNumber = "HD-VALID",
                EndDate = tomorrow, // Trùng khớp
                Status = "Unpaid",
                IsReminderSent = false,
                Email = "valid@test.com",
                FullName = "Valid User",
                Amount = 500000,
                StartDate = DateTime.Now
            };

            // Data 2: Sai ngày (Ngày kia mới hết hạn)
            var futureOrder = new InvoiceOrder
            {
                Id = 2,
                OriginalOrderId = 200,
                EndDate = tomorrow.AddDays(1), 
                Status = "Unpaid",
                IsReminderSent = false,
                // 👇 [SỬA LỖI] Thêm các trường bắt buộc
                ContractNumber = "HD-FUTURE",
                Email = "future@test.com",
                FullName = "Future User",
                Amount = 500000,
                StartDate = DateTime.Now
            };

            // Data 3: Đã trả tiền rồi
            var paidOrder = new InvoiceOrder
            {
                Id = 3,
                OriginalOrderId = 300,
                EndDate = tomorrow,
                Status = "Paid", // Đã trả
                IsReminderSent = false,
                // 👇 [SỬA LỖI] Thêm các trường bắt buộc
                ContractNumber = "HD-PAID",
                Email = "paid@test.com",
                FullName = "Paid User",
                Amount = 500000,
                StartDate = DateTime.Now
            };

            // Data 4: Đã gửi nhắc nhở rồi
            var sentOrder = new InvoiceOrder
            {
                Id = 4,
                OriginalOrderId = 400,
                EndDate = tomorrow,
                Status = "Unpaid",
                IsReminderSent = true, // Đã gửi
                // 👇 [SỬA LỖI] Thêm các trường bắt buộc
                ContractNumber = "HD-SENT",
                Email = "sent@test.com",
                FullName = "Sent User",
                Amount = 500000,
                StartDate = DateTime.Now
            };

            // Thêm tất cả vào DB
            context.InvoiceOrders.AddRange(validOrder, futureOrder, paidOrder, sentOrder);
            
            // Bước này sẽ KHÔNG còn lỗi DbUpdateException nữa vì dữ liệu đã đủ
            await context.SaveChangesAsync(); 

            var job = new DailyInvoiceJob(context, _mockPublishEndpoint.Object, _mockLogger.Object);

            // --- ACT ---
            await job.Execute(_mockJobContext.Object);

            // --- ASSERT ---
            
            // 1. Kiểm tra Publish: Chỉ được gọi 1 lần cho đơn Valid (HD-VALID)
            _mockPublishEndpoint.Verify(x => x.Publish(
                It.Is<InvoiceReminderEvent>(e => e.ContractNumber == "HD-VALID"), 
                It.IsAny<CancellationToken>()), 
                Times.Once);

            // 2. Kiểm tra DB: Đơn Valid phải được cập nhật IsReminderSent = true
            var updatedOrder = await context.InvoiceOrders.FindAsync(1);
            updatedOrder!.IsReminderSent.Should().BeTrue();

            // 3. Các đơn khác không bị ảnh hưởng
            (await context.InvoiceOrders.FindAsync(2))!.IsReminderSent.Should().BeFalse(); // Sai ngày
            (await context.InvoiceOrders.FindAsync(3))!.IsReminderSent.Should().BeFalse(); // Đã trả
            (await context.InvoiceOrders.FindAsync(4))!.IsReminderSent.Should().BeTrue(); // Giữ nguyên trạng thái cũ
        }
        
        [Fact]
        public async Task Execute_ShouldDoNothing_WhenNoOrdersDue()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            // DB rỗng
            
            var job = new DailyInvoiceJob(context, _mockPublishEndpoint.Object, _mockLogger.Object);

            // --- ACT ---
            await job.Execute(_mockJobContext.Object);

            // --- ASSERT ---
            // Không được gọi Publish lần nào
            _mockPublishEndpoint.Verify(x => x.Publish(It.IsAny<object>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }
}