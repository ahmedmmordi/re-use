using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string resource)
        : base(
            message: $"{resource} was not found.",
            errorCode: ErrorsCode.NotFound,
            statusCode: 404)
    {
    }
}