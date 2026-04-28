using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using ReUse.Application.Enums;

namespace ReUse.Application.Options.Filters;

public class UserQueryOptions
{
    public SearchOptions? Search { get; set; }
    public UserFilterOptions? Filter { get; set; }

    public UserSortBy SortBy { get; set; } = UserSortBy.FullName;
    public SortDirection SortDirection { get; set; } = SortDirection.Asc;

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}