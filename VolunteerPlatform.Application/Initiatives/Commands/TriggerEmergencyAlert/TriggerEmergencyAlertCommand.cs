using MediatR;

namespace VolunteerPlatform.Application.Initiatives.Commands.TriggerEmergencyAlert;

/// <summary>
/// Sends a push notification to every confirmed volunteer and marks the
/// initiative as emergency (if not already). Returns the number of volunteers notified.
/// </summary>
public record TriggerEmergencyAlertCommand(
    Guid   InitiativeId,
    string RequestingUserId,
    bool   IsAdmin,
    string? CustomMessage = null
) : IRequest<int>;
