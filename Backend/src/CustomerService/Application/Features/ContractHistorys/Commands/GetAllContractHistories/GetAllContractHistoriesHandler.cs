using Application.Interfaces;
using Application.DTOs;

namespace Application.Features.ContractHistories.Commands.GetAllContractHistories
{
    public class GetAllContractHistoriesHandler
    {
        private readonly IContractHistoryRepository _repository;

        public GetAllContractHistoriesHandler(IContractHistoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<ContractHistoryDto>> Handle(GetAllContractHistories request)
        {
            // Gọi hàm GetAllPagedAsync từ Repository (hàm này bạn đã thêm ở bước trước)
            var (list, totalCount) = await _repository.GetAllPagedAsync(
                request.Search,
                request.PageNumber,
                request.PageSize);

            // Map thủ công giống mẫu bạn gửi
            var items = list.Select(h => new ContractHistoryDto
            {
                Id = h.Id,
                OldValue = h.OldValue,
                NewValue = h.NewValue,
                Timestamp = h.Timestamp,
                ContractId = h.ContractId
            }).ToList();

            // Return đúng kiểu mẫu
            return new PagedResult<ContractHistoryDto>
            {
                Items = items,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };
        }
    }
}