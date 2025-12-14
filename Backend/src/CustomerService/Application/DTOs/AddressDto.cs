namespace Application.DTOs;

public class AddressDto
{
    public int Id { get; set; }
    public string ZipCode { get; set; } = string.Empty;
    public string HouseNumber { get; set; } = string.Empty;
    public string? Extension { get; set; }
}