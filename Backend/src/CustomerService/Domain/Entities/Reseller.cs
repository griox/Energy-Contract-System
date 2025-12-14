using Domain.Common;

namespace Domain.Entities;

public class Reseller: BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type  { get; set; } = string.Empty;
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}