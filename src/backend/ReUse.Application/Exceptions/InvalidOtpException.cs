using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class InvalidOtpException : AppException
{
    public InvalidOtpException() : base(
        message: "Invalid or expired OTP.",
        errorCode: ErrorsCode.InvalidOtp,
        statusCode: 400)
    { }
}