using MediatR;
using VolunteerPlatform.Application.Tasks.Queries;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Tasks.Queries.GetTasksForInitiative;

public record GetTasksForInitiativeQuery : IRequest<List<TaskSummaryDto>>
{
    public Guid InitiativeId { get; init; }
    public VolunteerTaskStatus? Status { get; init; }
    public string? AssignedVolunteerId { get; init; }
}
