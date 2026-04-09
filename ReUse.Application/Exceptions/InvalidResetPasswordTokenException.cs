using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class InvalidResetPasswordTokenException : AppException
{
    public InvalidResetPasswordTokenException()
        : base(
            message: "Invalid or expired reset password token.",
            errorCode: ErrorsCode.InvalidResetPasswordToken,
            statusCode: 400)
    {
    }
}