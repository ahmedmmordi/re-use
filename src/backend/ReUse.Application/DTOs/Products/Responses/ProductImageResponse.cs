using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Products.Responses;

public record ProductImageResponse
 (
    Guid Id,
    string Url,
    int DisplayOrder
  );