using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using Shared.Tests;
using Xunit;

namespace CustomerService.Tests.Repositories
{
    public class ResellerRepositoryTests : TestBase
    {
        // Helper tạo DB ảo trên RAM
        private EnergyDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<EnergyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Tên ngẫu nhiên cho mỗi test
                .Options;
            return new EnergyDbContext(options);
        }

        #region CRUD Tests

        [Fact]
        public async Task Add_And_GetById_ShouldWork()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ResellerRepository(context);
            var reseller = new Reseller { Name = "Solar City", Type = "Solar" };

            // --- ACT ---
            await repo.AddAsync(reseller);
            var result = await repo.GetByIdAsync(reseller.Id);

            // --- ASSERT ---
            result.Should().NotBeNull();
            result!.Name.Should().Be("Solar City");
        }

        [Fact]
        public async Task Update_ShouldChangeData()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ResellerRepository(context);
            
            var reseller = new Reseller { Name = "Old Name", Type = "Wind" };
            await repo.AddAsync(reseller);

            // --- ACT ---
            reseller.Name = "New Name";
            await repo.UpdateAsync(reseller);

            // --- ASSERT ---
            var updated = await context.Resellers.FindAsync(reseller.Id);
            updated!.Name.Should().Be("New Name");
        }

        [Fact]
        public async Task Delete_ShouldRemoveFromDb()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ResellerRepository(context);
            
            var reseller = new Reseller { Name = "To Delete", Type = "Hydro" };
            await repo.AddAsync(reseller);

            // --- ACT ---
            await repo.DeleteAsync(reseller);

            // --- ASSERT ---
            var check = await context.Resellers.FindAsync(reseller.Id);
            check.Should().BeNull();
        }

        #endregion

        #region GetPagedAsync Tests (Phân trang & Tìm kiếm)

        [Fact]
        public async Task GetPagedAsync_ShouldFilterBySearch_ByNameAndType()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ResellerRepository(context);

            // Seed Data
            await repo.AddAsync(new Reseller { Name = "Alpha Solar", Type = "Solar" }); // Chứa "Solar" ở Name
            await repo.AddAsync(new Reseller { Name = "Beta Energy", Type = "Wind" });
            await repo.AddAsync(new Reseller { Name = "Gamma Corp", Type = "Solar Panel" }); // Chứa "Solar" ở Type

            // --- ACT ---
            // Tìm chữ "Solar" -> Kỳ vọng ra thằng 1 (Name có Solar) và thằng 3 (Type có Solar)
            var result = await repo.GetPagedAsync(
                search: "Solar", 
                type: null, 
                pageNumber: 1, 
                pageSize: 10, 
                sortBy: null, 
                sortDesc: false
            );

            // --- ASSERT ---
            result.TotalCount.Should().Be(2);
            result.Items.Should().Contain(r => r.Name == "Alpha Solar");
            result.Items.Should().Contain(r => r.Name == "Gamma Corp");
            result.Items.Should().NotContain(r => r.Name == "Beta Energy");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldFilterByType_Strictly()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ResellerRepository(context);

            await repo.AddAsync(new Reseller { Name = "A", Type = "Solar" });
            await repo.AddAsync(new Reseller { Name = "B", Type = "Wind" });
            await repo.AddAsync(new Reseller { Name = "C", Type = "Solar" });

            // --- ACT ---
            // Lọc chính xác Type = "Wind"
            var result = await repo.GetPagedAsync(null, "Wind", 1, 10, null, false);

            // --- ASSERT ---
            result.TotalCount.Should().Be(1);
            result.Items.First().Name.Should().Be("B");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldSort_ByName_Ascending()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ResellerRepository(context);

            await repo.AddAsync(new Reseller { Name = "Zeta Corp" });
            await repo.AddAsync(new Reseller { Name = "Alpha Corp" });
            await repo.AddAsync(new Reseller { Name = "Beta Corp" });

            // --- ACT ---
            // Sort theo Name, Ascending (false)
            var result = await repo.GetPagedAsync(null, null, 1, 10, "name", false);

            // --- ASSERT ---
            var list = result.Items;
            list[0].Name.Should().Be("Alpha Corp");
            list[1].Name.Should().Be("Beta Corp");
            list[2].Name.Should().Be("Zeta Corp");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldPaginate_Correctly()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new ResellerRepository(context);

            // Thêm 5 Resellers
            for (int i = 1; i <= 5; i++)
            {
                await repo.AddAsync(new Reseller { Name = $"Reseller {i}", Type = "Type" });
            }

            // --- ACT ---
            // Lấy trang 2, mỗi trang 2 item -> Lấy item thứ 3 và 4
            var result = await repo.GetPagedAsync(null, null, pageNumber: 2, pageSize: 2, null, false);

            // --- ASSERT ---
            result.TotalCount.Should().Be(5); // Tổng vẫn là 5
            result.Items.Count.Should().Be(2); // Trang này trả về 2
            result.Items[0].Name.Should().Be("Reseller 3");
            result.Items[1].Name.Should().Be("Reseller 4");
        }

        #endregion
    }
}   