using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Notifications.Commands;

public record MarkAllNotificationsReadCommand(string UserId) : IRequest;

public class MarkAllNotificationsReadCommandHandler : IRequestHandler<MarkAllNotificationsReadCommand>
{
    private readonly IApplicationDbContext _context;
    public MarkAllNotificationsReadCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(MarkAllNotificationsReadCommand request, CancellationToken ct)
    {
        // Update in bulk via ExecuteUpdateAsync (EF Core 7+)
        await _context.Notifications
            .Where(n => (n.UserId == request.UserId || n.UserId == null) && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }
}
