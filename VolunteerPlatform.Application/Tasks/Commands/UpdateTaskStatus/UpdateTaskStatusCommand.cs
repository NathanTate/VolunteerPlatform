using MediatR;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Tasks.Commands.UpdateTaskStatus;

public record UpdateTaskStatusCommand : IRequest
{
    public Guid TaskId { get; init; }
    public VolunteerTaskStatus NewStatus { get; init; }
    public string RequestingUserId { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
    public string? Note { get; init; }
    public string? CompletionProofUrl { get; init; }
}
