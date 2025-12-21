using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using Shared.Tests;
using Xunit;

namespace CustomerService.Tests.Repositories
{
    public class ContractHistoryRepositoryTests : TestBase
    {
        // Helper: Tạo DB ảo
        private EnergyDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<EnergyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new EnergyDbContext(options);
        }

        #region Basic CRUD

        [Fact]
        public async Task AddAsync_ShouldSaveToDb()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ContractHistoryRepository(context);
            var history = new ContractHistory
            {
                ContractId = 1,
                OldValue = "{}",
                NewValue = "{\"Price\": 100}",
                Timestamp = DateTime.UtcNow
            };

            // --- ACT ---
            await repo.AddAsync(history);

            // --- ASSERT ---
            var saved = await context.ContractHistories.FirstOrDefaultAsync();
            saved.Should().NotBeNull();
            saved!.ContractId.Should().Be(1);
        }

        [Fact]
        public async Task DeleteAsync_ShouldReturnTrue_WhenFound()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ContractHistoryRepository(context);
            var history = new ContractHistory { ContractId = 1, OldValue = "A", NewValue = "B" };
            await repo.AddAsync(history);

            // --- ACT ---
            var result = await repo.DeleteAsync(history.Id);

            // --- ASSERT ---
            result.Should().BeTrue();
            var count = await context.ContractHistories.CountAsync();
            count.Should().Be(0);
        }

        [Fact]
        public async Task DeleteAsync_ShouldReturnFalse_WhenNotFound()
        {
            using var context = GetInMemoryDbContext();
            var repo = new ContractHistoryRepository(context);
            
            var result = await repo.DeleteAsync(999); // ID không tồn tại
            result.Should().BeFalse();
        }

        #endregion

        #region GetByContractIdAsync (Sort Logic)

        [Fact]
        public async Task GetByContractIdAsync_ShouldReturnOnlySpecificContract_And_SortDesc()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ContractHistoryRepository(context);

            // Seed Data
            var now = DateTime.UtcNow;
            
            // History của Contract 1
            await repo.AddAsync(new ContractHistory { ContractId = 1, OldValue = "Old", Timestamp = now.AddDays(-2) }); // Cũ nhất
            await repo.AddAsync(new ContractHistory { ContractId = 1, OldValue = "New", Timestamp = now });             // Mới nhất

            // History của Contract 2 (Nhiễu)
            await repo.AddAsync(new ContractHistory { ContractId = 2, OldValue = "Other", Timestamp = now });

            // --- ACT ---
            var result = await repo.GetByContractIdAsync(1);

            // --- ASSERT ---
            result.Should().HaveCount(2); // Chỉ lấy của Contract 1
            result.Should().NotContain(h => h.ContractId == 2);
            
            // Kiểm tra Sort: Mới nhất lên đầu
            result[0].Timestamp.Should().Be(now);
            result[1].Timestamp.Should().Be(now.AddDays(-2));
        }

        #endregion

        #region GetPagedByContractIdAsync (Search & Pagination)

        [Fact]
        public async Task GetPagedByContractId_ShouldSearchInJsonValues()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ContractHistoryRepository(context);
            int contractId = 10;

            // Giả lập JSON thay đổi giá tiền
            await repo.AddAsync(new ContractHistory { ContractId = contractId, OldValue = "{'Price': 100}", NewValue = "{'Price': 200}" });
            await repo.AddAsync(new ContractHistory { ContractId = contractId, OldValue = "{'Name': 'A'}", NewValue = "{'Name': 'B'}" });

            // --- ACT ---
            // Tìm chữ "Price"
            var result = await repo.GetPagedByContractIdAsync(contractId, "Price", 1, 10);

            // --- ASSERT ---
            result.TotalCount.Should().Be(1);
            result.Items.First().OldValue.Should().Contain("Price");
        }

        [Fact]
        public async Task GetPagedByContractId_ShouldPaginateCorrectly()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ContractHistoryRepository(context);
            int contractId = 5;

            // Thêm 5 records
            for (int i = 1; i <= 5; i++)
            {
                await repo.AddAsync(new ContractHistory 
                { 
                    ContractId = contractId, 
                    OldValue = $"v{i}", 
                    NewValue = $"v{i+1}",
                    Timestamp = DateTime.UtcNow.AddMinutes(i) 
                });
            }

            // --- ACT ---
            // Lấy trang 2, pageSize = 2 (Vì sort DESC timestamp nên trang 1 là 5,4 -> trang 2 là 3,2)
            var result = await repo.GetPagedByContractIdAsync(contractId, null, pageNumber: 2, pageSize: 2);

            // --- ASSERT ---
            result.TotalCount.Should().Be(5);
            result.Items.Should().HaveCount(2);
        }

        #endregion

        #region GetAllPagedAsync (Admin View)

        [Fact]
        public async Task GetAllPagedAsync_ShouldReturnMixOfContracts()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ContractHistoryRepository(context);

            await repo.AddAsync(new ContractHistory { ContractId = 1, OldValue = "C1-Change" });
            await repo.AddAsync(new ContractHistory { ContractId = 2, OldValue = "C2-Change" });

            // --- ACT ---
            var result = await repo.GetAllPagedAsync(null, 1, 10);

            // --- ASSERT ---
            result.TotalCount.Should().Be(2);
            result.Items.Should().Contain(h => h.ContractId == 1);
            result.Items.Should().Contain(h => h.ContractId == 2);
        }

        #endregion
    }
}