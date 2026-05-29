using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Initiatives.Commands.UpdateInitiative;

public class UpdateInitiativeCommandHandler : IRequestHandler<UpdateInitiativeCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateInitiativeCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(UpdateInitiativeCommand request, CancellationToken ct)
    {
        var initiative = await _context.Initiatives.FirstOrDefaultAsync(i => i.Id == request.Id, ct)
            ?? throw new KeyNotFoundException($"Initiative {request.Id} not found.");

        if (!request.IsAdmin && initiative.OrganizerId != request.RequestingUserId)
            throw new Common.Exceptions.UnauthorizedAccessException("You can only edit your own initiatives.");

        initiative.Title = request.Title;
        initiative.Description = request.Description;
        initiative.Category = request.Category;
        initiative.UrgencyLevel = request.UrgencyLevel;
        initiative.Status = request.Status;
        initiative.StartDate = request.StartDate;
        initiative.EndDate = request.EndDate;
        initiative.Latitude = request.Latitude;
        initiative.Longitude = request.Longitude;
        initiative.Address = request.Address;
        initiative.RadiusKm = request.RadiusKm;
        initiative.RequiredVolunteers = request.RequiredVolunteers;
        initiative.MaxParticipants = request.MaxParticipants;
        initiative.IsEmergency = request.IsEmergency;
        initiative.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);
    }
}
