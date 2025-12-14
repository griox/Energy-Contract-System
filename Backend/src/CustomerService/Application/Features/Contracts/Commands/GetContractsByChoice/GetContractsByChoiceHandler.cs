using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Contracts.Commands.GetContractsByChoice;

public class GetContractsByChoiceHandler
{
    private readonly IContractRepository _contractRepository;

    public GetContractsByChoiceHandler(IContractRepository contractRepository)
    {
        _contractRepository = contractRepository;
    }

    public async Task<PagedResult<ContractDto>> Handle(GetContractsByChoice request)
    {
        var (contracts, totalCount) = await _contractRepository.GetPagedContractsAsync(
            request.Search,
            request.ResellerId,
            request.StartDateFrom,
            request.StartDateTo,
            request.PageNumber,
            request.PageSize,
            request.SortBy,
            request.SortDesc);

        var items = contracts.Select(c => new ContractDto
        {
            Id = c.Id,
            ContractNumber = c.ContractNumber,
            FirstName = c.FirstName,
            LastName = c.LastName,
            Email = c.Email,
            Phone = c.Phone,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            BankAccountNumber = c.BankAccountNumber,
            PdfLink = c.PdfLink,

            AddressId = c.AddressId,
            AddressZipCode = c.Address.ZipCode,
            AddressHouseNumber = c.Address.HouseNumber,
            ResellerId = c.ResellerId,
            ResellerName = c.Reseller.Name,
            ResellerType = c.Reseller.Type
        }).ToList();

        return new PagedResult<ContractDto>
        {
            Items = items,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalCount
        };
    }
}