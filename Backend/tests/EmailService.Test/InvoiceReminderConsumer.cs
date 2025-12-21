using Api.Consumers;
using Api.Service; // Import Interface IEmailSender
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using Shared.Events;
using Xunit;
using System;
using Shared.Tests;

namespace EmailService.Tests.Consumers
{
    public class InvoiceReminderConsumerTests : TestBase
    {
        private readonly Mock<IEmailSender> _mockEmailSender;
        private readonly Mock<ILogger<InvoiceReminderConsumer>> _mockLogger;
        private readonly InvoiceReminderConsumer _consumer;

        public InvoiceReminderConsumerTests()
        {
            // 1. Setup Mock Dependencies
            _mockEmailSender = new Mock<IEmailSender>();
            _mockLogger = new Mock<ILogger<InvoiceReminderConsumer>>();

            // 2. Khởi tạo Consumer cần test
            _consumer = new InvoiceReminderConsumer(_mockLogger.Object, _mockEmailSender.Object);
        }

        [Fact]
        public async Task Consume_ShouldFormatCurrencyAndDate_Correctly()
        {
            // --- ARRANGE ---
            var mockContext = new Mock<ConsumeContext<InvoiceReminderEvent>>();
            
            // Giả lập dữ liệu đầu vào
            var message = new InvoiceReminderEvent
            {
                ContractNumber = "HD-TEST-01",
                FullName = "Nguyen Van A",
                Email = "test@gmail.com",
                Amount = 1500000, // 1 triệu rưỡi
                DueDate = new DateTime(2025, 12, 31), // 31/12/2025
                Description = "Thanh toán tiền điện tháng 12"
            };

            mockContext.Setup(x => x.Message).Returns(message);

            // --- ACT ---
            await _consumer.Consume(mockContext.Object);

            // --- ASSERT ---
            // Kiểm tra xem EmailSender có được gọi với đúng nội dung đã format không
            _mockEmailSender.Verify(x => x.SendEmailAsync(
                "Nguyen Van A",      // Tên
                "test@gmail.com",    // Email
                It.Is<string>(s => s.Contains("Thanh toán tiền điện tháng 12")), // Subject chứa Description
                It.Is<string>(body => 
                    // 1. Kiểm tra format tiền (Dấu chấm phân cách ngàn: 1.500.000)
                    (body.Contains("1.500.000") || body.Contains("1,500,000")) && 
                    
                    // 2. Kiểm tra format ngày (dd/MM/yyyy)
                    body.Contains("31/12/2025") &&
                    
                    // 3. Kiểm tra Link thanh toán có chứa ContractNumber
                    body.Contains("checkout?contract=HD-TEST-01")
                )
            ), Times.Once);
        }

        [Fact]
        public async Task Consume_ShouldUseDefaultDescription_WhenDescriptionIsEmpty()
        {
            // --- ARRANGE ---
            var mockContext = new Mock<ConsumeContext<InvoiceReminderEvent>>();
            
            var message = new InvoiceReminderEvent
            {
                ContractNumber = "HD-DEFAULT",
                FullName = "User B",
                Email = "b@gmail.com",
                Amount = 200000,
                DueDate = DateTime.Now,
                Description = null // <--- Trường hợp Description bị Null
            };

            mockContext.Setup(x => x.Message).Returns(message);

            // --- ACT ---
            await _consumer.Consume(mockContext.Object);

            // --- ASSERT ---
            _mockEmailSender.Verify(x => x.SendEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                // Kiểm tra Subject xem có tự động điền default text không
                It.Is<string>(subject => subject.Contains("Thanh toán định kỳ hợp đồng HD-DEFAULT")),
                // Kiểm tra Body cũng phải chứa nội dung default này
                It.Is<string>(body => body.Contains("Thanh toán định kỳ hợp đồng HD-DEFAULT"))
            ), Times.Once);
        }
    }
}