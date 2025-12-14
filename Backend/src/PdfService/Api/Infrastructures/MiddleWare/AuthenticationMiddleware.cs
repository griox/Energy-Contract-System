namespace Api.Infrastructures.MiddleWare;

public class AuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private ILogger<AuthenticationMiddleware> _logger;
    public AuthenticationMiddleware(RequestDelegate next, ILogger<AuthenticationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);

        if (context.Response.StatusCode == 401)
        {
            _logger.LogWarning("Unauthorized access to {Path} from {IP}", 
                context.Request.Path, 
                context.Connection.RemoteIpAddress);
        }
    }
}