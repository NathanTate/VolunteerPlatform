using MediatR;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Initiatives.Commands.CreateInitiative;

public record CreateInitiativeCommand : IRequest<Guid>
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public InitiativeCategory Category { get; init; }
    public UrgencyLevel UrgencyLevel { get; init; } = UrgencyLevel.Medium;
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public string Address { get; init; } = string.Empty;
    public double RadiusKm { get; init; } = 5.0;
    public int RequiredVolunteers { get; init; }
    public int MaxParticipants { get; init; }
    public bool IsEmergency { get; init; }
    public string OrganizerId { get; init; } = string.Empty;
    public List<string> ImageUrls { get; init; } = new();
}
