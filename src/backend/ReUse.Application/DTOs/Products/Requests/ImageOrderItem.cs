using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Products.Requests;

public record ImageOrderItem(Guid ImageId, int DisplayOrder);