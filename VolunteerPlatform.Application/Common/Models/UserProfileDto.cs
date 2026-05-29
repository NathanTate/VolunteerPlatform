using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Common.Models;

public record UserProfileDto(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    bool IsOrganizationApproved,
    string? OrganizationName,
    DateTime CreatedAt
);
