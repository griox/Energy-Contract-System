using Application.DTOs;
using Application.Interfaces;

namespace Application.Features.Resellers.Commands.GetAllResellers
{
    public class GetAllResellerHandler
    {
        private readonly IResellerRepository _resellerRepository;

        public GetAllResellerHandler(IResellerRepository resellerRepository)
        {
            _resellerRepository = resellerRepository;
        }

        public async Task<PagedResult<ResellerDto>> Handle(GetAllResellers request)
        {
            var (items, totalCount) = await _resellerRepository.GetPagedAsync(
                request.Search,
                request.Type,
                request.PageNumber,
                request.PageSize,
                request.SortBy,
                request.SortDesc);

            var dtos = items.Select(r => new ResellerDto
            {
                Id = r.Id,
                Name = r.Name,
                Type = r.Type
            }).ToList();

            return new PagedResult<ResellerDto>
            {
                Items = dtos,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize,
                TotalCount = totalCount
            };
        }
    }
}