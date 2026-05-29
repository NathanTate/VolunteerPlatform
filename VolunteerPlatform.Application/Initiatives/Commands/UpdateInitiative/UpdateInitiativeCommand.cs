using MediatR;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Initiatives.Commands.UpdateInitiative;

public record UpdateInitiativeCommand : IRequest
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public InitiativeCategory Category { get; init; }
    public UrgencyLevel UrgencyLevel { get; init; } = UrgencyLevel.Medium;
    public InitiativeStatus Status { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public string Address { get; init; } = string.Empty;
    public double RadiusKm { get; init; } = 5.0;
    public int RequiredVolunteers { get; init; }
    public int MaxParticipants { get; init; }
    public bool IsEmergency { get; init; }
    public string RequestingUserId { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
}
