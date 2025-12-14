using Application.DTOs;

namespace Application.Features.Addresses.Commands.GetAllAddresses
{
    public class GetAllAddresses
    {
        public string? Search { get; set; }  // ZipCode / HouseNumber
        public string? ZipCode { get; set; }

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        public string? SortBy { get; set; }
        public bool SortDesc { get; set; } = true;
    }
}