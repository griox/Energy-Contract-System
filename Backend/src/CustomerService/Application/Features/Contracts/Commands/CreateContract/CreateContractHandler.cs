using Application.Interfaces;
using Domain.Entities;

namespace Application.Features.Contracts.Commands.CreateContract;

public class CreateContractHandler
{
    private readonly IContractRepository _contractRepository;

    public CreateContractHandler(IContractRepository contractRepository)
    {
        _contractRepository = contractRepository;
    }

    public async Task<int> Handle(CreateContract request)
    {
        // Mapping thủ công: chuẩn 100% theo entity bạn cung cấp
        var contract = new Contract
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CompanyName = request.CompanyName,
            BankAccountNumber = request.BankAccountNumber,
            PdfLink = request.PdfLink,
            ResellerId = request.ResellerId,
            AddressId = request.AddressId
        };

        // Sinh ContractNumber tự động
        contract.ContractNumber = Guid.NewGuid().ToString("N")[..8].ToUpper();

        // Lưu vào DB
        var newContract = await _contractRepository.AddContract(contract);

        return newContract.Id;
    }
}