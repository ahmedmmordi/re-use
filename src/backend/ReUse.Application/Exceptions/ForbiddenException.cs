using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException()
        : base(
            message: "You do not have permission to access this resource.",
            errorCode: ErrorsCode.Forbidden,
            statusCode: 403)
    {
    }
}