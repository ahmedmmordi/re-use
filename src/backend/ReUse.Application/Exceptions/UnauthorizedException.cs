using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException()
        : base(
            message: "You are not authenticated.",
            errorCode: ErrorsCode.Unauthorized,
            statusCode: 401)
    {
    }
}