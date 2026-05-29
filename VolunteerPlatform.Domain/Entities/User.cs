using Microsoft.AspNetCore.Identity;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Domain.Entities;

public class User : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Guest;
    public string? OrganizationName { get; set; }
    public bool IsOrganizationApproved { get; set; }
    public bool IsVolunteerConfirmed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Initiative> CreatedInitiatives { get; set; } = new List<Initiative>();
    public ICollection<ApplicationRequest> Applications { get; set; } = new List<ApplicationRequest>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
