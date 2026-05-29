using MediatR;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Tasks.Commands.CreateTask;

public record CreateTaskCommand : IRequest<Guid>
{
    public Guid InitiativeId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public TaskPriority Priority { get; init; } = TaskPriority.Medium;
    public DateTime? Deadline { get; init; }
    public string CreatedById { get; init; } = string.Empty;
}
