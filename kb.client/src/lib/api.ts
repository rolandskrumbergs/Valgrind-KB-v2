// API types matching backend ViewModels

export interface Organization {
  id: string;
  name: string;
  contactInfo: string | null;
  invoiceInfo: string | null;
  maxSeats: number;
  isActive: boolean;
  assignedSeats: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  userId: string | null;
  isActive: boolean;
  activatedAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  maxSeats: number;
  contactInfo?: string;
  invoiceInfo?: string;
}

export interface UpdateOrganizationRequest {
  name: string;
  maxSeats: number;
  contactInfo?: string;
  invoiceInfo?: string;
  isActive: boolean;
}

export interface CreateSeatsRequest {
  organizationId: string;
  count: number;
}

export interface AssignSubscriptionRequest {
  organizationId: string;
  subscriptionId: string;
  userId: string;
}

// AI types

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  aiProfileId: string | null;
  createdAt: string;
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  role: string;
  content: string | null;
  createdAt: string;
}

export interface ChatStreamEvent {
  type: "token" | "tool_call" | "done" | "error";
  content?: string;
  toolName?: string;
  messageId?: string;
  error?: string;
}

export interface AiProfile {
  id: string;
  name: string;
  isActive: boolean;
  knowledgeBaseId: string;
  model: string;
  topK: number;
  minRelevanceThreshold: number;
  minRelevanceChunksRequired: number;
  highConfidenceThreshold: number;
  highConfidenceChunksRequired: number;
  createdAt: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  blobContainerName: string;
  searchIndexPrefix: string;
  createdAt: string;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  category: string;
  blobPath: string;
  chunkingPreset: string | null;
  processingStatus: string;
  processingProgress: string | null;
  errorMessage: string | null;
  totalChunks: number;
  indexedChunks: number;
  failedChunks: number;
  createdAt: string;
}

export interface ConversationStarter {
  id: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Generic API helper

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });

    if (response.status === 204) {
      return { data: undefined };
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body?.detail || body?.title || `Request failed (${response.status})`;
      return { error: message };
    }

    const data = await response.json();
    return { data };
  } catch {
    return { error: "Network error. Please try again." };
  }
}

// Organization API

export const organizationApi = {
  getAll: () => apiFetch<Organization[]>("/api/organizations"),

  getById: (id: string) => apiFetch<Organization>(`/api/organizations/${id}`),

  create: (req: CreateOrganizationRequest) =>
    apiFetch<Organization>("/api/organizations", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  update: (id: string, req: UpdateOrganizationRequest) =>
    apiFetch<Organization>(`/api/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/organizations/${id}`, { method: "DELETE" }),
};

// Subscription API

export const subscriptionApi = {
  getByOrganization: (orgId: string) =>
    apiFetch<Subscription[]>(
      `/api/organizations/${orgId}/subscriptions`
    ),

  createSeats: (orgId: string, count: number) =>
    apiFetch<Subscription[]>(
      `/api/organizations/${orgId}/subscriptions`,
      {
        method: "POST",
        body: JSON.stringify({ organizationId: orgId, count }),
      }
    ),

  assign: (orgId: string, subId: string, userId: string) =>
    apiFetch<Subscription>(
      `/api/organizations/${orgId}/subscriptions/${subId}/assign`,
      {
        method: "PUT",
        body: JSON.stringify({
          organizationId: orgId,
          subscriptionId: subId,
          userId,
        }),
      }
    ),

  unassign: (orgId: string, subId: string) =>
    apiFetch<Subscription>(
      `/api/organizations/${orgId}/subscriptions/${subId}/unassign`,
      {
        method: "PUT",
        body: JSON.stringify({
          organizationId: orgId,
          subscriptionId: subId,
        }),
      }
    ),

  delete: (orgId: string, subId: string) =>
    apiFetch<void>(
      `/api/organizations/${orgId}/subscriptions/${subId}`,
      { method: "DELETE" }
    ),
};

// Conversation API

export const conversationApi = {
  getAll: () => apiFetch<Conversation[]>("/api/conversations"),

  getById: (id: string) =>
    apiFetch<Conversation>(`/api/conversations/${id}`),

  create: (aiProfileId?: string, title?: string) =>
    apiFetch<Conversation>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ aiProfileId, title }),
    }),

  sendMessage: async function* (
    conversationId: string,
    content: string,
    signal?: AbortSignal
  ): AsyncGenerator<ChatStreamEvent> {
    const response = await fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal,
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      yield {
        type: "error",
        error: body?.detail || body?.title || `Request failed (${response.status})`,
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") return;
        try {
          yield JSON.parse(payload) as ChatStreamEvent;
        } catch {
          // skip malformed events
        }
      }
    }
  },

  addFeedback: (conversationId: string, messageId: string, isPositive: boolean) =>
    apiFetch<void>(
      `/api/conversations/${conversationId}/messages/${messageId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({ isPositive }),
      }
    ),
};

// AI Profile API

export const aiProfileApi = {
  getAll: () => apiFetch<AiProfile[]>("/api/ai-profiles"),

  getById: (id: string) => apiFetch<AiProfile>(`/api/ai-profiles/${id}`),

  create: (req: Omit<AiProfile, "id" | "isActive" | "createdAt">) =>
    apiFetch<AiProfile>("/api/ai-profiles", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  update: (id: string, req: Omit<AiProfile, "id" | "isActive" | "createdAt">) =>
    apiFetch<AiProfile>(`/api/ai-profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    }),

  activate: (id: string, isActive: boolean) =>
    apiFetch<void>(`/api/ai-profiles/${id}/activate`, {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/ai-profiles/${id}`, { method: "DELETE" }),
};

// Knowledge Base API

export const knowledgeBaseApi = {
  getAll: () => apiFetch<KnowledgeBase[]>("/api/knowledge-bases"),

  getById: (id: string) =>
    apiFetch<KnowledgeBase>(`/api/knowledge-bases/${id}`),

  create: (req: { name: string; slug: string; description?: string }) =>
    apiFetch<KnowledgeBase>("/api/knowledge-bases", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  update: (id: string, req: { name: string; description?: string; isActive: boolean }) =>
    apiFetch<KnowledgeBase>(`/api/knowledge-bases/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/knowledge-bases/${id}`, { method: "DELETE" }),
};

// Document API

export const documentApi = {
  getAll: (knowledgeBaseId: string) =>
    apiFetch<Document[]>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents`
    ),

  upload: async (
    knowledgeBaseId: string,
    file: File,
    category: string,
    chunkingPreset?: string
  ): Promise<{ data?: Document; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams({ category });
      if (chunkingPreset) params.set("chunkingPreset", chunkingPreset);

      const response = await fetch(
        `/api/knowledge-bases/${knowledgeBaseId}/documents?${params}`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        return {
          error: body?.detail || body?.title || `Upload failed (${response.status})`,
        };
      }

      const data = await response.json();
      return { data };
    } catch {
      return { error: "Network error during upload." };
    }
  },

  reprocess: (knowledgeBaseId: string, documentId: string) =>
    apiFetch<Document>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/reprocess`,
      { method: "POST" }
    ),

  delete: (knowledgeBaseId: string, documentId: string) =>
    apiFetch<void>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
      { method: "DELETE" }
    ),
};

// Conversation Starter API

export const conversationStarterApi = {
  getAll: () =>
    apiFetch<ConversationStarter[]>("/api/conversation-starters"),

  bulkReplace: (starters: { text: string; sortOrder: number; isActive: boolean }[]) =>
    apiFetch<ConversationStarter[]>("/api/conversation-starters", {
      method: "PUT",
      body: JSON.stringify({ starters }),
    }),
};
