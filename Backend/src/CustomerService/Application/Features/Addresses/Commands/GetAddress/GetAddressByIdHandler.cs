using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Addresses.Commands.GetAddress;

public class GetAddressByIdHandler
{
    private readonly IAddressRepository _addressRepository;

    public GetAddressByIdHandler(IAddressRepository addressRepository)
    {
        _addressRepository = addressRepository;
    }

    public async Task<AddressDto?> Handle(GetAddressById request)
    {
        var entity = await _addressRepository.GetByIdAsync(request.Id);

        if (entity == null)
            return null;

        return new AddressDto
        {
            Id = entity.Id,
            ZipCode = entity.ZipCode,
            HouseNumber = entity.HouseNumber,
            Extension = entity.Extension
        };
    }
}