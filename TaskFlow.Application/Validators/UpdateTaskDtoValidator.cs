using FluentValidation;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Validators
{
    public class UpdateTaskDtoValidator : AbstractValidator<UpdateTaskDto>
    {
        public UpdateTaskDtoValidator() 
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MinimumLength(3).WithMessage("Title must be at least 3 characters.");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description is required.")
                .MinimumLength(5).WithMessage("Description must be at least 5 characters.");

            RuleFor(x => x.Priority)
                .IsInEnum().WithMessage("Priority must be a valid value.");

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Status must be a valid value.");

        }
    }
}
