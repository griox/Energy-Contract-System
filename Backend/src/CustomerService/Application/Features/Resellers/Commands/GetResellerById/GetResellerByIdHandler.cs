using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Resellers.Commands.GetResellerById
{
    public class GetResellerByIdHandler
    {
        private readonly IResellerRepository _resellerRepository;

        public GetResellerByIdHandler(IResellerRepository resellerRepository)
        {
            _resellerRepository = resellerRepository;
        }

        public async Task<ResellerDto?> Handle(GetResellerById request)
        {
            var reseller = await _resellerRepository.GetByIdAsync(request.Id);

            if (reseller == null)
                return null;

            return new ResellerDto
            {
                Id = reseller.Id,
                Name = reseller.Name,
                Type = reseller.Type
            };
        }
    }
}