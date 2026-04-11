using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public class EmailNotConfirmedException : AppException
{
    public EmailNotConfirmedException() :
        base(message: "Email address is not confirmed.",
            errorCode: ErrorsCode.EmailNotConfirmed,
            statusCode: 403)
    {

    }
}