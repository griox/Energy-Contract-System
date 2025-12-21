
public class OrderCreatedEvent { 
    public int Id { get; set; }
    public string ContractNumber { get; set; }
    public string Email { get; set; } // Order Service phải Join Contract để lấy cái này gửi sang
    public string FullName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TopupFee { get; set; }
}