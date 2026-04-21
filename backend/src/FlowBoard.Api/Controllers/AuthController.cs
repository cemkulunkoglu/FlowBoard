using FlowBoard.Api.Auth;
using FlowBoard.Api.Contracts;
using FlowBoard.Application.Abstractions;
using FlowBoard.Application.Entities;
using IEmailSender = FlowBoard.Application.Abstractions.IEmailSender;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FlowBoard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private const int RefreshTokenDays = 30;
    private const int PasswordResetTokenMinutes = 30;
    private const int EmailVerificationTokenHours = 48;

    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly JwtTokenFactory _tokens;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailSender _emails;

    public AuthController(
        IAppDbContext db,
        IPasswordHasher hasher,
        JwtTokenFactory tokens,
        IWebHostEnvironment env,
        IEmailSender emails)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
        _env = env;
        _emails = emails;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("E-posta ve şifre zorunludur.");
        if (req.Password.Length < 8) return BadRequest("Şifre en az 8 karakter olmalı.");

        var exists = await _db.Users.AnyAsync(u => u.Email == email, ct);
        if (exists) return Conflict("Bu e-posta zaten kayıtlı.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = _hasher.Hash(req.Password),
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? email : req.DisplayName.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        await IssueVerificationEmailAsync(user, ct);
        return Ok(await BuildResponseAsync(user, ct));
    }

    [HttpPost("send-verification-email")]
    [Authorize]
    public async Task<IActionResult> SendVerification(CancellationToken ct)
    {
        var user = await _db.Users.FindAsync(new object?[] { User.GetUserId() }, ct);
        if (user is null) return Unauthorized();
        if (user.EmailVerifiedAt != null) return BadRequest("E-posta zaten doğrulanmış.");

        await IssueVerificationEmailAsync(user, ct);
        return NoContent();
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token)) return BadRequest("Token zorunlu.");

        var hash = TokenHash.Hash(req.Token);
        var token = await _db.EmailVerificationTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is null || token.UsedAt != null || token.ExpiresAt < DateTime.UtcNow)
            return BadRequest("Doğrulama bağlantısı geçersiz veya süresi dolmuş.");

        var user = await _db.Users.FindAsync(new object?[] { token.UserId }, ct);
        if (user is null) return BadRequest();

        user.EmailVerifiedAt = DateTime.UtcNow;
        token.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private async Task IssueVerificationEmailAsync(User user, CancellationToken ct)
    {
        var raw = TokenHash.NewRaw();
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = TokenHash.Hash(raw),
            ExpiresAt = DateTime.UtcNow.AddHours(EmailVerificationTokenHours),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);

        var link = $"http://localhost:5173/verify-email?token={Uri.EscapeDataString(raw)}";
        await _emails.SendAsync(user.Email, "FlowBoard · E-posta doğrulama",
            $"Merhaba {user.DisplayName},\n\nE-postanı doğrulamak için şu linke tıkla:\n{link}\n\nBu link {EmailVerificationTokenHours} saat içinde geçerlidir.",
            ct);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !_hasher.Verify(req.Password, user.PasswordHash))
            return Unauthorized("E-posta veya şifre hatalı.");

        return Ok(await BuildResponseAsync(user, ct));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken)) return BadRequest("Token zorunlu.");

        var hash = TokenHash.Hash(req.RefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is null || token.RevokedAt != null || token.ExpiresAt < DateTime.UtcNow)
            return Unauthorized("Token geçersiz.");

        var user = await _db.Users.FindAsync(new object?[] { token.UserId }, ct);
        if (user is null) return Unauthorized();

        token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return Ok(await BuildResponseAsync(user, ct));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken)) return NoContent();

        var hash = TokenHash.Hash(req.RefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword(ForgotPasswordRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        string? devToken = null;

        if (user is not null)
        {
            var raw = TokenHash.NewRaw();
            _db.PasswordResetTokens.Add(new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = TokenHash.Hash(raw),
                ExpiresAt = DateTime.UtcNow.AddMinutes(PasswordResetTokenMinutes),
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync(ct);

            if (_env.IsDevelopment()) devToken = raw;
        }

        return Ok(new ForgotPasswordResponse(
            "Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.",
            devToken));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrWhiteSpace(req.NewPassword))
            return BadRequest("Token ve yeni şifre zorunlu.");
        if (req.NewPassword.Length < 8) return BadRequest("Şifre en az 8 karakter olmalı.");

        var hash = TokenHash.Hash(req.Token);
        var token = await _db.PasswordResetTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is null || token.UsedAt != null || token.ExpiresAt < DateTime.UtcNow)
            return BadRequest("Sıfırlama bağlantısı geçersiz veya süresi dolmuş.");

        var user = await _db.Users.FindAsync(new object?[] { token.UserId }, ct);
        if (user is null) return BadRequest();

        user.PasswordHash = _hasher.Hash(req.NewPassword);
        token.UsedAt = DateTime.UtcNow;

        var activeRefreshTokens = await _db.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var rt in activeRefreshTokens) rt.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        var id = User.GetUserId();
        var user = await _db.Users.FindAsync(new object?[] { id }, ct);
        return user is null ? Unauthorized() : Ok(new UserDto(user.Id, user.Email, user.DisplayName, user.EmailVerifiedAt != null));
    }

    private async Task<AuthResponse> BuildResponseAsync(User user, CancellationToken ct)
    {
        var (token, exp) = _tokens.Create(user);
        var rawRefresh = TokenHash.NewRaw();
        _db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = TokenHash.Hash(rawRefresh),
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
        return new AuthResponse(token, exp, rawRefresh, new UserDto(user.Id, user.Email, user.DisplayName, user.EmailVerifiedAt != null));
    }
}
