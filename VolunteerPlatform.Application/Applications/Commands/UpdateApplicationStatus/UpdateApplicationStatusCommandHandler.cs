using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Applications.Commands.UpdateApplicationStatus;

public class UpdateApplicationStatusCommandHandler : IRequestHandler<UpdateApplicationStatusCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notifications;

    public UpdateApplicationStatusCommandHandler(IApplicationDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task Handle(UpdateApplicationStatusCommand request, CancellationToken ct)
    {
        var application = await _context.ApplicationRequests
            .Include(a => a.Initiative)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, ct)
            ?? throw new KeyNotFoundException($"Application {request.ApplicationId} not found.");

        if (!request.IsAdmin && application.Initiative.OrganizerId != request.RequestingUserId)
            throw new VolunteerPlatform.Application.Common.Exceptions.UnauthorizedAccessException("You can only manage applications for your own initiatives.");

        application.Status = request.Status;
        await _context.SaveChangesAsync(ct);

        await _notifications.NotifyApplicationStatusChanged(application.UserId, application.Id, application.Status);
    }
}
