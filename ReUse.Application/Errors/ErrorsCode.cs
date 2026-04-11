namespace ReUse.Application.Errors;

public static class ErrorsCode
{
    public const string Conflict = "CONFLICT";
    public const string ValidationError = "VALIDATION_ERROR";
    public const string EmailNotConfirmed = "EMAIL_NOT_CONFIRMED";
    public const string Forbidden = "FORBIDDEN";
    public const string Unauthorized = "Unauthorized";
    public const string IdentityOperationFailed = "IDENTITY_OPERATION_FAILED";
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string InvalidOtp = "INVALID_OTP";
    public const string InvalidRefreshToken = "INVALID_REFRESH_TOKEN";
    public const string InvalidRequest = "INVALID_REQUEST";
    public const string DomainRuleViolation = "DOMAIN_RULE_VIOLATION";
    public const string NotFound = "NOT_FOUND";
    public const string InvalidResetPasswordToken = "INVALID_RESET_PASSWORD_TOKEN";
    public const string InternalServer = "INTERNAL_SERVER";
    public const string BadRequest = "BAD_REQUEST";
}