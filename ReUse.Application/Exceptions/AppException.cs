namespace ReUse.Application.Exceptions;

public abstract class AppException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }

    protected AppException(
        string message,
        string errorCode,
        int statusCode) : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}