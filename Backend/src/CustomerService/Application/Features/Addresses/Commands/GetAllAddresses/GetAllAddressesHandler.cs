using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Addresses.Commands.GetAllAddresses;

public class GetAllAddressesHandler
{
    private readonly IAddressRepository _addressRepository;

    public GetAllAddressesHandler(IAddressRepository addressRepository)
    {
        _addressRepository = addressRepository;
    }

    public async Task<PagedResult<AddressDto>> Handle(GetAllAddresses request)
    {
        var (items, totalCount) = await _addressRepository.GetPagedAsync(
            request.Search,
            request.ZipCode,
            request.PageNumber,
            request.PageSize,
            request.SortBy,
            request.SortDesc);

        var dtos = items.Select(a => new AddressDto
        {
            Id = a.Id,
            ZipCode = a.ZipCode,
            HouseNumber = a.HouseNumber,
            Extension = a.Extension
        }).ToList();

        return new PagedResult<AddressDto>
        {
            Items = dtos,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalCount
        };
    }
}