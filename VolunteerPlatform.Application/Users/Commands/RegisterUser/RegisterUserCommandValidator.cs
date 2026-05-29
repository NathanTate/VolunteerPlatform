using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VolunteerPlatform.Application.Common.Interfaces;

namespace VolunteerPlatform.Application.Users.Commands.RegisterUser;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
  public RegisterUserCommandValidator(IApplicationDbContext context)
  {
    RuleFor(x => x.FirstName)
        .NotEmpty().WithMessage("First name is required.");

    RuleFor(x => x.LastName)
        .NotEmpty().WithMessage("Last name is required.");

    RuleFor(x => x.Email)
        .NotEmpty().WithMessage("Email is required.")
        .EmailAddress().WithMessage("A valid email address is required.")
        .MustAsync(async (email, ct) =>
            !await context.Users.AnyAsync(u => u.Email == email, ct))
        .WithMessage("This email is already registered.");

    RuleFor(x => x.Password)
        .NotEmpty().WithMessage("Password is required.")
        .MinimumLength(6).WithMessage("Password must be at least 6 characters.");
  }
}
