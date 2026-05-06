using FluentValidation;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Validators
{
    public class ConfigureProjectDiscordDtoValidator : AbstractValidator<ConfigureProjectDiscordDto>
    {
        public ConfigureProjectDiscordDtoValidator()
        {
            RuleFor(x => x.WebhookUrl)
                .NotEmpty().WithMessage("WebhookUrl is required.")
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .WithMessage("WebhookUrl must be a valid absolute URL.");
        }
    }
}
