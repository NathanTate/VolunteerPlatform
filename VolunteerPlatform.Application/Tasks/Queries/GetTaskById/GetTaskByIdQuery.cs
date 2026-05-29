using MediatR;
using VolunteerPlatform.Application.Tasks.Queries;

namespace VolunteerPlatform.Application.Tasks.Queries.GetTaskById;

public record GetTaskByIdQuery(Guid TaskId) : IRequest<TaskDto?>;
