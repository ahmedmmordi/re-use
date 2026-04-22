using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authorization;

namespace ReUse.Infrastructure.Security.Authorization;

public class ActiveUserRequirement : IAuthorizationRequirement { }