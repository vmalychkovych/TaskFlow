namespace TaskFlow.Domain.Entities
{
    public class Workspace : BaseEntity
    {
            public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
    }
}
