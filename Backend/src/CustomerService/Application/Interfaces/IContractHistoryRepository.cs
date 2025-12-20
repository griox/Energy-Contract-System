using Domain.Entities;

namespace Application.Interfaces
{
    public interface IContractHistoryRepository
    {
        Task<ContractHistory> AddAsync(ContractHistory history);
        Task<List<ContractHistory>> GetByContractIdAsync(int contractId);
        Task<(List<ContractHistory> Items, int TotalCount)> GetPagedByContractIdAsync(
            int contractId,
            string? search,
            int pageNumber,
            int pageSize);
        // 1. Lấy tất cả lịch sử (của toàn bộ hệ thống) có phân trang
        Task<(List<ContractHistory> Items, int TotalCount)> GetAllPagedAsync(string? search, int pageNumber, int pageSize);

        // 2. Xóa một dòng lịch sử theo ID
        Task<bool> DeleteAsync(int id);
    }
}