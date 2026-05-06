using FluentValidation;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Validators
{
    public class AddWorkspaceMemberDtoValidator : AbstractValidator<AddWorkspaceMemberDto>
    {
        public AddWorkspaceMemberDtoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId is required.");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Role must be a valid value.");
        }
    }
}
