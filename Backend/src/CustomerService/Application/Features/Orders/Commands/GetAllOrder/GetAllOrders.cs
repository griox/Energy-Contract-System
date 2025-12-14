namespace Application.Features.Orders.Commands.GetAllOrders
{
    public class GetAllOrders
    {
        public string? Search { get; set; }   // search theo OrderNumber
        public int? Status { get; set; }      // Domain.Enums.OrderStatus
        public int? OrderType { get; set; }   // Domain.Enums.OrderType

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        public string? SortBy { get; set; }
        public bool SortDesc { get; set; } = true;
    }
}