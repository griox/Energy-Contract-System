using Application.DTOs;

namespace Application.Features.Resellers.Commands.GetAllResellers
{
    public class GetAllResellers
    {
        public string? Search { get; set; }  // Name / Type
        public string? Type { get; set; }

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        public string? SortBy { get; set; }
        public bool SortDesc { get; set; } = true;
    }
}