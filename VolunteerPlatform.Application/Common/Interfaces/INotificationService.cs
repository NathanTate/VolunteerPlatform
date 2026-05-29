using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Common.Interfaces;

public interface INotificationService
{
    Task NotifyApplicationStatusChanged(string userId, Guid applicationId, ApplicationStatus status);
    Task NotifyNewInitiativeNearby(Guid initiativeId, string title);
    Task NotifyTaskAssigned(Guid taskId, string taskTitle, string volunteerId);
    Task NotifyTaskUpdated(Guid taskId, string taskTitle, string newStatus);
    Task NotifyEmergencyInitiative(Guid initiativeId, string title);

    /// <summary>Broadcasts to all connected clients that dashboard stats have changed.</summary>
    Task NotifyDashboardUpdated();
    Task NotifyVolunteerInvited(string volunteerId, Guid initiativeId, string initiativeTitle);
    Task NotifyEmergencyBroadcast(string title, string message, Guid initiativeId);
}
