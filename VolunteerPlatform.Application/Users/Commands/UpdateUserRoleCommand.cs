using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Users.Commands;

public record UpdateUserRoleCommand(string UserId, UserRole Role) : IRequest;

public class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand>
{
    private readonly IApplicationDbContext _context;

    public UpdateUserRoleCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task Handle(UpdateUserRoleCommand request, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException($"User {request.UserId} not found.");

        user.Role = request.Role;
        await _context.SaveChangesAsync(ct);
    }
}
