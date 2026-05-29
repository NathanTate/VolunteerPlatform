using MediatR;

namespace VolunteerPlatform.Application.Applications.Commands.SubmitApplication;

public record SubmitApplicationCommand : IRequest<Guid>
{
    public Guid InitiativeId { get; init; }
    public string UserId { get; init; } = string.Empty;
    public string? Comment { get; init; }
}
