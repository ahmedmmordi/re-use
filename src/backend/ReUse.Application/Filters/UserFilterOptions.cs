using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.Options.Filters;

public class UserFilterOptions
{
    public string? Country { get; set; }
    public string? City { get; set; }
    public DateTime? CreatedAfter { get; set; }
}