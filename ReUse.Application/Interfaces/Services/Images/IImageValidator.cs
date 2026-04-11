using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace ReUse.Application.Interfaces.Services.Images;

public interface IImageValidator
{
    void Validate(IFormFile file);
}