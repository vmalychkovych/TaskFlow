using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProjectMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectMembers_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMembers_ProjectId_UserId",
                table: "ProjectMembers",
                columns: new[] { "ProjectId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMembers_UserId",
                table: "ProjectMembers",
                column: "UserId");

            migrationBuilder.Sql("""
                INSERT INTO "ProjectMembers" ("Id", "ProjectId", "UserId", "Role", "Status", "AddedAt")
                SELECT
                    CAST(
                        substr(md5(CAST(p."Id" AS text) || ':' || wm."UserId"), 1, 8) || '-' ||
                        substr(md5(CAST(p."Id" AS text) || ':' || wm."UserId"), 9, 4) || '-' ||
                        substr(md5(CAST(p."Id" AS text) || ':' || wm."UserId"), 13, 4) || '-' ||
                        substr(md5(CAST(p."Id" AS text) || ':' || wm."UserId"), 17, 4) || '-' ||
                        substr(md5(CAST(p."Id" AS text) || ':' || wm."UserId"), 21, 12)
                        AS uuid),
                    p."Id",
                    wm."UserId",
                    CASE
                        WHEN wm."Role" IN (1, 2) THEN 1
                        ELSE 2
                    END,
                    2,
                    CURRENT_TIMESTAMP
                FROM "Projects" p
                INNER JOIN "WorkspaceMembers" wm ON wm."WorkspaceId" = p."WorkspaceId"
                WHERE wm."Status" = 2;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectMembers");
        }
    }
}
