using System.Text.Json;
using System.Text.Json.Serialization;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Infrastructure.Persistence;
using MassTransit;
using Microsoft.Extensions.Logging;
using Shared.Events;



namespace Infrastructure.Repositories;

public class ContractRepository : IContractRepository
{
    private readonly EnergyDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<ContractRepository> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };
    public ContractRepository(EnergyDbContext dbContext, IPublishEndpoint publishEndpoint, ILogger<ContractRepository> logger)
    {
        _dbContext = dbContext; 
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task<Contract> AddContract(Contract contract)
    {
        await  _dbContext.Contracts.AddAsync(contract);
        await _dbContext.SaveChangesAsync();
        try
        {
            _logger.LogWarning("Starting connnect to RabbitMQ to publish ContractCreatedEvent");
            await _publishEndpoint.Publish(new ContractCreatedEvent
            {
                ContractNumber = contract.ContractNumber,
                Email = contract.Email,
                FullName = $"{contract.FirstName} {contract.LastName}",
                CreatedAt = DateTime.UtcNow,
                FinishedAt = contract.EndDate
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex.Message);
        }
      
        return contract;
    }

    public async Task<Contract?> GetContractById(int id)
    {
        return await _dbContext.Contracts
            .Include(c => c.Address)
            .Include(c => c.Reseller)
            .Include(c=> c.Orders)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task UpdateContract(Contract incomingContract)
    {
        var existingContract = await _dbContext.Contracts
            .FirstOrDefaultAsync(c => c.Id == incomingContract.Id);

        if (existingContract == null) return;

        // 1. Snapshot CŨ để lưu lịch sử
        var oldJson = JsonSerializer.Serialize(existingContract, JsonOptions);

        // 2. Set giá trị MỚI (EF tự động map các trường trùng tên)
        var entry = _dbContext.Entry(existingContract);
        entry.CurrentValues.SetValues(incomingContract);

        // 3. Nếu không có gì thay đổi thì return luôn, không update DB, không lưu history
        if (entry.State == EntityState.Unchanged)
        {
            return; 
        }

        // 4. Snapshot MỚI
        var newJson = JsonSerializer.Serialize(existingContract, JsonOptions);

        // 5. Lưu History (Chỉ lưu khi Sửa, còn Xóa thì không lưu như bạn yêu cầu)
        var history = new ContractHistory
        {
            ContractId = existingContract.Id,
            OldValue = oldJson,
            NewValue = newJson,
            Timestamp = DateTime.UtcNow
        };

        await _dbContext.Set<ContractHistory>().AddAsync(history);
        
        // 6. Lưu thay đổi
        await _dbContext.SaveChangesAsync();
    }


    public async Task DeleteContract(Contract contract)
    {
        _dbContext.Contracts.Remove(contract);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<List<Contract>> GetAllContracts(int limit = 0)
    {
        var query = _dbContext.Contracts
            .Include(c => c.Address)
            .Include(c => c.Reseller)
            .Include(c=> c.Orders)
            .AsNoTracking()
            .OrderByDescending(c => c.Id)
            .AsQueryable();
        if (limit > 0)
        {
            query = query.Take(limit);
        }
        return await query.ToListAsync();
    }
    public async Task<(List<Contract> Items, int TotalCount)> GetPagedContractsAsync(
    string? search,
    int? resellerId,
    DateTime? startDateFrom,
    DateTime? startDateTo,
    int pageNumber,
    int pageSize,
    string? sortBy,
    bool sortDesc)
{
    var query = _dbContext.Contracts
        .Include(c => c.Address)
        .Include(c => c.Reseller)
        .AsNoTracking()
        .AsQueryable();

    if (!string.IsNullOrWhiteSpace(search))
    {
        search = search.Trim().ToLower();
        query = query.Where(c =>
            c.ContractNumber.ToLower().Contains(search) ||
            c.FirstName.ToLower().Contains(search) ||
            c.LastName.ToLower().Contains(search) ||
            c.Email.ToLower().Contains(search) ||
            c.Phone.ToLower().Contains(search));
    }

    if (resellerId.HasValue)
        query = query.Where(c => c.ResellerId == resellerId.Value);

    if (startDateFrom.HasValue)
        query = query.Where(c => c.StartDate >= startDateFrom.Value);

    if (startDateTo.HasValue)
        query = query.Where(c => c.StartDate <= startDateTo.Value);

    // SORT
    query = (sortBy?.ToLower(), sortDesc) switch
    {
        ("contractnumber", false) => query.OrderBy(c => c.ContractNumber),
        ("contractnumber", true)  => query.OrderByDescending(c => c.ContractNumber),
        ("startdate", false)      => query.OrderBy(c => c.StartDate),
        ("startdate", true)       => query.OrderByDescending(c => c.StartDate),
        ("customername", false)   => query.OrderBy(c => c.FirstName).ThenBy(c => c.LastName),
        ("customername", true)    => query.OrderByDescending(c => c.FirstName).ThenByDescending(c => c.LastName),
        _                         => sortDesc ? query.OrderByDescending(c => c.Id) : query.OrderBy(c => c.Id),
    };

    var totalCount = await query.CountAsync();

    var items = await query
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return (items, totalCount);
}

    // Thêm hàm này vào cuối class
    public async Task<Contract?> GetContractByNumberAsync(string contractNumber)
    {
        return await _dbContext.Contracts
            .FirstOrDefaultAsync(c => c.ContractNumber == contractNumber);
    }
    public async Task<List<Contract>> GetContractsByEmailAsync(string email) 
    {
        return await _dbContext.Contracts
            .Include(c => c.Address)
            .Include(c => c.Reseller)
            // 2. Dùng Where để lọc tất cả, thay vì FirstOrDefault
            .Where(c => c.Email == email) 
            // 3. Dùng ToListAsync để trả về danh sách
            .ToListAsync(); 
    }
}