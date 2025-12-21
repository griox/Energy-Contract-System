using Domain.Entities;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using Shared.Tests;
using Xunit;

namespace CustomerService.Tests.Repositories
{
    public class AddressRepositoryTests : TestBase
    {
        // Helper tạo DB ảo trên RAM
        private EnergyDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<EnergyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new EnergyDbContext(options);
        }

        #region Basic CRUD Tests (Test nhanh)

        [Fact]
        public async Task Add_And_GetById_ShouldWork()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new AddressRepository(context);
            var address = new Address { ZipCode = "10000", HouseNumber = "123", Extension = "A"};

            // --- ACT ---
            await repo.AddAsync(address);
            var result = await repo.GetByIdAsync(address.Id);

            // --- ASSERT ---
            result.Should().NotBeNull();
            result!.ZipCode.Should().Be("10000");
        }

        [Fact]
        public async Task Delete_ShouldRemoveFromDb()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new AddressRepository(context);
            var address = new Address { ZipCode = "99999", HouseNumber = "DeleteMe" };
            await repo.AddAsync(address);

            // --- ACT ---
            await repo.DeleteAsync(address);

            // --- ASSERT ---
            var check = await context.Addresses.FindAsync(address.Id);
            check.Should().BeNull();
        }

        #endregion

        #region GetPagedAsync Tests (PHẦN QUAN TRỌNG NHẤT)

        [Fact]
        public async Task GetPagedAsync_ShouldFilterBySearch_Correctly()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new AddressRepository(context);

            // Tạo dữ liệu mẫu: 3 cái
            await repo.AddAsync(new Address { ZipCode = "12345", HouseNumber = "A1" }); // Khớp Zip
            await repo.AddAsync(new Address { ZipCode = "67890", HouseNumber = "B2" }); // Không khớp
            await repo.AddAsync(new Address { ZipCode = "11111", HouseNumber = "A1-Bis" }); // Khớp HouseNumber "A1"

            // --- ACT ---
            // Tìm chữ "A1" -> Kỳ vọng ra thằng 1 (House A1) và thằng 3 (House A1-Bis)
            var result = await repo.GetPagedAsync(
                search: "A1", 
                zipCode: null, 
                pageNumber: 1, 
                pageSize: 10, 
                sortBy: null, 
                sortDesc: false
            );

            // --- ASSERT ---
            result.TotalCount.Should().Be(2); // Phải tìm thấy 2 thằng
            result.Items.Should().Contain(x => x.ZipCode == "12345");
            result.Items.Should().Contain(x => x.ZipCode == "11111");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldSort_ByZipCode_Descending()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new AddressRepository(context);

            await repo.AddAsync(new Address { ZipCode = "10000" }); // Nhỏ nhất
            await repo.AddAsync(new Address { ZipCode = "30000" }); // Lớn nhất
            await repo.AddAsync(new Address { ZipCode = "20000" }); // Ở giữa

            // --- ACT ---
            // Sort Descending (Giảm dần)
            var result = await repo.GetPagedAsync(null, null, 1, 10, "zipcode", true);

            // --- ASSERT ---
            var list = result.Items;
            list[0].ZipCode.Should().Be("30000"); // Lớn nhất lên đầu
            list[1].ZipCode.Should().Be("20000");
            list[2].ZipCode.Should().Be("10000");
        }

        [Fact]
        public async Task GetPagedAsync_ShouldPaginate_Correctly()
        {
            // --- ARRANGE ---
            using var context = GetInMemoryDbContext();
            var repo = new AddressRepository(context);

            // Thêm 5 địa chỉ
            for (int i = 1; i <= 5; i++)
            {
                await repo.AddAsync(new Address { ZipCode = $"{i}", HouseNumber = $"House {i}" });
            }

            // --- ACT ---
            // Lấy trang 2, mỗi trang 2 phần tử -> Phải ra phần tử thứ 3 và 4
            var result = await repo.GetPagedAsync(null, null, pageNumber: 2, pageSize: 2, null, false);

            // --- ASSERT ---
            result.TotalCount.Should().Be(5); // Tổng vẫn là 5
            result.Items.Count.Should().Be(2); // Trang này chỉ có 2 item
            result.Items[0].HouseNumber.Should().Be("House 3");
            result.Items[1].HouseNumber.Should().Be("House 4");
        }

        #endregion
    }
}