using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Common.Models;

namespace VolunteerPlatform.Application.Users.Queries;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, UserProfileDto>
{
  private readonly IApplicationDbContext _context;

  public GetUserProfileQueryHandler(IApplicationDbContext context) => _context = context;

  public async Task<UserProfileDto> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
  {
    var user = await _context.Users.AsNoTracking()
        .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
        ?? throw new KeyNotFoundException($"User {request.UserId} not found.");

    return new UserProfileDto(
        user.Id,
        user.Email ?? string.Empty,
        user.FirstName,
        user.LastName,
        user.Role,
        user.IsOrganizationApproved,
        user.OrganizationName,
        user.CreatedAt
    );
  }
}
