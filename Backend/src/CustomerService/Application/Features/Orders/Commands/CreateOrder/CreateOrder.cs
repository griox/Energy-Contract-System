namespace Application.Features.Orders.Commands.CreateOrder
{
    public class CreateOrder
    {
        public string OrderNumber { get; set; }
        public int OrderType { get; set; }
        public int Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TopupFee { get; set; }
        public int ContractId { get; set; }
    }
}