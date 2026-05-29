using MediatR;
using VolunteerPlatform.Application.Tasks.Queries;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Tasks.Queries.GetMyTasks;

public record GetMyTasksQuery(string VolunteerId, VolunteerTaskStatus? Status = null) : IRequest<List<TaskSummaryDto>>;
