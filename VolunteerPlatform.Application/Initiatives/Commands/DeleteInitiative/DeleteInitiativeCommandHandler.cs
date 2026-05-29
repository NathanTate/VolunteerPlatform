using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Initiatives.Commands.DeleteInitiative;

public class DeleteInitiativeCommandHandler : IRequestHandler<DeleteInitiativeCommand>
{
    private readonly IApplicationDbContext _context;

    public DeleteInitiativeCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(DeleteInitiativeCommand request, CancellationToken ct)
    {
        var initiative = await _context.Initiatives.FirstOrDefaultAsync(i => i.Id == request.Id, ct)
            ?? throw new KeyNotFoundException($"Initiative {request.Id} not found.");

        initiative.IsDeleted = true;
        await _context.SaveChangesAsync(ct);
    }
}
