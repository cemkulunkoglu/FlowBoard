using System.Security.Cryptography;
using System.Text;

namespace FlowBoard.Api.Auth;

public static class TokenHash
{
    public static string NewRaw(int bytes = 32)
    {
        Span<byte> buf = stackalloc byte[bytes];
        RandomNumberGenerator.Fill(buf);
        return Convert.ToBase64String(buf).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static string Hash(string raw)
    {
        Span<byte> output = stackalloc byte[32];
        SHA256.HashData(Encoding.UTF8.GetBytes(raw), output);
        return Convert.ToHexString(output);
    }
}
