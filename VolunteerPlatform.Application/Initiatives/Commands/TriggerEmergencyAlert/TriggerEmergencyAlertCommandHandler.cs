using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Initiatives.Commands.TriggerEmergencyAlert;

public class TriggerEmergencyAlertCommandHandler
    : IRequestHandler<TriggerEmergencyAlertCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService  _notifications;

    public TriggerEmergencyAlertCommandHandler(
        IApplicationDbContext context,
        INotificationService  notifications)
    {
        _context       = context;
        _notifications = notifications;
    }

    public async Task<int> Handle(TriggerEmergencyAlertCommand request, CancellationToken ct)
    {
        // ── 1. Fetch initiative ───────────────────────────────────────────────
        var initiative = await _context.Initiatives
            .FirstOrDefaultAsync(i => i.Id == request.InitiativeId, ct)
            ?? throw new KeyNotFoundException($"Initiative {request.InitiativeId} not found.");

        // ── 2. Authorisation guard ────────────────────────────────────────────
        var isOrganizer = initiative.OrganizerId == request.RequestingUserId;
        if (!isOrganizer && !request.IsAdmin)
            throw new UnauthorizedAccessException(
                "Only the organizer or an admin may trigger an emergency alert.");

        // ── 3. Mark initiative as emergency ───────────────────────────────────
        if (!initiative.IsEmergency)
        {
            initiative.IsEmergency = true;
            await _context.SaveChangesAsync(ct);
        }

        // ── 4. Collect all confirmed volunteers ───────────────────────────────
        var volunteerIds = await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Volunteer && u.IsVolunteerConfirmed)
            .Select(u => u.Id)
            .ToListAsync(ct);

        if (volunteerIds.Count == 0)
            return 0;

        // ── 5. Persist a targeted notification for each volunteer ─────────────
        var alertTitle   = "🚨 Екстрена ситуація";
        var alertMessage = string.IsNullOrWhiteSpace(request.CustomMessage)
            ? $"Потрібна ваша негайна допомога в ініціативі: «{initiative.Title}»!"
            : $"«{initiative.Title}» — {request.CustomMessage.Trim()}";

        var now   = DateTime.UtcNow;
        var rows  = volunteerIds.Select(uid => new UserNotification
        {
            Id                = Guid.NewGuid(),
            UserId            = uid,
            Type              = NotificationType.Emergency,
            Title             = alertTitle,
            Message           = alertMessage,
            IsRead            = false,
            RelatedEntityId   = request.InitiativeId,
            RelatedEntityType = "Initiative",
            CreatedAt         = now
        }).ToList();

        _context.Notifications.AddRange(rows);
        await _context.SaveChangesAsync(ct);

        // ── 6. Broadcast real-time alert to all connected clients ─────────────
        await _notifications.NotifyEmergencyBroadcast(
            alertTitle, alertMessage, request.InitiativeId);

        return volunteerIds.Count;
    }
}
