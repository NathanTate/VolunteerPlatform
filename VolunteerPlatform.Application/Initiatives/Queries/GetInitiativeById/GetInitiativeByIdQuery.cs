using MediatR;
using VolunteerPlatform.Application.Initiatives.Queries.GetInitiatives;

namespace VolunteerPlatform.Application.Initiatives.Queries.GetInitiativeById;

public record GetInitiativeByIdQuery(Guid Id) : IRequest<InitiativeDto?>;
