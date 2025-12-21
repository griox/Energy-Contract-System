using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using Shared.Tests;
using Xunit;

namespace CustomerService.Tests.Repositories
{
    public class OrderRepositoryTests : TestBase
    {
        // Helper tạo DB ảo
        private EnergyDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<EnergyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new EnergyDbContext(options);
        }

        #region Basic CRUD

        [Fact]
        public async Task Add_And_GetById_ShouldWork()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new OrderRepository(context);
            var order = new Order { OrderNumber = "ORD-001", TopupFee = 100 };

            // --- ACT ---
            await repo.AddAsync(order);
            var result = await repo.GetByIdAsync(order.Id);

            // --- ASSERT ---
            result.Should().NotBeNull();
            result!.OrderNumber.Should().Be("ORD-001");
        }

        #endregion

        #region GetPagedAsync Tests (Test Bộ lọc phức tạp)

        [Fact]
        public async Task GetPagedAsync_ShouldFilterByContractId()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new OrderRepository(context);

            // Seed 3 đơn hàng: 2 cái thuộc Contract 1, 1 cái thuộc Contract 2
            await repo.AddAsync(new Order { OrderNumber = "O1", ContractId = 1 });
            await repo.AddAsync(new Order { OrderNumber = "O2", ContractId = 1 });
            await repo.AddAsync(new Order { OrderNumber = "O3", ContractId = 2 });

            // --- ACT ---
            // Lọc đơn của Contract 1
            var result = await repo.GetPagedAsync(null, contractId: 1, null, null, 1, 10, null, false);

            // --- ASSERT ---
            result.TotalCount.Should().Be(2);
            result.Items.Should().Contain(x => x.OrderNumber == "O1");
            result.Items.Should().Contain(x => x.OrderNumber == "O2");
            result.Items.Should().NotContain(x => x.OrderNumber == "O3");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldFilterBySearch_OrderNumber()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new OrderRepository(context);

            await repo.AddAsync(new Order { OrderNumber = "ORD-ABC-01" });
            await repo.AddAsync(new Order { OrderNumber = "ORD-XYZ-02" });

            // --- ACT ---
            var result = await repo.GetPagedAsync("ABC", null, null, null, 1, 10, null, false);

            // --- ASSERT ---
            result.TotalCount.Should().Be(1);
            result.Items.First().OrderNumber.Should().Be("ORD-ABC-01");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldFilterByStatus_And_OrderType()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new OrderRepository(context);

            // Status: 1=New, 2=Paid | Type: 1=Initial, 2=Topup
            await repo.AddAsync(new Order { OrderNumber = "A", Status = 1, OrderType = 1 });
            await repo.AddAsync(new Order { OrderNumber = "B", Status = 2, OrderType = 1 }); // Khác Status
            await repo.AddAsync(new Order { OrderNumber = "C", Status = 1, OrderType = 2 }); // Khác Type

            // --- ACT ---
            // Lọc Status = 1 và Type = 1
            var result = await repo.GetPagedAsync(null, null, status: 1, orderType: 1, 1, 10, null, false);

            // --- ASSERT ---
            result.TotalCount.Should().Be(1);
            result.Items.First().OrderNumber.Should().Be("A");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldSort_ByTopupFee()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new OrderRepository(context);

            await repo.AddAsync(new Order { OrderNumber = "Cheap", TopupFee = 100 });
            await repo.AddAsync(new Order { OrderNumber = "Expensive", TopupFee = 900 });
            await repo.AddAsync(new Order { OrderNumber = "Medium", TopupFee = 500 });

            // --- ACT ---
            // Sort giảm dần (Cao -> Thấp)
            var result = await repo.GetPagedAsync(null, null, null, null, 1, 10, "topupfee", true);

            // --- ASSERT ---
            var list = result.Items;
            list[0].TopupFee.Should().Be(900);
            list[1].TopupFee.Should().Be(500);
            list[2].TopupFee.Should().Be(100);
        }

        #endregion

        #region GetOrdersByUserEmailAsync Tests (Test Relationship)

        [Fact]
        public async Task GetOrdersByUserEmailAsync_ShouldReturnOrders_LinkedToUsersEmail()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new OrderRepository(context);

            // 1. Tạo Contracts (Vì Order phụ thuộc vào Contract để lấy Email)
            var contractA = new Contract { Id = 1, Email = "userA@test.com", ContractNumber = "C1" };
            var contractB = new Contract { Id = 2, Email = "userB@test.com", ContractNumber = "C2" };
            context.Contracts.AddRange(contractA, contractB);
            
            // 2. Tạo Orders gắn với Contract
            var order1 = new Order { Id = 10, ContractId = 1, OrderNumber = "O-A1", StartDate = DateTime.Now };
            var order2 = new Order { Id = 11, ContractId = 1, OrderNumber = "O-A2", StartDate = DateTime.Now.AddDays(1) }; // Mới hơn
            var order3 = new Order { Id = 12, ContractId = 2, OrderNumber = "O-B1", StartDate = DateTime.Now }; // Của user B

            context.Orders.AddRange(order1, order2, order3);
            await context.SaveChangesAsync();

            // --- ACT ---
            // Tìm Order của User A
            var result = await repo.GetOrdersByUserEmailAsync("userA@test.com");

            // --- ASSERT ---
            result.Should().HaveCount(2);
            result.Should().Contain(x => x.OrderNumber == "O-A1");
            result.Should().Contain(x => x.OrderNumber == "O-A2");
            result.Should().NotContain(x => x.OrderNumber == "O-B1"); // Không được chứa đơn của B
            
            // Kiểm tra Sort Descending by StartDate (Đơn mới nhất lên đầu)
            result[0].OrderNumber.Should().Be("O-A2");
            result[1].OrderNumber.Should().Be("O-A1");
        }

        [Fact]
        public async Task GetOrdersByUserEmailAsync_ShouldBeCaseInsensitive()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new OrderRepository(context);

            var contract = new Contract { Id = 1, Email = "TestUser@Example.Com" }; // Viết hoa lung tung
            context.Contracts.Add(contract);
            context.Orders.Add(new Order { ContractId = 1, OrderNumber = "O-Match" });
            await context.SaveChangesAsync();

            // --- ACT ---
            // Search bằng chữ thường
            var result = await repo.GetOrdersByUserEmailAsync("testuser@example.com");

            // --- ASSERT ---
            result.Should().HaveCount(1);
            result[0].OrderNumber.Should().Be("O-Match");
        }

        #endregion
    }
}