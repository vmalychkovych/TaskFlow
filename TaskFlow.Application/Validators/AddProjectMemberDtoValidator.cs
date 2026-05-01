using FluentValidation;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Validators
{
    public class AddProjectMemberDtoValidator : AbstractValidator<AddProjectMemberDto>
    {
        public AddProjectMemberDtoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId is required.");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Role must be a valid value.");
        }
    }
}
