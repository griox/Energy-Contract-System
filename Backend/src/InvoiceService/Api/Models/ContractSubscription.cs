namespace Api.Models;

public class ContractSubscription
{
    public int Id { get; set; }
    public string ContractNumber { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int PaymentDay { get; set; }
    public bool IsActive { get; set; } = true;
}