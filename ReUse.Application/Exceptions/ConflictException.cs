using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string resource)
        : base(message: $"{resource} already exists.",
            errorCode: ErrorsCode.Conflict,
            statusCode: 409)
    {
    }
}