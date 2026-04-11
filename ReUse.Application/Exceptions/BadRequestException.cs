using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.Errors;

namespace ReUse.Application.Exceptions;

public sealed class BadRequestException : AppException
{
    public BadRequestException(string message) : base(message, ErrorsCode.BadRequest, (int)HttpStatusCode.BadRequest)
    {
    }

    public BadRequestException(string message, string errorCode) : base(message, errorCode, (int)HttpStatusCode.BadRequest)
    {
    }


}