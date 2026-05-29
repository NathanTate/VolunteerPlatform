using FluentValidation;

namespace VolunteerPlatform.Application.Initiatives.Commands.TriggerEmergencyAlert;

public class TriggerEmergencyAlertCommandValidator
    : AbstractValidator<TriggerEmergencyAlertCommand>
{
    public TriggerEmergencyAlertCommandValidator()
    {
        RuleFor(x => x.InitiativeId)
            .NotEmpty().WithMessage("InitiativeId is required.");

        RuleFor(x => x.RequestingUserId)
            .NotEmpty().WithMessage("RequestingUserId is required.");

        RuleFor(x => x.CustomMessage)
            .MaximumLength(500).WithMessage("Custom message must not exceed 500 characters.")
            .When(x => x.CustomMessage is not null);
    }
}
