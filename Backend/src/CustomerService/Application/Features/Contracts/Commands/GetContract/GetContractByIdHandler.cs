using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Contracts.Commands.GetContract;

public class GetContractByIdHandler
{
    private readonly IContractRepository _contractRepository;

    public GetContractByIdHandler(IContractRepository contractRepository)
    {
        _contractRepository = contractRepository;
    }

    public async Task<ContractDto?> Handle(GetContractById request)
    {
        var contractEntity = await _contractRepository.GetContractById(request.Id);

        if (contractEntity == null)
            return null;

        // 🔥 Map thủ công Contract → ContractDto
        var dto = new ContractDto
        {
            Id = contractEntity.Id,
            ContractNumber = contractEntity.ContractNumber,

            FirstName = contractEntity.FirstName,
            LastName = contractEntity.LastName,

            Email = contractEntity.Email,
            Phone = contractEntity.Phone,

            CompanyName = contractEntity.CompanyName,

            StartDate = contractEntity.StartDate,
            EndDate = contractEntity.EndDate,

            BankAccountNumber = contractEntity.BankAccountNumber,
            PdfLink = contractEntity.PdfLink,

            AddressId = contractEntity.AddressId,
            ResellerId = contractEntity.ResellerId
        };

        return dto;
    }
}