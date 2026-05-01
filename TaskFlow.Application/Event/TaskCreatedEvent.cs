using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskFlow.Application.Event
{
    public class TaskCreatedEvent
    {
        public Guid TaskId { get; set; }
        public string Title { get; set; } = null!;
        public string UserId { get; set; } = null!;
    }
}
