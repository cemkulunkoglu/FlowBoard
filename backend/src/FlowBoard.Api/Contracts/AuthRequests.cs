namespace FlowBoard.Api.Contracts;

public record RegisterRequest(string Email, string Password, string DisplayName);

public record LoginRequest(string Email, string Password);

public record UserDto(Guid Id, string Email, string DisplayName, bool EmailVerified);

public record VerifyEmailRequest(string Token);

public record AuthResponse(string Token, DateTime ExpiresAt, string RefreshToken, UserDto User);

public record RefreshTokenRequest(string RefreshToken);

public record LogoutRequest(string RefreshToken);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword);

public record ForgotPasswordResponse(string Message, string? DevToken);

public record CreateBoardRequest(string Title);

public record UpdateBoardRequest(string Title);

public record InviteMemberRequest(string Email);

public record BoardMemberDto(Guid UserId, string Email, string DisplayName, string Role, DateTime JoinedAt);
