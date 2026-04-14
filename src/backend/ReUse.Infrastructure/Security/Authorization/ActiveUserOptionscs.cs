using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Infrastructure.Security.Authorization;

public class ActiveUserOptions
{
    public int CacheTTLMinutes { get; set; } = 5;
    public bool FailClosedOnError { get; set; } = true; // Secure default
}