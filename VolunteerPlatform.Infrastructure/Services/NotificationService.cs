using Microsoft.AspNetCore.SignalR;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly IApplicationDbContext _context;

    public NotificationService(IHubContext<NotificationHub> hubContext, IApplicationDbContext context)
    {
        _hubContext = hubContext;
        _context = context;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task Persist(
        NotificationType type,
        string title,
        string message,
        string? userId = null,
        Guid? relatedEntityId = null,
        string? relatedEntityType = null)
    {
        _context.Notifications.Add(new UserNotification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            IsRead = false,
            RelatedEntityId = relatedEntityId,
            RelatedEntityType = relatedEntityType,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
    }

    private async Task BroadcastToUser(string userId, object payload)
        => await _hubContext.Clients.User(userId).SendAsync("Notification", payload);

    private async Task BroadcastToAll(object payload)
        => await _hubContext.Clients.All.SendAsync("Notification", payload);

    // ── INotificationService implementation ──────────────────────────────────

    public async Task NotifyApplicationStatusChanged(string userId, Guid applicationId, ApplicationStatus status)
    {
        var isApproved = status == ApplicationStatus.Approved;
        var title = isApproved ? "Заявку ухвалено" : "Заявку відхилено";
        var message = isApproved
            ? "Вашу заявку на участь в ініціативі було ухвалено."
            : "Вашу заявку на участь в ініціативі було відхилено.";

        await Persist(NotificationType.ApplicationStatusChanged, title, message,
            userId: userId, relatedEntityId: applicationId, relatedEntityType: "Application");

        await BroadcastToUser(userId, new
        {
            type = nameof(NotificationType.ApplicationStatusChanged),
            title,
            message,
            relatedEntityId = applicationId,
            relatedEntityType = "Application"
        });
    }

    public async Task NotifyNewInitiativeNearby(Guid initiativeId, string initiativeTitle)
    {
        var title = "Нова ініціатива";
        var message = $"З'явилася нова ініціатива: «{initiativeTitle}».";

        await Persist(NotificationType.NewInitiative, title, message,
            userId: null, relatedEntityId: initiativeId, relatedEntityType: "Initiative");

        await BroadcastToAll(new
        {
            type = nameof(NotificationType.NewInitiative),
            title,
            message,
            relatedEntityId = initiativeId,
            relatedEntityType = "Initiative"
        });
    }

    public async Task NotifyTaskAssigned(Guid taskId, string taskTitle, string volunteerId)
    {
        var title = "Вам призначено завдання";
        var message = $"Вам призначено завдання: «{taskTitle}».";

        await Persist(NotificationType.TaskAssigned, title, message,
            userId: volunteerId, relatedEntityId: taskId, relatedEntityType: "Task");

        await BroadcastToUser(volunteerId, new
        {
            type = nameof(NotificationType.TaskAssigned),
            title,
            message,
            relatedEntityId = taskId,
            relatedEntityType = "Task"
        });
    }

    public async Task NotifyTaskUpdated(Guid taskId, string taskTitle, string newStatus)
    {
        var title = "Статус завдання змінено";
        var message = $"Завдання «{taskTitle}» перейшло у стан: {newStatus}.";

        await Persist(NotificationType.TaskUpdated, title, message,
            userId: null, relatedEntityId: taskId, relatedEntityType: "Task");

        await BroadcastToAll(new
        {
            type = nameof(NotificationType.TaskUpdated),
            title,
            message,
            relatedEntityId = taskId,
            relatedEntityType = "Task"
        });
    }

    public async Task NotifyEmergencyInitiative(Guid initiativeId, string initiativeTitle)
    {
        var title = "🚨 Екстрена ситуація";
        var message = $"Оголошено екстрену ініціативу: «{initiativeTitle}». Потрібна ваша допомога!";

        await Persist(NotificationType.Emergency, title, message,
            userId: null, relatedEntityId: initiativeId, relatedEntityType: "Initiative");

        await BroadcastToAll(new
        {
            type = nameof(NotificationType.Emergency),
            title,
            message,
            relatedEntityId = initiativeId,
            relatedEntityType = "Initiative"
        });
    }

    public async Task NotifyDashboardUpdated()
    {
        // Transient event — no DB persistence needed, just SignalR broadcast
        await _hubContext.Clients.All.SendAsync("DashboardUpdated");
    }

    public async Task NotifyVolunteerInvited(string volunteerId, Guid initiativeId, string initiativeTitle)
    {
        var title = "Invitation to initiative";
        var message = $"A coordinator has invited you to join: {initiativeTitle}";
        await Persist(NotificationType.System, title, message,
            userId: volunteerId, relatedEntityId: initiativeId, relatedEntityType: "Initiative");
        await BroadcastToUser(volunteerId, new
        {
            type = "VolunteerInvited",
            title,
            message,
            relatedEntityId = initiativeId,
            relatedEntityType = "Initiative"
        });
    }

    public async Task NotifyEmergencyBroadcast(string title, string message, Guid initiativeId)
    {
        // Notifications already persisted per-volunteer by the command handler.
        // This method only fires the real-time SignalR broadcast to all connected clients.
        await BroadcastToAll(new
        {
            type = nameof(NotificationType.Emergency),
            title,
            message,
            relatedEntityId = initiativeId,
            relatedEntityType = "Initiative"
        });
    }
}
