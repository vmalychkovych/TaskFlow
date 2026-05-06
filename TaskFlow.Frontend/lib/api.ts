import type {
  AuthResponse,
  ConfigureProjectDiscordRequest,
  CreateProjectRequest,
  CreateTaskCommentRequest,
  CreateTaskRequest,
  CreateWorkspaceRequest,
  CurrentUser,
  LoginRequest,
  PagedResult,
  Project,
  ProjectDetails,
  ProjectDiscordIntegration,
  ProjectMember,
  RegisterRequest,
  TaskAttachment,
  TaskComment,
  TaskItem,
  TaskQueryParams,
  UpdateProjectRequest,
  UpdateTaskRequest,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceDetails,
  WorkspaceMember,
} from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:5240/api";

type RequestOptions = RequestInit & {
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body = options.body;

  if (!(body instanceof FormData) && body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response) {
  const fallback = `Request failed with status ${response.status}.`;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as {
        detail?: string;
        errors?: Record<string, string[]>;
        message?: string;
        title?: string;
      };

      if (data.errors) {
        const firstErrorGroup = Object.values(data.errors)[0];
        if (firstErrorGroup?.[0]) {
          return firstErrorGroup[0];
        }
      }

      return data.detail || data.message || data.title || fallback;
    } catch {
      return fallback;
    }
  }

  try {
    const text = await response.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

function buildQueryString(query?: TaskQueryParams) {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const built = searchParams.toString();
  return built ? `?${built}` : "";
}

export function register(payload: RegisterRequest) {
  return request<{ message: string }>("/Auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginRequest) {
  return request<AuthResponse>("/Auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout(token: string) {
  return request<void>("/Auth/logout", {
    method: "POST",
    token,
  });
}

export function getCurrentUser(token: string) {
  return request<CurrentUser>("/Auth/me", { token });
}

export function getWorkspaces(session: AuthResponse) {
  return request<Workspace[]>("/Workspaces", {
    token: session.accessToken,
  });
}

export function getWorkspaceDetails(session: AuthResponse, workspaceId: string) {
  return request<WorkspaceDetails>(`/Workspaces/${workspaceId}/details`, {
    token: session.accessToken,
  });
}

export function createWorkspace(
  session: AuthResponse,
  payload: CreateWorkspaceRequest,
) {
  return request<void>("/Workspaces", {
    method: "POST",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateWorkspace(
  session: AuthResponse,
  workspaceId: string,
  payload: UpdateWorkspaceRequest,
) {
  return request<void>(`/Workspaces/${workspaceId}`, {
    method: "PUT",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function deleteWorkspace(session: AuthResponse, workspaceId: string) {
  return request<void>(`/Workspaces/${workspaceId}`, {
    method: "DELETE",
    token: session.accessToken,
  });
}

export function getWorkspaceMembers(
  session: AuthResponse,
  workspaceId: string,
) {
  return request<WorkspaceMember[]>(`/Workspaces/${workspaceId}/members`, {
    token: session.accessToken,
  });
}

export function addWorkspaceMember(
  session: AuthResponse,
  workspaceId: string,
  payload: { userId: string; role: number },
) {
  return request<void>(`/Workspaces/${workspaceId}/members`, {
    method: "POST",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function removeWorkspaceMember(
  session: AuthResponse,
  workspaceId: string,
  memberUserId: string,
) {
  return request<void>(`/Workspaces/${workspaceId}/members/${memberUserId}`, {
    method: "DELETE",
    token: session.accessToken,
  });
}

export function getProjects(session: AuthResponse) {
  return request<Project[]>("/Projects", {
    token: session.accessToken,
  });
}

export function getProjectDetails(session: AuthResponse, projectId: string) {
  return request<ProjectDetails>(`/Projects/${projectId}/details`, {
    token: session.accessToken,
  });
}

export function createProject(
  session: AuthResponse,
  payload: CreateProjectRequest,
) {
  return request<void>("/Projects", {
    method: "POST",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function updateProject(
  session: AuthResponse,
  projectId: string,
  payload: UpdateProjectRequest,
) {
  return request<void>(`/Projects/${projectId}`, {
    method: "PUT",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function deleteProject(session: AuthResponse, projectId: string) {
  return request<void>(`/Projects/${projectId}`, {
    method: "DELETE",
    token: session.accessToken,
  });
}

export function getProjectMembers(session: AuthResponse, projectId: string) {
  return request<ProjectMember[]>(`/Projects/${projectId}/members`, {
    token: session.accessToken,
  });
}

export function addProjectMember(
  session: AuthResponse,
  projectId: string,
  payload: { userId: string; role: number },
) {
  return request<void>(`/Projects/${projectId}/members`, {
    method: "POST",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function removeProjectMember(
  session: AuthResponse,
  projectId: string,
  memberUserId: string,
) {
  return request<void>(`/Projects/${projectId}/members/${memberUserId}`, {
    method: "DELETE",
    token: session.accessToken,
  });
}

export function getProjectDiscordIntegration(
  session: AuthResponse,
  projectId: string,
) {
  return request<ProjectDiscordIntegration>(`/Projects/${projectId}/discord`, {
    token: session.accessToken,
  }).catch((error) => {
    if (error instanceof Error && error.message === "Resource not found.") {
      return null;
    }

    throw error;
  });
}

export function upsertProjectDiscordIntegration(
  session: AuthResponse,
  projectId: string,
  payload: ConfigureProjectDiscordRequest,
) {
  return request<ProjectDiscordIntegration>(`/Projects/${projectId}/discord`, {
    method: "PUT",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function deleteProjectDiscordIntegration(
  session: AuthResponse,
  projectId: string,
) {
  return request<void>(`/Projects/${projectId}/discord`, {
    method: "DELETE",
    token: session.accessToken,
  });
}

export async function getTasks(session: AuthResponse, query?: TaskQueryParams) {
  const data = await request<PagedResult<TaskItem>>(
    `/Tasks${buildQueryString(query)}`,
    {
      token: session.accessToken,
    },
  );

  return data.items;
}

export function getTaskById(session: AuthResponse, taskId: string) {
  return request<TaskItem>(`/Tasks/${taskId}`, {
    token: session.accessToken,
  });
}

export function createTask(
  session: AuthResponse,
  payload: CreateTaskRequest,
) {
  return request<void>("/Tasks", {
    method: "POST",
    token: session.accessToken,
    body: JSON.stringify({
      ...payload,
      assigneeUserId: payload.assigneeUserId || null,
    }),
  });
}

export function updateTask(
  session: AuthResponse,
  taskId: string,
  payload: UpdateTaskRequest,
) {
  return request<void>(`/Tasks/${taskId}`, {
    method: "PUT",
    token: session.accessToken,
    body: JSON.stringify({
      ...payload,
      assigneeUserId: payload.assigneeUserId || null,
    }),
  });
}

export function deleteTask(session: AuthResponse, taskId: string) {
  return request<void>(`/Tasks/${taskId}`, {
    method: "DELETE",
    token: session.accessToken,
  });
}

export async function getMyTasks(session: AuthResponse, query?: TaskQueryParams) {
  const data = await request<PagedResult<TaskItem>>(
    `/Tasks/my${buildQueryString(query)}`,
    {
      token: session.accessToken,
    },
  );

  return data.items;
}

export async function getUnassignedTasks(
  session: AuthResponse,
  query?: TaskQueryParams,
) {
  const data = await request<PagedResult<TaskItem>>(
    `/Tasks/unassigned${buildQueryString(query)}`,
    {
      token: session.accessToken,
    },
  );

  return data.items;
}

export function getTaskComments(session: AuthResponse, taskId: string) {
  return request<TaskComment[]>(`/task-comments/task/${taskId}`, {
    token: session.accessToken,
  });
}

export function createTaskComment(
  session: AuthResponse,
  payload: CreateTaskCommentRequest,
) {
  return request<void>("/task-comments", {
    method: "POST",
    token: session.accessToken,
    body: JSON.stringify(payload),
  });
}

export function getTaskAttachments(session: AuthResponse, taskId: string) {
  return request<TaskAttachment[]>(`/task-attachments/task/${taskId}`, {
    token: session.accessToken,
  });
}

export function uploadTaskAttachment(
  session: AuthResponse,
  taskId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  return request<TaskAttachment>(`/task-attachments/upload/${taskId}`, {
    method: "POST",
    token: session.accessToken,
    body: formData,
  });
}
