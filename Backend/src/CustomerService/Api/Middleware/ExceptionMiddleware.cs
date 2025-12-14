using System.Net;
using System.Text.Json;
using FluentValidation;

namespace Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await _next(httpContext); // Cho request đi qua
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(httpContext, ex); // Nếu lỗi thì bắt lại
        }
    }
    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        // Mặc định là lỗi 500
        object response = new { error = exception.Message };
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        // Nếu là lỗi Validation -> Chuyển thành 400
        if (exception is ValidationException validationException)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            var errors = validationException.Errors.Select(e => e.ErrorMessage);
            response = new { error = "Validation Failed", details = errors };
        }

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}