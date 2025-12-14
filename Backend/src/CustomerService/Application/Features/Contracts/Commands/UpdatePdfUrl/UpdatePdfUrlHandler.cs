using Application.Interfaces;
using Microsoft.Extensions.Logging;


namespace Application.Features.Contracts.Commands.UpdatePdfUrl;

public class UpdatePdfUrlHandler
{
    private readonly IContractRepository _contractRepository;
    private readonly ILogger<UpdatePdfUrlHandler> _logger;

    public UpdatePdfUrlHandler(IContractRepository contractRepository, ILogger<UpdatePdfUrlHandler> logger)
    {
        _contractRepository = contractRepository;
        _logger = logger;
    }

    public async Task Handle(UpdatePdfUrlCommand command)
    {
        var contract = await _contractRepository.GetContractByNumberAsync(command.ContractNumber);
        
        if (contract == null)
        {
            throw new Exception($"Contract with number {command.ContractNumber} not found.");
        }

        contract.PdfLink = command.PdfUrl;
        
        // Sử dụng hàm UpdateContract có sẵn trong Repository
        await _contractRepository.UpdateContract(contract);
        
        _logger.LogInformation($"Updated PdfLink for contract {command.ContractNumber}");
    }
}