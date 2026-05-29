using MediatR;

namespace VolunteerPlatform.Application.Initiatives.Commands.DeleteInitiative;

public record DeleteInitiativeCommand(Guid Id) : IRequest;
