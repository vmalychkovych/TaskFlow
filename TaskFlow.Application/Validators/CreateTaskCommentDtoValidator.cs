using FluentValidation;
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Validators
{
    public class CreateTaskCommentDtoValidator : AbstractValidator<CreateTaskCommentDto>
    {
        public CreateTaskCommentDtoValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Content is required.")
                .MinimumLength(2).WithMessage("Content must be at least 2 characters.")
                .MaximumLength(1000).WithMessage("Content must be less than 1000 characters.");

            RuleFor(x => x.TaskItemId)
                .NotEmpty().WithMessage("TaskItemId is required.");
        }
    }
}
