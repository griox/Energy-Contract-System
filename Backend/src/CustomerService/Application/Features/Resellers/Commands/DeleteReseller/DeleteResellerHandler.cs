using Application.Interfaces;

namespace Application.Features.Resellers.Commands.DeleteReseller
{
    public class DeleteResellerHandler
    {
        private readonly IResellerRepository _resellerRepository;

        public DeleteResellerHandler(IResellerRepository resellerRepository)
        {
            _resellerRepository = resellerRepository;
        }

        public async Task Handle(DeleteReseller request)
        {
            var reseller = await _resellerRepository.GetByIdAsync(request.Id);

            if (reseller == null)
                throw new Exception("Reseller not found");

            await _resellerRepository.DeleteAsync(reseller);
        }
    }
}