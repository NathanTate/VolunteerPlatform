namespace VolunteerPlatform.Application.Initiatives.Queries.GetMapInitiatives;

public class InitiativeMapDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string UrgencyLevel { get; set; } = string.Empty;
    public bool IsEmergency { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double RadiusKm { get; set; }
    public string? CoverImageUrl { get; set; }
    public double? DistanceKm { get; set; }
}
