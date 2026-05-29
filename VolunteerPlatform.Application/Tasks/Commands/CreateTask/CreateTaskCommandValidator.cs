using FluentValidation;

namespace VolunteerPlatform.Application.Tasks.Commands.CreateTask;

public class CreateTaskCommandValidator : AbstractValidator<CreateTaskCommand>
{
    public CreateTaskCommandValidator()
    {
        RuleFor(x => x.InitiativeId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.CreatedById).NotEmpty();
        RuleFor(x => x.Deadline)
            .GreaterThanOrEqualTo(DateTime.UtcNow.Date)
            .When(x => x.Deadline.HasValue)
            .WithMessage("Deadline must be today or in the future.");
    }
}
