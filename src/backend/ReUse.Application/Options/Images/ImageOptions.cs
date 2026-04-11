using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReUse.Application.Options.Images;

public class ImageOptions
{
    public const int MaxFileSizeInMB = 5;
    public const int MaxFileSizeInBytes = MaxFileSizeInMB * 1024 * 1024;

    //file content Extention & binary sig

    public static readonly HashSet<string> AllowedMimeTypes =
   [
        "image/jpeg",
            "image/png"
   ];

    public static readonly Dictionary<string, string[]> FileSignatures = new()
        {
            { "image/jpeg", new[] { "FF-D8" } },
            { "image/png",  new[] { "89-50" } }
        };


}