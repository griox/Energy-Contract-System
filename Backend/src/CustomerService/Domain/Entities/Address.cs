using Domain.Common;

namespace Domain.Entities;

public class Address : BaseEntity
{
    public string ZipCode { get; set; } =  string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
    public string? Extension  { get; set; }
    // Quan hệ 1-1 hoặc 1-n với Contract (tùy nghiệp vụ, ở đây để 1-1 cho đơn giản)
    // Nếu muốn Bidirectional (hai chiều) thì thêm:
    // public Contract Contract { get; set; }
}