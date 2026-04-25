using Microsoft.AspNetCore.Mvc;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;

namespace TaskFlow.WebAPI.Controllers
{
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
            await _workspaceService.CreateWorkspaceAsync(dto);
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var workspaces = await _workspaceService.GetAllWorkspacesAsync();

            return Ok(workspaces);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var workspace = await _workspaceService.GetWorkspaceByIdAsync(id);

            if (workspace == null)
            {
                return NotFound();
            }

            return Ok(workspace);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateWorkspaceDto dto)
        {
            var result = await _workspaceService.UpdateWorkspaceAsync(id, dto);

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _workspaceService.DeleteWorkspaceAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetDetails(Guid id)
        {
            var workspace = await _workspaceService.GetWorkspaceWithDetailsByIdAsync(id);

            if (workspace == null)
            {
                return NotFound();
            }

            return Ok(workspace);
        }
    }
}
