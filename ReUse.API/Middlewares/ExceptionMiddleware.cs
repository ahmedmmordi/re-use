
using ReUse.API.Responses;
using ReUse.Application.Errors;
using ReUse.Application.Exceptions;

namespace ReUse.API.Middlewares;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";

        ErrorResponse response;
        int statusCode;

        if (exception is AppException appException)
        {
            statusCode = appException.StatusCode;

            response = exception switch
            {
                IdentityOperationException identityEx => new ErrorResponse
                {
                    Code = identityEx.ErrorCode,
                    Message = identityEx.Message,
                    Errors = identityEx.Errors
                },

                _ => new ErrorResponse
                {
                    Code = appException.ErrorCode,
                    Message = appException.Message
                }
            };
        }
        else
        {
            statusCode = StatusCodes.Status500InternalServerError;

            response = new ErrorResponse
            {
                Code = ErrorsCode.InternalServer,
                Message = "Internal server error"
            };
        }

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(response);
    }
}