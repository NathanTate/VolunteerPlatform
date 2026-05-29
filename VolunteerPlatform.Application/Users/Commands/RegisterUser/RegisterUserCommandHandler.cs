using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using VolunteerPlatform.Application.Common.Exceptions;
using VolunteerPlatform.Application.Common.Interfaces;
using VolunteerPlatform.Application.Common.Models;
using VolunteerPlatform.Domain.Entities;
using VolunteerPlatform.Domain.Enums;

namespace VolunteerPlatform.Application.Users.Commands.RegisterUser;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, AuthenticationResult>
{
  private readonly UserManager<User> _userManager;
  private readonly ITokenService _tokenService;

  public RegisterUserCommandHandler(UserManager<User> userManager, ITokenService tokenService)
  {
    _userManager = userManager;
    _tokenService = tokenService;
  }

  public async Task<AuthenticationResult> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
  {
    var user = new User
    {
      UserName = request.Email,
      Email = request.Email,
      FirstName = request.FirstName,
      LastName = request.LastName,
      Role = UserRole.Guest,
      OrganizationName = request.OrganizationName,
      IsOrganizationApproved = false,
      CreatedAt = DateTime.UtcNow
    };

    var result = await _userManager.CreateAsync(user, request.Password);
    if (!result.Succeeded)
    {
      var errors = result.Errors
          .GroupBy(e => e.Code)
          .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());

      throw new ValidationFailureException(errors);
    }

    return await _tokenService.GenerateAuthenticationResultAsync(user, request.IpAddress);
  }
}
