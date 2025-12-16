using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Contracts.Commands.GetContractByEmail;

public class GetMyContractsHandler
{
    private readonly IContractRepository _contractRepository;

    public GetMyContractsHandler(IContractRepository contractRepository)
    {
        _contractRepository = contractRepository;
    }

    public async Task<List<ContractDto>> Handle(string email)
    {
        var contractEntities = await _contractRepository.GetContractsByEmailAsync(email);
        var contractDtos = new List<ContractDto>();

        foreach (var entity in contractEntities)
        {
            var dto = new ContractDto
            {
                Id = entity.Id,
                ContractNumber = entity.ContractNumber,
                FirstName = entity.FirstName,
                LastName = entity.LastName,
                Email = entity.Email,
                Phone = entity.Phone,
                CompanyName = entity.CompanyName,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                BankAccountNumber = entity.BankAccountNumber,
                PdfLink = entity.PdfLink,
                AddressId = entity.AddressId,
                ResellerId = entity.ResellerId,

                // Map Address
                AddressHouseNumber = entity.Address?.HouseNumber,
                AddressZipCode = entity.Address?.ZipCode,
            
                // Map Reseller
                ResellerName = entity.Reseller?.Name,
                ResellerType = entity.Reseller?.Type?.ToString(), 
                
                
            };

            contractDtos.Add(dto);
        }

        return contractDtos;
    }
}