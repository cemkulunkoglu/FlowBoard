using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlowBoard.Api.Auth;

public static class CurrentUser
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                 ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : Guid.Empty;
    }
}
