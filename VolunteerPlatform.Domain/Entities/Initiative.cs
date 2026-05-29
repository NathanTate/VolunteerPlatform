using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Domain.Entities;

public class Initiative
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public InitiativeCategory Category { get; set; }
    public UrgencyLevel UrgencyLevel { get; set; } = UrgencyLevel.Medium;
    public InitiativeStatus Status { get; set; } = InitiativeStatus.Planned;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    /// <summary>Latitude of the initiative location (WGS-84).</summary>
    public double Latitude { get; set; }

    /// <summary>Longitude of the initiative location (WGS-84).</summary>
    public double Longitude { get; set; }

    public string Address { get; set; } = string.Empty;

    /// <summary>Radius in kilometres within which the initiative is relevant.</summary>
    public double RadiusKm { get; set; } = 5.0;

    /// <summary>Desired total number of volunteers needed.</summary>
    public int RequiredVolunteers { get; set; }

    /// <summary>Maximum number of volunteers the initiative can accept.</summary>
    public int MaxParticipants { get; set; }

    /// <summary>Whether the initiative is in emergency / high-priority mode.</summary>
    public bool IsEmergency { get; set; }

    public string OrganizerId { get; set; } = string.Empty;
    public User Organizer { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }

    public ICollection<ApplicationRequest> Applications { get; set; } = new List<ApplicationRequest>();
    public ICollection<InitiativeImage> Images { get; set; } = new List<InitiativeImage>();
    public ICollection<VolunteerTask> Tasks { get; set; } = new List<VolunteerTask>();
}
