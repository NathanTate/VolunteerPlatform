using MediatR;
using VolunteerPlatform.Application.Common.Models;

namespace VolunteerPlatform.Application.Users.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken, string IpAddress) : IRequest<AuthenticationResult>;
