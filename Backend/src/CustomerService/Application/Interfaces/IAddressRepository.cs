using Domain.Entities;

namespace Application.Interfaces;

public interface IAddressRepository
{
    Task<Address> AddAsync(Address address);
    Task<List<Address>> GetAllAsync(int limit = 0);
    Task<Address?> GetByIdAsync(int id);
    Task UpdateAsync(Address address);
    Task DeleteAsync(Address address);
    Task<(List<Address> Items, int TotalCount)> GetPagedAsync(
        string? search,
        string? zipCode,
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool sortDesc);
}