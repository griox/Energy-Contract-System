using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Shared.Events;
using Xunit;
using FluentAssertions;
using System.Text.Json;
using Shared.Tests;

namespace CustomerService.Tests.Repositories
{
    public class ContractRepositoryTests : TestBase
    {
        private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
        private readonly Mock<ILogger<ContractRepository>> _mockLogger;

        public ContractRepositoryTests()
        {
            _mockPublishEndpoint = new Mock<IPublishEndpoint>();
            _mockLogger = new Mock<ILogger<ContractRepository>>();
        }

        private EnergyDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<EnergyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new EnergyDbContext(options);
        }

        // Helper: Tạo dữ liệu Contract hợp lệ
        // Thêm tham số startDate để kiểm soát thời gian
        private Contract CreateValidContract(string number, string companyName = "Cty A", DateTime? fixedDate = null)
        {
            var date = fixedDate ?? DateTime.UtcNow;
            return new Contract
            {
                ContractNumber = number,
                Email = "test@mail.com",
                FirstName = "Huy",
                LastName = "Ngo",
                Phone = "0909090909",
                StartDate = date,
                EndDate = date.AddYears(1),
                CompanyName = companyName,
                ResellerId = 1,
                AddressId = 1
            };
        }

        // Helper: Tạo dữ liệu quan hệ (Reseller, Address) để tránh lỗi FK ảo
        private async Task SeedDependencies(EnergyDbContext context)
        {
            if (!await context.Resellers.AnyAsync())
            {
                context.Resellers.Add(new Reseller { Id = 1, Name = "Reseller Default", Type = "Solar" });
                context.Addresses.Add(new Address { Id = 1, ZipCode = "10000", HouseNumber = "1" });
                await context.SaveChangesAsync();
            }
        }

        #region AddContract Tests (Giữ nguyên, chỉ thêm SeedDependencies)

        [Fact]
        public async Task AddContract_ShouldSaveToDb_And_PublishEvent()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            await SeedDependencies(context); // <--- Fix: Tạo FK

            var repo = new ContractRepository(context, _mockPublishEndpoint.Object, _mockLogger.Object);
            var newContract = CreateValidContract("HD-NEW-001");

            // --- ACT ---
            await repo.AddContract(newContract);

            // --- ASSERT ---
            var saved = await context.Contracts.FirstOrDefaultAsync();
            saved.Should().NotBeNull();
            saved!.ContractNumber.Should().Be("HD-NEW-001");

            _mockPublishEndpoint.Verify(x => x.Publish(
                It.Is<ContractCreatedEvent>(e => e.ContractNumber == "HD-NEW-001"), 
                It.IsAny<CancellationToken>()), 
                Times.Once);
        }

        [Fact]
        public async Task AddContract_ShouldContinue_EvenIfRabbitMqFails()
        {
            using var context = GetInMemoryDbContext();
            await SeedDependencies(context);

            _mockPublishEndpoint.Setup(x => x.Publish(It.IsAny<object>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("RabbitMQ Error"));

            var repo = new ContractRepository(context, _mockPublishEndpoint.Object, _mockLogger.Object);
            var contract = CreateValidContract("HD-FAIL-MQ");

            await repo.AddContract(contract);

            var saved = await context.Contracts.FirstOrDefaultAsync(c => c.ContractNumber == "HD-FAIL-MQ");
            saved.Should().NotBeNull();
        }

        #endregion

        #region UpdateContract Tests (SỬA LỖI TIME)

        [Fact]
        public async Task UpdateContract_ShouldCreateHistory_WhenDataChanged()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            await SeedDependencies(context);
            
            var original = CreateValidContract("HD-UPDATE", "Cong Ty Cu"); 
            original.Id = 1;
            context.Contracts.Add(original);
            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();

            var repo = new ContractRepository(context, _mockPublishEndpoint.Object, _mockLogger.Object);

            var updateInfo = CreateValidContract("HD-UPDATE", "Cong Ty Moi");
            updateInfo.Id = 1;

            // --- ACT ---
            await repo.UpdateContract(updateInfo);

            // --- ASSERT ---
            var current = await context.Contracts.FindAsync(1);
            current!.CompanyName.Should().Be("Cong Ty Moi");

            var history = await context.Set<ContractHistory>().FirstOrDefaultAsync();
            history.Should().NotBeNull();
            history!.OldValue.Should().Contain("Cong Ty Cu");
            history.NewValue.Should().Contain("Cong Ty Moi");
        }

        [Fact]
        public async Task UpdateContract_ShouldDoNothing_IfDataIsUnchanged()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            await SeedDependencies(context);
            
            // 👇 [FIX LỖI] Tạo một thời gian cố định
            var fixedTime = DateTime.UtcNow;

            // Tạo data gốc với thời gian cố định
            var original = CreateValidContract("HD-SAME", "Cong Ty A", fixedTime);
            original.Id = 2;
            
            context.Contracts.Add(original);
            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();

            var repo = new ContractRepository(context, _mockPublishEndpoint.Object, _mockLogger.Object);
            
            // Tạo data update y hệt (cùng thời gian cố định)
            var sameData = CreateValidContract("HD-SAME", "Cong Ty A", fixedTime);
            sameData.Id = 2;

            // --- ACT ---
            await repo.UpdateContract(sameData);

            // --- ASSERT ---
            var historyCount = await context.Set<ContractHistory>().CountAsync();
            historyCount.Should().Be(0); // Bây giờ sẽ pass vì StartDate/EndDate giống hệt nhau
        }

        #endregion

        #region GetPaged & Other Tests (SỬA LỖI SEARCH)

        [Fact]
        public async Task GetPaged_ShouldFilterBySearch_MultipleFields()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            await SeedDependencies(context); // <--- Fix: Đảm bảo có Reseller/Address

            var repo = new ContractRepository(context, _mockPublishEndpoint.Object, _mockLogger.Object);

            async Task Add(string num, string first, string email) {
                var c = CreateValidContract(num);
                c.FirstName = first;
                c.Email = email;
                await repo.AddContract(c);
            }

            await Add("HD-001", "Alice", "a@a.com");
            await Add("HD-002", "Bob", "b@b.com");
            await Add("HD-003", "Charlie", "alice_fan@c.com");

            // --- ACT ---
            // Tìm "Alice"
            var result = await repo.GetPagedContractsAsync("Alice", null, null, null, 1, 10, null, false);

            // --- ASSERT ---
            result.TotalCount.Should().Be(2);
            result.Items.Should().Contain(c => c.ContractNumber == "HD-001");
            result.Items.Should().Contain(c => c.ContractNumber == "HD-003");
        }

        [Fact]
        public async Task DeleteContract_ShouldRemoveFromDb()
        {
            using var context = GetInMemoryDbContext();
            await SeedDependencies(context);

            var repo = new ContractRepository(context, _mockPublishEndpoint.Object, _mockLogger.Object);
            var contract = CreateValidContract("DELETE-ME");
            await repo.AddContract(contract);

            await repo.DeleteContract(contract);

            var check = await context.Contracts.FindAsync(contract.Id);
            check.Should().BeNull();
        }

        [Fact]
        public async Task GetContractByNumberAsync_ShouldReturnCorrectContract()
        {
            using var context = GetInMemoryDbContext();
            await SeedDependencies(context);

            var repo = new ContractRepository(context, _mockPublishEndpoint.Object, _mockLogger.Object);
            await repo.AddContract(CreateValidContract("FIND-ME"));

            var result = await repo.GetContractByNumberAsync("FIND-ME");
            result.Should().NotBeNull();
            result!.ContractNumber.Should().Be("FIND-ME");
        }

        #endregion
    }
}