using Domain.Entities;

namespace Application.Interfaces
{
    public interface IOrderRepository
    {
        Task<Order> AddAsync(Order order);
        Task<List<Order>> GetAllAsync(int limit = 0);
        Task<List<Order>> GetOrdersByUserEmailAsync(string email);
        Task<Order?> GetByIdAsync(int id);
        Task UpdateAsync(Order order);
        Task DeleteAsync(Order order);

        // 👇 Đã thêm tham số contractId
        Task<(List<Order> Items, int TotalCount)> GetPagedAsync(
            string? search,
            int? contractId, // <--- THÊM VÀO ĐÂY
            int? status,
            int? orderType,
            int pageNumber,
            int pageSize,
            string? sortBy,
            bool sortDesc);
    }
}