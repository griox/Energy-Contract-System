using Api.Consumers;
using Api.Service;
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using Shared.Events;
using Xunit;
using System;
using Shared.Tests;

namespace EmailService.Tests.Consumers
{
    public class ContractCreatedConsumerTests : TestBase
    {
        private readonly Mock<IEmailSender> _mockEmailSender;
        private readonly Mock<ILogger<ContractCreatedConsumer>> _mockLogger;
        private readonly ContractCreatedConsumer _consumer;

        public ContractCreatedConsumerTests()
        {
            _mockEmailSender = new Mock<IEmailSender>();
            _mockLogger = new Mock<ILogger<ContractCreatedConsumer>>();
            _consumer = new ContractCreatedConsumer(_mockLogger.Object, _mockEmailSender.Object);
        }

        [Fact]
        public async Task Consume_ShouldGenerateCorrectLinkAndDateFormat()
        {
            // --- ARRANGE ---
            var mockContext = new Mock<ConsumeContext<ContractCreatedEvent>>();
            
            // Giả lập ngày 20/12/2024 lúc 10:30
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
            await _consumer.Consume(mockContext.Object);

            // --- ASSERT ---
            _mockEmailSender.Verify(x => x.SendEmailAsync(
                "Khach Hang B",
                "khach@gmail.com",
                It.Is<string>(s => s.Contains("HD-999")), // Subject phải có mã HĐ
                It.Is<string>(body => 
                    // 1. Kiểm tra Link Frontend có đúng mã hợp đồng không
                    body.Contains("energy-contract-system-six.vercel.app/contracts/HD-999") &&
                    // 2. Kiểm tra ngày tháng có format tiếng Việt không "dd tháng MM năm..."
                    body.Contains("20 tháng 12 năm 2024") 
                )
            ), Times.Once);
        }
    }
}