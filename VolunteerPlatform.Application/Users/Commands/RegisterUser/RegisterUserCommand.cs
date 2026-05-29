using MediatR;
using VolunteerPlatform.Application.Common.Models;

namespace VolunteerPlatform.Application.Users.Commands.RegisterUser;

public record RegisterUserCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? OrganizationName,
    string IpAddress
) : IRequest<AuthenticationResult>;
