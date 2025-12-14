using Application.Interfaces;

namespace Application.Features.Resellers.Commands.UpdateReseller
{
    public class UpdateResellerHandler
    {
        private readonly IResellerRepository _resellerRepository;

        public UpdateResellerHandler(IResellerRepository resellerRepository)
        {
            _resellerRepository = resellerRepository;
        }

        public async Task Handle(UpdateReseller request)
        {
            var reseller = await _resellerRepository.GetByIdAsync(request.Id);

            if (reseller == null)
                throw new Exception("Reseller not found");

            reseller.Name = request.Name;
            reseller.Type = request.Type;

            await _resellerRepository.UpdateAsync(reseller);
        }
    }
}