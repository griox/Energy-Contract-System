using Domain.Entities;

namespace Application.Interfaces;

public interface IContractRepository
{
    Task<Contract> AddContract(Contract contract);
    Task<Contract?> GetContractById(int id);
    Task<Contract?> GetContractByNumberAsync(string contractNumber);
    Task UpdateContract(Contract contract);
    Task DeleteContract(Contract contract); 
    Task <List<Contract>> GetAllContracts(int limit = 0);
    Task<(List<Contract> Items, int TotalCount)> GetPagedContractsAsync(
        string? search,
        int? resellerId,
        DateTime? startDateFrom,
        DateTime? startDateTo,
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool sortDesc);
}