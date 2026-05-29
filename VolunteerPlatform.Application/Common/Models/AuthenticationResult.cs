namespace VolunteerPlatform.Application.Common.Models;

public record AuthenticationResult(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    string UserId,
    string Role,
    bool IsOrganizationApproved,
    string? OrganizationName
);
