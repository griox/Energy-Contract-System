using Application.Interfaces;

namespace Application.Features.Addresses.Commands.UpdateAddress;

public class UpdateAddressHandler
{
    private readonly IAddressRepository _repo;

    public UpdateAddressHandler(IAddressRepository repo)
    {
        _repo = repo;
    }

    public async Task<bool> Handle(UpdateAddress request)
    {
        var a = await _repo.GetByIdAsync(request.Id);
        if (a == null)
            return false;

        a.ZipCode = request.ZipCode;
        a.HouseNumber = request.HouseNumber;
        a.Extension = request.Extension;

        await _repo.UpdateAsync(a);
        return true;
    }
}
