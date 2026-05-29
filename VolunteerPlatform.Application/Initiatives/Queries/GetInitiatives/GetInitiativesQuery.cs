using MediatR;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetInitiatives;

public record GetInitiativesQuery : IRequest<PaginatedList<InitiativeDto>>
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public InitiativeCategory? Category { get; init; }
    public InitiativeStatus? Status { get; init; }
    public UrgencyLevel? UrgencyLevel { get; init; }
    public bool? IsEmergency { get; init; }
    public string? Search { get; init; }
    public DateTime? DateFrom { get; init; }
    public DateTime? DateTo { get; init; }
    public string? SortBy { get; init; }
    public double? Lat { get; init; }
    public double? Lng { get; init; }
    public double? RadiusKm { get; init; }
}
