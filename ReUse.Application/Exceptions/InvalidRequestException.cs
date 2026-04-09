using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class InvalidRequestException : AppException
{
    public InvalidRequestException(string message)
        : base(
            message: message,
            errorCode: ErrorsCode.InvalidRequest,
            statusCode: 400)
    { }
}