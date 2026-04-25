
using AutoMapper;
using TaskFlow.Application.DTOs;
using TaskFlow.Domain.Entities;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace TaskFlow.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Workspace, WorkspaceDto>();
            CreateMap<CreateWorkspaceDto, Workspace>();
            CreateMap<UpdateWorkspaceDto, Workspace>();

            CreateMap<Project, ProjectDto>();
            CreateMap<CreateProjectDto, Project>();
            CreateMap<UpdateProjectDto, Project>();

            CreateMap<TaskItem, TaskDto>()
                .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<CreateTaskDto, TaskItem>();
            CreateMap<UpdateTaskDto, TaskItem>();
        }
    }
}
