using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class InvalidCredentialsException : AppException
{
    public InvalidCredentialsException() :
        base(
            message: "Invalid email or password.",
            errorCode: ErrorsCode.InvalidCredentials,
            statusCode: 401)
    {
    }
}