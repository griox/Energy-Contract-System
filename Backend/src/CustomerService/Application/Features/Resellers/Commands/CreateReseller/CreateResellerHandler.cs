using Application.Interfaces;
using Domain.Entities;

namespace Application.Features.Resellers.Commands.CreateReseller
{
    public class CreateResellerHandler
    {
        private readonly IResellerRepository _resellerRepository;

        public CreateResellerHandler(IResellerRepository resellerRepository)
        {
            _resellerRepository = resellerRepository;
        }
        
        public async Task<int> Handle(CreateReseller request)
        {
            var reseller = new Reseller
            {
                Name = request.Name,
                Type = request.Type
            };

            await _resellerRepository.AddAsync(reseller);
            return reseller.Id;
        }
    }
}