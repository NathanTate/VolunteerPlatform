using MediatR;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Applications.Commands.UpdateApplicationStatus;

public record UpdateApplicationStatusCommand : IRequest
{
    public Guid ApplicationId { get; init; }
    public ApplicationStatus Status { get; init; }
    public string RequestingUserId { get; init; } = string.Empty;
    public bool IsAdmin { get; init; }
}
