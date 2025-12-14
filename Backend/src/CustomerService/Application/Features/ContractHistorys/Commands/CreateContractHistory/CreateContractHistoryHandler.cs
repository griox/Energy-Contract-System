using Application.Interfaces;
using Domain.Entities;

namespace Application.Features.ContractHistories.Commands.CreateContractHistory
{
    public class CreateContractHistoryHandler
    {
        private readonly IContractHistoryRepository _repository;

        public CreateContractHistoryHandler(IContractHistoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<int> Handle(CreateContractHistory request)
        {
            var history = new ContractHistory
            {
                OldValue = request.OldValue,
                NewValue = request.NewValue,
                ContractId = request.ContractId,
                Timestamp = DateTime.UtcNow
            };

            await _repository.AddAsync(history);
            return history.Id;
        }
    }
}