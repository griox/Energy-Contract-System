using Api.VMs;

namespace DefaultNamespace;

public class UserResponse
{
    public bool Success { get; set; }
    public UserDto? User { get; set; }
    public string? ErrorMessage { get; set; }
}