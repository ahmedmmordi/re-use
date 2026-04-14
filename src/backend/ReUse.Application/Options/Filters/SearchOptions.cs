using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.Options.Enums;

namespace ReUse.Application.Options.Filters;

public class SearchOptions
{
    public string? Keyword { get; set; }
    public List<UserSearchBy>? SearchBy { get; set; }  // which fields to search
}