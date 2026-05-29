using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Notifications.Commands;

public record MarkNotificationReadCommand(Guid NotificationId, string UserId) : IRequest;

public class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly IApplicationDbContext _context;
    public MarkNotificationReadCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(MarkNotificationReadCommand request, CancellationToken ct)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(
                n => n.Id == request.NotificationId &&
                     (n.UserId == request.UserId || n.UserId == null),
                ct);

        if (notification is null) return; // silently ignore — idempotent

        notification.IsRead = true;
        await _context.SaveChangesAsync(ct);
    }
}
