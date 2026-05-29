using MediatR;
using VolunteerPlatform.Application.Common.Models;

namespace VolunteerPlatform.Application.Users.Queries;

public record GetUserProfileQuery(string UserId) : IRequest<UserProfileDto>;
