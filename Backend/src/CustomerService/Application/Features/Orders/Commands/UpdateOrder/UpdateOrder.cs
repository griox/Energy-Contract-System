namespace Application.Features.Orders.Commands.UpdateOrder
{
    public class UpdateOrder
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; }
        public int OrderType { get; set; }
        public int Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TopupFee { get; set; }
    }
}