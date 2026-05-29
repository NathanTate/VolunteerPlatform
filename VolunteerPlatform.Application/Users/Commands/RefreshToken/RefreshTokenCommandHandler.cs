using MediatR;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Common.Models;

namespace VolunteerPlatform.Application.Users.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthenticationResult>
{
  private readonly ITokenService _tokenService;

  public RefreshTokenCommandHandler(ITokenService tokenService) => _tokenService = tokenService;

  public Task<AuthenticationResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
      => _tokenService.RefreshAccessTokenAsync(request.RefreshToken, request.IpAddress);
}
