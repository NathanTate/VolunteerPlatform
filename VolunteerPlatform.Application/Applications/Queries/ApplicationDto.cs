namespace VolunteerPlatform.Application.Applications.Queries;

public class ApplicationDto
{
    public Guid Id { get; set; }
    public Guid InitiativeId { get; set; }
    public string InitiativeTitle { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime SubmittedAt { get; set; }
}
