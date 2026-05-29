using MediatR;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetMapInitiatives;

public record GetMapInitiativesQuery : IRequest<List<InitiativeMapDto>>;
