using MediatR;
using VolunteerPlatform.Application.Common.Models;

namespace VolunteerPlatform.Application.Users.Commands.LoginUser;

public record LoginUserCommand(
    string Email,
    string Password,
    string IpAddress
) : IRequest<AuthenticationResult>;
