export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  email: string;
  userId: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type CurrentUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type Workspace = {
  id: string;
  name: string;
  description: string;
};

export type CreateWorkspaceRequest = {
  name: string;
  description: string;
};

export type UpdateWorkspaceRequest = CreateWorkspaceRequest;

export type WorkspaceDetails = Workspace & {
  projects: ProjectDetails[];
};

export type WorkspaceMember = {
  userId: string;
  role: string | number;
  status: string | number;
  joinedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
};

export type CreateProjectRequest = {
  name: string;
  description: string;
  workspaceId: string;
};

export type UpdateProjectRequest = {
  name: string;
  description: string;
};

export type ProjectDetails = Project & {
  tasks: TaskItem[];
};

export type ProjectMember = {
  userId: string;
  role: string | number;
  status: string | number;
  addedAt: string;
};

export type ProjectDiscordIntegration = {
  projectId: string;
  webhookUrl: string;
  isEnabled: boolean;
  updatedAt: string;
};

export type ConfigureProjectDiscordRequest = {
  webhookUrl: string;
  isEnabled: boolean;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  priority: string;
  status: string;
  assigneeUserId: string | null;
};

export type CreateTaskRequest = {
  title: string;
  description: string;
  projectId: string;
  assigneeUserId?: string | null;
};

export type UpdateTaskRequest = {
  title: string;
  description: string;
  priority: string;
  status: string;
  assigneeUserId?: string | null;
};

export type TaskComment = {
  id: string;
  content: string;
  taskItemId: string;
  authorId: string;
  authorEmail: string;
  createdAt: string;
};

export type CreateTaskCommentRequest = {
  content: string;
  taskItemId: string;
};

export type TaskAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  taskItemId: string;
  uploadedById: string;
  uploadedAt: string;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type TaskQueryParams = {
  page?: number;
  pageSize?: number;
  projectId?: string;
  priority?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
