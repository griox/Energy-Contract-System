using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Persistence;

namespace Infrastructure.Repositories
{
    public class ContractHistoryRepository : IContractHistoryRepository
    {
        private readonly EnergyDbContext _context;

        public ContractHistoryRepository(EnergyDbContext context)
        {
            _context = context;
        }

        public async Task<ContractHistory> AddAsync(ContractHistory history)
        {
            await _context.ContractHistories.AddAsync(history);
            await _context.SaveChangesAsync();
            return history;
        }

        public async Task<List<ContractHistory>> GetByContractIdAsync(int contractId)
        {
            return await _context.ContractHistories
                .Where(h => h.ContractId == contractId)
                .OrderByDescending(h => h.Timestamp)
                .ToListAsync();
        }
        public async Task<(List<ContractHistory> Items, int TotalCount)> GetPagedByContractIdAsync(
            int contractId,
            string? search,
            int pageNumber,
            int pageSize)
        {
            var query = _context.ContractHistories
                .Where(h => h.ContractId == contractId)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(h =>
                    h.OldValue.ToLower().Contains(search) ||
                    h.NewValue.ToLower().Contains(search));
            }

            query = query.OrderByDescending(h => h.Timestamp);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}