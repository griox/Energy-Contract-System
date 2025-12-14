using Application.Interfaces;

namespace Application.Features.Addresses.Commands.DeleteAddress
{
    public class DeleteAddressHandler
    {
        private readonly IAddressRepository _addressRepository;

        public DeleteAddressHandler(IAddressRepository addressRepository)
        {
            _addressRepository = addressRepository;
        }

        public async Task<bool> Handle(DeleteAddress request)
        {
            var address = await _addressRepository.GetByIdAsync(request.Id);

            if (address == null)
                return false;

            await _addressRepository.DeleteAsync(address);
            return true;
        }
    }
}