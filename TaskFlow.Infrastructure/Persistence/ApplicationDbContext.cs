using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Persistence
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
            {
            }

        public DbSet<Workspace> Workspaces { get; set; }
        public DbSet<WorkspaceMember> WorkspaceMembers { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<TaskAttachment> TaskAttachments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Project>()
                .HasMany(p => p.Tasks)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Project>()
                .HasMany(project => project.Members)
                .WithOne(member => member.Project)
                .HasForeignKey(member => member.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Workspace>()
                .HasMany(w => w.Projects)
                .WithOne(p => p.Workspace)
                .HasForeignKey(p => p.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Workspace>()
                .HasMany(workspace => workspace.Members)
                .WithOne(member => member.Workspace)
                .HasForeignKey(member => member.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(user => user.Workspaces)
                .WithOne(workspace => workspace.Owner)
                .HasForeignKey(workspace => workspace.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(user => user.WorkspaceMemberships)
                .WithOne(member => member.User)
                .HasForeignKey(member => member.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(user => user.ProjectMemberships)
                .WithOne(member => member.User)
                .HasForeignKey(member => member.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkspaceMember>()
                .HasIndex(member => new { member.WorkspaceId, member.UserId })
                .IsUnique();

            modelBuilder.Entity<ProjectMember>()
                .HasIndex(member => new { member.ProjectId, member.UserId })
                .IsUnique();

            modelBuilder.Entity<TaskItem>()
                .HasMany(task => task.Comments)
                .WithOne(comment => comment.TaskItem)
                .HasForeignKey(comment => comment.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(user => user.Comments)
                .WithOne(comment => comment.Author)
                .HasForeignKey(comment => comment.AuthorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskItem>()
                .HasMany(task => task.Attachments)
                .WithOne(attachment => attachment.TaskItem)
                .HasForeignKey(attachment => attachment.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(user => user.Attachments)
                .WithOne(attachment => attachment.UploadedBy)
                .HasForeignKey(attachment => attachment.UploadedById)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(user => user.AssignedTasks)
                .WithOne(task => task.AssigneeUser)
                .HasForeignKey(task => task.AssigneeUserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
