namespace VolunteerPlatform.Application.Initiatives.Queries.GetInitiatives;

public class InitiativeDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string UrgencyLevel { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Address { get; set; } = string.Empty;
    public double RadiusKm { get; set; }
    public int RequiredVolunteers { get; set; }
    public int MaxParticipants { get; set; }
    public int CurrentParticipants { get; set; }
    public bool IsEmergency { get; set; }
    public string OrganizerId { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public double? DistanceKm { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public int TasksTotal { get; set; }
    public int TasksCompleted { get; set; }
}
