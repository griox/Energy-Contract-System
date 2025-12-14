using Application.Interfaces;
using Application.DTOs;

namespace Application.Features.ContractHistories.Commands.GetHistoryByContractId
{
    public class GetHistoryByContractIdHandler
    {
        private readonly IContractHistoryRepository _repository;

        public GetHistoryByContractIdHandler(IContractHistoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<ContractHistoryDto>> Handle(GetHistoryByContractId request)
        {
            var (list, totalCount) = await _repository.GetPagedByContractIdAsync(
                request.ContractId,
                request.Search,
                request.PageNumber,
                request.PageSize);

            var items = list.Select(h => new ContractHistoryDto
            {
                Id = h.Id,
                OldValue = h.OldValue,
                NewValue = h.NewValue,
                Timestamp = h.Timestamp,
                ContractId = h.ContractId
            }).ToList();

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