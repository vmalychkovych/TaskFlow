using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskFlow.Application.DTOs;
using TaskFlow.Application.Interfaces;
using TaskFlow.Application.Services;

namespace TaskFlow.WebAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectsController(IProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateProjectDto dto)
        {
            await _projectService.CreateProjectAsync(dto, GetUserId());
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var projects = await _projectService.GetAllProjectsAsync(GetUserId());

            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var project = await _projectService.GetProjectByIdAsync(id, GetUserId());

            if (project == null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateProjectDto dto)
        {
            var result = await _projectService.UpdateProjectAsync(id, dto, GetUserId());

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _projectService.DeleteProjectAsync(id, GetUserId());
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetDetails(Guid id)
        {
            var project = await _projectService.GetProjectDetailsAsync(id, GetUserId());

            if (project == null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        }
    }
}
