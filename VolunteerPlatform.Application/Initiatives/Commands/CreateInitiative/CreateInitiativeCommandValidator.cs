using FluentValidation;

namespace VolunteerPlatform.Application.Initiatives.Commands.CreateInitiative;

public class CreateInitiativeCommandValidator : AbstractValidator<CreateInitiativeCommand>
{
    public CreateInitiativeCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180);
        // Allow today: compare date portions only (tolerates UTC offset up to UTC+14)
        RuleFor(x => x.StartDate)
            .Must(d => d.ToUniversalTime().Date >= DateTime.UtcNow.AddDays(-1).Date)
            .WithMessage("Start date cannot be more than one day in the past.");
        RuleFor(x => x.MaxParticipants).GreaterThan(0).LessThanOrEqualTo(10000);
        RuleFor(x => x.RequiredVolunteers).GreaterThanOrEqualTo(0)
            .LessThanOrEqualTo(x => x.MaxParticipants)
            .WithMessage("Required volunteers cannot exceed max participants.");
        RuleFor(x => x.Address).NotEmpty().MaximumLength(500);
        RuleFor(x => x.RadiusKm).InclusiveBetween(0.5, 100);
        RuleFor(x => x.OrganizerId).NotEmpty();
        RuleForEach(x => x.ImageUrls).NotEmpty().MaximumLength(1000);
    }
}
