using MediatR;
using VolunteerPlatform.Application.Initiatives.Queries.GetMapInitiatives;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetNearbyInitiatives;

public record GetNearbyInitiativesQuery : IRequest<List<InitiativeMapDto>>
{
    public double Lat { get; init; }
    public double Lng { get; init; }
    public double RadiusKm { get; init; } = 10;
}
