using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class DomainException : AppException
{
    public DomainException(string message)
        : base(
            message: message,
            errorCode: ErrorsCode.DomainRuleViolation,
            statusCode: 400)
    { }
}