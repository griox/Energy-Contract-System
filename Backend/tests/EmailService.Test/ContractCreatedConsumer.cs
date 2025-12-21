using Api.Consumers; // Nơi chứa class thật
using Api.Service; // Nơi chứa IEmailSender
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using Shared.Events;
using Xunit;
using System;
using Shared.Tests;

namespace EmailService.Tests.Consumers
{
    // 👇 SỬA 1: Đổi tên class test thành ContractCreatedConsumerTests
    public class ContractCreatedConsumerTest : TestBase
    {
        private readonly Mock<IEmailSender> _mockEmailSender;
        private readonly Mock<ILogger<ContractCreatedConsumer>> _mockLogger;
        
        // Đây là class thật (Consumer)
        private readonly ContractCreatedConsumer _consumer;

        // 👇 SỬA 2: Đổi tên Constructor cho khớp với tên class
        public ContractCreatedConsumerTest()
        {
            _mockEmailSender = new Mock<IEmailSender>();
            _mockLogger = new Mock<ILogger<ContractCreatedConsumer>>();
            
            // Bây giờ trình biên dịch sẽ hiểu đây là class thật (Api.Consumers.ContractCreatedConsumer)
            // Vì nó khác tên với class test hiện tại
            _consumer = new ContractCreatedConsumer(_mockLogger.Object, _mockEmailSender.Object);
        }

        [Fact]
        public async Task Consume_ShouldGenerateCorrectLinkAndDateFormat()
        {
            // --- ARRANGE ---
            var mockContext = new Mock<ConsumeContext<ContractCreatedEvent>>();
            
            var createdDate = new DateTime(2024, 12, 20, 10, 30, 0); 
            
            var message = new ContractCreatedEvent
            {
                ContractNumber = "HD-999",
                FullName = "Khach Hang B",
                Email = "khach@gmail.com",
                CreatedAt = createdDate
            };
            mockContext.Setup(x => x.Message).Returns(message);

            // --- ACT ---
            // Lỗi "Cannot resolve symbol 'Consume'" sẽ biến mất vì _consumer giờ là class thật
            await _consumer.Consume(mockContext.Object);

            // --- ASSERT ---
            _mockEmailSender.Verify(x => x.SendEmailAsync(
                "Khach Hang B",
                "khach@gmail.com",
                It.Is<string>(s => s.Contains("HD-999")),
                It.Is<string>(body => 
                    body.Contains("energy-contract-system-six.vercel.app/contracts/HD-999") &&
                    body.Contains("20 tháng 12 năm 2024") 
                )
            ), Times.Once);
        }
    }
}