using Domain.Common;
using Domain.Enums;


namespace Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public int OrderType { get; set; } // Enum: Gas hoặc Electricity
    public int Status { get; set; }  // Enum
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    public decimal TopupFee { get; set; }

    // Khóa ngoại (Foreign Key) tới Contract
    public int ContractId { get; set; }
    public Contract Contract { get; set; } = null!;
}