using MediatR;
using Microsoft.AspNetCore.Identity;
using VolunteerPlatform.Application.Common.Exceptions;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Domain.Entities;

namespace VolunteerPlatform.Application.Users.Commands.LoginUser;

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, AuthenticationResult>
{
  private readonly UserManager<User> _userManager;
  private readonly ITokenService _tokenService;

  public LoginUserCommandHandler(UserManager<User> userManager, ITokenService tokenService)
  {
    _userManager = userManager;
    _tokenService = tokenService;
  }

  public async Task<AuthenticationResult> Handle(LoginUserCommand request, CancellationToken cancellationToken)
  {
    var user = await _userManager.FindByEmailAsync(request.Email);
    if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
    {
      throw new VolunteerPlatform.Application.Common.Exceptions.UnauthorizedAccessException("Invalid email or password.");
    }

    return await _tokenService.GenerateAuthenticationResultAsync(user, request.IpAddress);
  }
}
