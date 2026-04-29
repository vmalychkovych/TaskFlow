
using TaskFlow.Application.DTOs;

namespace TaskFlow.Application.Interfaces
{
    public interface IAuthService
    {
        Task RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<CurrentUserDto> GetCurrentUserAsync(string userId);
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(string userId);
    }
}
