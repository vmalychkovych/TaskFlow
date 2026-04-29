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
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateTaskDto dto)
        {
            await _taskService.CreateTaskAsync(dto, GetUserId());
            return Ok();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] TaskQuery query)
        {
            var result = await _taskService.GetTasksAsync(query, GetUserId());
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var task = await _taskService.GetTaskByIdAsync(id, GetUserId());

            if (task == null)
            {
                return NotFound();
            }

            return Ok(task);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, UpdateTaskDto dto)
        {
            var result = await _taskService.UpdateTaskAsync(id, dto, GetUserId());

            if (!result)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _taskService.DeleteTaskAsync(id, GetUserId());
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
