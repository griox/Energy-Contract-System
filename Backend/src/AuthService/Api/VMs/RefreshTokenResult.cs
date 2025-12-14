namespace Api.VMs;

public class RefreshTokenResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? AccessToken { get; set; }
 
}