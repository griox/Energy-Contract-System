using FluentValidation;
namespace Application.Features.Contracts.Commands.CreateContract;

public class CreateContractValidator: AbstractValidator<CreateContract>
{
    public CreateContractValidator()
    {
        // Kiểm tra FirstName
        RuleFor(p => p.FirstName)
            .NotEmpty().WithMessage("{PropertyName} is required.")
            .NotNull()
            .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.");

        // Kiểm tra LastName
        RuleFor(p => p.LastName)
            .NotEmpty().WithMessage("{PropertyName} is required.");

        // Kiểm tra Email
        RuleFor(p => p.Email)
            .NotEmpty().WithMessage("{PropertyName} is required.")
            .EmailAddress().WithMessage("A valid email address is required.");
        // Kiểm tra số điên thoại
        RuleFor(p => p.Phone)
            .NotEmpty().WithMessage("{PropertyName} is required.");

        // Kiểm tra Logic nghiệp vụ: Ngày kết thúc phải lớn hơn ngày bắt đầu
        RuleFor(p => p.EndDate)
            .GreaterThan(p => p.StartDate).WithMessage("{PropertyName} must be after {ComparisonValue}.");
    }
}