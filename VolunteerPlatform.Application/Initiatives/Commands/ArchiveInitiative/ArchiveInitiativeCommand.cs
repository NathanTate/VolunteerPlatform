using MediatR;

namespace VolunteerPlatform.Application.Initiatives.Commands.ArchiveInitiative;

public record ArchiveInitiativeCommand(Guid Id, string RequestingUserId, bool IsAdmin) : IRequest;
