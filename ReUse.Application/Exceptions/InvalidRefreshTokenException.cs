using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class InvalidRefreshTokenException : AppException
{
    public InvalidRefreshTokenException()
        : base(message: "Invalid or expired refresh token.",
            errorCode: ErrorsCode.InvalidRefreshToken,
            statusCode: 401)
    { }
}