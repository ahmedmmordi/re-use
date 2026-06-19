using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class ServiceUnavailableException : AppException
{
    public ServiceUnavailableException(string message)
        : base(message: message,
            errorCode: ErrorsCode.ServiceUnavailable,
            statusCode: 503)
    {
    }
}