using Application.Interfaces;
using Domain.Entities;

namespace Application.Features.Addresses.Commands.CreateAddress;

public class CreateAddressHandler
{
    private readonly IAddressRepository _addressRepository;

    public CreateAddressHandler(IAddressRepository addressRepository)
    {
        _addressRepository = addressRepository;
    }
    
    public async Task<int> Handle(CreateAddress request)
    {
        var address = new Address
        {
            ZipCode = request.ZipCode,
            HouseNumber = request.HouseNumber,
            Extension = request.Extension
        };

        await _addressRepository.AddAsync(address);

        return address.Id;
    }
}