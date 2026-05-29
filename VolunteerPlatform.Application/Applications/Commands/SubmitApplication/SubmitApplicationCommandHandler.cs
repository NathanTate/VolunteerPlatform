using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Applications.Commands.SubmitApplication;

public class SubmitApplicationCommandHandler : IRequestHandler<SubmitApplicationCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public SubmitApplicationCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Guid> Handle(SubmitApplicationCommand request, CancellationToken ct)
    {
        var initiative = await _context.Initiatives.FirstOrDefaultAsync(i => i.Id == request.InitiativeId, ct)
            ?? throw new KeyNotFoundException($"Initiative {request.InitiativeId} not found.");

        if (initiative.OrganizerId == request.UserId)
            throw new InvalidOperationException("You cannot apply to your own initiative.");

        var existing = await _context.ApplicationRequests
            .FirstOrDefaultAsync(a => a.InitiativeId == request.InitiativeId && a.UserId == request.UserId, ct);

        if (existing != null)
        {
            // Allow re-application only after a rejection — remove the old record
            if (existing.Status == ApplicationStatus.Rejected)
            {
                _context.ApplicationRequests.Remove(existing);
                await _context.SaveChangesAsync(ct);
            }
            else
            {
                throw new InvalidOperationException("You have already applied to this initiative.");
            }
        }

        var application = new ApplicationRequest
        {
            Id              = Guid.NewGuid(),
            InitiativeId    = request.InitiativeId,
            UserId          = request.UserId,
            Comment         = request.Comment,
            SubmittedAt     = DateTime.UtcNow
        };

        _context.ApplicationRequests.Add(application);
        await _context.SaveChangesAsync(ct);

        return application.Id;
    }
}
