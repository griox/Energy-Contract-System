using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly EnergyDbContext _context;

        public OrderRepository(EnergyDbContext context)
        {
            _context = context;
        }

        public async Task<Order> AddAsync(Order order)
        {
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
            return order;
        }

        public async Task<List<Order>> GetAllAsync(int limit = 0)
        {
            var query = _context.Orders.AsQueryable();
            if (limit > 0) query = query.Take(limit);
            return await query.ToListAsync();
        }

        public async Task<Order?> GetByIdAsync(int id)
        {
            return await _context.Orders.FindAsync(id);
        }

        public async Task UpdateAsync(Order order)
        {
            _context.Orders.Update(order);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Order order)
        {
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
        }
        public async Task<(List<Order> Items, int TotalCount)> GetPagedAsync(
            string? search,
            int? contractId, // <--- 1. THÊM THAM SỐ NÀY
            int? status,
            int? orderType,
            int pageNumber,
            int pageSize,
            string? sortBy,
            bool sortDesc)
        {
            var query = _context.Orders.AsNoTracking().AsQueryable();

            // Lọc theo từ khóa
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(o => o.OrderNumber.ToLower().Contains(search));
            }

            // 2. THÊM LOGIC LỌC THEO CONTRACT ID
            if (contractId.HasValue)
            {
                query = query.Where(o => o.ContractId == contractId.Value);
            }

            if (status.HasValue)
                query = query.Where(o => o.Status == status.Value);

            if (orderType.HasValue)
                query = query.Where(o => o.OrderType == orderType.Value);

            // Sắp xếp
            query = (sortBy?.ToLower(), sortDesc) switch
            {
                ("ordernumber", false) => query.OrderBy(o => o.OrderNumber),
                ("ordernumber", true)  => query.OrderByDescending(o => o.OrderNumber),
                ("startdate", false)   => query.OrderBy(o => o.StartDate),
                ("startdate", true)    => query.OrderByDescending(o => o.StartDate),
                ("topupfee", false)    => query.OrderBy(o => o.TopupFee), // Thêm sort fee nếu cần
                ("topupfee", true)     => query.OrderByDescending(o => o.TopupFee),
                _                      => sortDesc ? query.OrderByDescending(o => o.Id) : query.OrderBy(o => o.Id),
            };

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<List<Order>> GetOrdersByUserEmailAsync(string email)
        {
            return await _context.Orders
                .Include(o=>o.Contract)
                .Where(o=>o.Contract.Email.ToLower() == email.ToLower())
                .OrderByDescending(o=>o.StartDate)
                .ToListAsync();
        }
    }
}