using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Initiatives.Commands.ArchiveInitiative;

public class ArchiveInitiativeCommandHandler : IRequestHandler<ArchiveInitiativeCommand>
{
    private readonly IApplicationDbContext _context;

    public ArchiveInitiativeCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(ArchiveInitiativeCommand request, CancellationToken ct)
    {
        var initiative = await _context.Initiatives
            .FirstOrDefaultAsync(i => i.Id == request.Id, ct)
            ?? throw new KeyNotFoundException($"Initiative {request.Id} not found.");

        if (!request.IsAdmin && initiative.OrganizerId != request.RequestingUserId)
            throw new Common.Exceptions.UnauthorizedAccessException("You can only archive your own initiatives.");

        if (initiative.Status == InitiativeStatus.Archived)
            throw new InvalidOperationException("Initiative is already archived.");

        initiative.Status = InitiativeStatus.Archived;
        initiative.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
    }
}
