using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.WebAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkspacesController : ControllerBase
    {
        private readonly IWorkspaceService _workspaceService;

        public WorkspacesController(IWorkspaceService workspaceService)
        {
            _workspaceService = workspaceService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateWorkspaceDto dto)
        {
            await _workspaceService.CreateWorkspaceAsync(dto, GetUserId());
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var workspaces = await _workspaceService.GetAllWorkspacesAsync(GetUserId());
            return Ok(workspaces);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var workspace = await _workspaceService.GetWorkspaceByIdAsync(id, GetUserId());

            if (workspace == null)
            {
                return NotFound();
            }

            return Ok(workspace);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateWorkspaceDto dto)
        {
            var result = await _workspaceService.UpdateWorkspaceAsync(id, dto, GetUserId());

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _workspaceService.DeleteWorkspaceAsync(id, GetUserId());

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetDetails(Guid id)
        {
            var workspace = await _workspaceService.GetWorkspaceDetailsAsync(id, GetUserId());

            if (workspace == null)
            {
                return NotFound();
            }

            return Ok(workspace);
        }

        [HttpGet("{id}/members")]
        public async Task<IActionResult> GetMembers(Guid id)
        {
            var members = await _workspaceService.GetWorkspaceMembersAsync(id, GetUserId());
            return Ok(members);
        }

        [HttpPost("{id}/members")]
        public async Task<IActionResult> AddMember(Guid id, AddWorkspaceMemberDto dto)
        {
            await _workspaceService.AddWorkspaceMemberAsync(id, dto, GetUserId());
            return Ok();
        }

        [HttpDelete("{id}/members/{memberUserId}")]
        public async Task<IActionResult> RemoveMember(Guid id, string memberUserId)
        {
            var result = await _workspaceService.RemoveWorkspaceMemberAsync(id, memberUserId, GetUserId());

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        }
    }
}
