using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AddressRepository : IAddressRepository
{
    private readonly EnergyDbContext _context;
    public AddressRepository(EnergyDbContext context)
    {
        _context = context;
    }
    public async Task<Address> AddAsync(Address address)
    {
        await _context.Addresses.AddAsync(address);
        await _context.SaveChangesAsync();
        return address;
    }

    public async Task<List<Address>> GetAllAsync(int limit = 0)
    {
        var query = _context.Addresses
            .AsNoTracking()
            .OrderByDescending(c => c.Id)
            .AsQueryable();
        if (limit > 0)
        {
            query = query.Take(limit);
        }
        return await query.ToListAsync();
    }

    public async Task<Address?> GetByIdAsync(int id)
    {
        return await _context.Addresses.FindAsync(id);
    }
    public async Task UpdateAsync(Address address)
    {
        _context.Addresses.Update(address);
        await _context.SaveChangesAsync();
    }
    public async Task DeleteAsync(Address address)
    {
        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();
    }
    public async Task<(List<Address> Items, int TotalCount)> GetPagedAsync(
        string? search,
        string? zipCode,
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool sortDesc)
    {
        var query = _context.Addresses.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(a =>
                a.ZipCode.ToLower().Contains(search) ||
                a.HouseNumber.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(zipCode))
        {
            var z = zipCode.Trim().ToLower();
            query = query.Where(a => a.ZipCode.ToLower() == z);
        }

        query = (sortBy?.ToLower(), sortDesc) switch
        {
            ("zipcode", false)     => query.OrderBy(a => a.ZipCode),
            ("zipcode", true)      => query.OrderByDescending(a => a.ZipCode),
            ("housenumber", false) => query.OrderBy(a => a.HouseNumber),
            ("housenumber", true)  => query.OrderByDescending(a => a.HouseNumber),
            _                      => sortDesc ? query.OrderByDescending(a => a.Id) : query.OrderBy(a => a.Id),
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
}