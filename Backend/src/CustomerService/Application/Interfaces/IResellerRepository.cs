using Domain.Entities;

namespace Application.Interfaces;

public interface IResellerRepository
{
    Task<Reseller> AddAsync(Reseller reseller);
    Task<List<Reseller>> GetAllAsync(int limit = 0);
    Task<Reseller?> GetByIdAsync(int id);
    Task UpdateAsync(Reseller reseller);
    Task DeleteAsync(Reseller reseller);
    Task<(List<Reseller> Items, int TotalCount)> GetPagedAsync(
        string? search,
        string? type,
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool sortDesc);
}