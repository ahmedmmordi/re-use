using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.DTOs.Users.Account_Management.Commands;

public record DeleteAccountCommand(
    string Password,
    string Confirmation,
    string? Reason);