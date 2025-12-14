using Application.Interfaces;

namespace Application.Features.Contracts.Commands.DeleteContract;

public class DeleteContractHandler
{
    private readonly IContractRepository _contractRepository;

    public DeleteContractHandler(IContractRepository contractRepository)
    {
        _contractRepository = contractRepository;
    }

    public async Task Handle(DeleteContract request)
    {
        var contractToDelete = await _contractRepository.GetContractById(request.Id);

        if (contractToDelete == null)
            throw new Exception($"Contract with id {request.Id} not found");

        await _contractRepository.DeleteContract(contractToDelete);
    }
}