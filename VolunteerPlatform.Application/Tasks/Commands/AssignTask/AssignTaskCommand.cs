using MediatR;

namespace VolunteerPlatform.Application.Tasks.Commands.AssignTask;

public record AssignTaskCommand(Guid TaskId, string VolunteerId, string RequestingUserId) : IRequest;
