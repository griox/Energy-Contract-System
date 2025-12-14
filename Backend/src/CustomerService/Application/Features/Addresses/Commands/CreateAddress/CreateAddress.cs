namespace Application.Features.Addresses.Commands.CreateAddress;

public class CreateAddress
{
    public string ZipCode { get; set; } = string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
    public string? Extension  { get; set; }
}