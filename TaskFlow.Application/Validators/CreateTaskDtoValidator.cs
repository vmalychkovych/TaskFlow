using FluentValidation;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Validators
{
    public class CreateTaskDtoValidator : AbstractValidator<CreateTaskDto>
    {
        public CreateTaskDtoValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required.")
                .MinimumLength(3).WithMessage("Title must be at least 3 characters.");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description is required.")
                .MinimumLength(5).WithMessage("Description must be at least 5 characters.");

            RuleFor(x => x.ProjectId)
                .NotEmpty().WithMessage("ProjectId is required.");
        }
    }
}
