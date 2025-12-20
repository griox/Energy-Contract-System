using Application.Interfaces;

namespace Application.Features.ContractHistories.Commands.DeleteContractHistory
{
    public class DeleteContractHistoryHandler
    {
        private readonly IContractHistoryRepository _repository;

        public DeleteContractHistoryHandler(IContractHistoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> Handle(DeleteContractHistory request)
        {
            return await _repository.DeleteAsync(request.Id);
        }
    }
}