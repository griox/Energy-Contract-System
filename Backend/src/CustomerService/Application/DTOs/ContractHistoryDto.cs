namespace Application.DTOs
{
    public class ContractHistoryDto
    {
        public int Id { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public DateTime Timestamp { get; set; }
        public int ContractId { get; set; }
    }
}