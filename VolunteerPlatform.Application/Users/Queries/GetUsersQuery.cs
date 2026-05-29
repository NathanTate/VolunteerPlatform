using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Users.Queries;

public record GetUsersQuery : IRequest<List<UserDto>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, List<UserDto>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<UserDto>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        return await _context.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email ?? string.Empty,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role.ToString(),
                IsVolunteerConfirmed = u.IsVolunteerConfirmed,
                IsOrganizationApproved = u.IsOrganizationApproved,
                OrganizationName = u.OrganizationName,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync(ct);
    }
}
