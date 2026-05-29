namespace VolunteerPlatform.Application.Users.Queries;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsVolunteerConfirmed { get; set; }
    public bool IsOrganizationApproved { get; set; }
    public string? OrganizationName { get; set; }
    public DateTime CreatedAt { get; set; }
}
