import { ChatSession, Message, User, UploadedFile } from "../types";

export const MAIN_API_BASE = "https://igris-api-production.up.railway.app";
const MAIN_API_URL = MAIN_API_BASE.replace(/\/$/, "");
const FILE_API_BASE = "https://igris-file-intelligence-api.onrender.com";
const API_URL_KEY = "igris_api_url";
const TOKEN_KEYS = ["access_token", "igris_token"];
const SESSIONS_KEY = "igris_sessions_v1";

interface DiagState {
  currentUrl: string;
  tokenPresent: boolean;
  lastRequest: string;
  lastResponse: string;
}

export let apiDiagnostics: DiagState = {
  currentUrl: MAIN_API_BASE,
  tokenPresent: false,
  lastRequest: "None",
  lastResponse: "None",
};

type DiagListener = (d: DiagState) => void;
const diagListeners = new Set<DiagListener>();

export function subscribeToDiagnostics(listener: DiagListener) {
  diagListeners.add(listener);
  listener({ ...apiDiagnostics });
  return () => diagListeners.delete(listener);
}

function updateDiagnostics(updates: Partial<DiagState>) {
  apiDiagnostics = { ...apiDiagnostics, ...updates };
  diagListeners.forEach((l) => l({ ...apiDiagnostics }));
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getStoredApiUrl(): string {
  const v = localStorage.getItem(API_URL_KEY);
  if (v === MAIN_API_BASE) return v;
  localStorage.setItem(API_URL_KEY, MAIN_API_BASE);
  return MAIN_API_BASE;
}

export function setStoredApiUrl(_url: string) {
  localStorage.setItem(API_URL_KEY, MAIN_API_BASE);
  updateDiagnostics({ currentUrl: MAIN_API_BASE });
}

export function getStoredToken(): string | null {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export function setStoredToken(token: string, rememberMe: boolean = true) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEYS[0], token);
    localStorage.setItem(TOKEN_KEYS[1], token);
    sessionStorage.removeItem(TOKEN_KEYS[0]);
    sessionStorage.removeItem(TOKEN_KEYS[1]);
  } else {
    sessionStorage.setItem(TOKEN_KEYS[0], token);
    sessionStorage.setItem(TOKEN_KEYS[1], token);
    localStorage.removeItem(TOKEN_KEYS[0]);
    localStorage.removeItem(TOKEN_KEYS[1]);
  }
  updateDiagnostics({ tokenPresent: !!token });
}

export function clearStoredToken() {
  TOKEN_KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
  updateDiagnostics({ tokenPresent: false });
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem("igris_user") || sessionStorage.getItem("igris_user");
  const token = getStoredToken();
  if (!token) return null;
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed) {
        parsed.token = token;
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return { username: "MONARCH", email: "user@example.com", token };
}

export function setStoredUser(user: User, rememberMe: boolean = true) {
  if (rememberMe) {
    localStorage.setItem("igris_user", JSON.stringify(user));
    sessionStorage.removeItem("igris_user");
    if (user.token) setStoredToken(user.token, true);
  } else {
    sessionStorage.setItem("igris_user", JSON.stringify(user));
    localStorage.removeItem("igris_user");
    if (user.token) setStoredToken(user.token, false);
  }
}

function buildAuthHeaders(token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function checkServerStatus(baseUrl: string): Promise<boolean> {
  try {
    const url = baseUrl || MAIN_API_BASE;
    const res = await fetch(`${url.replace(/\/$/, "")}/`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerUser(_baseUrl: string, payload: any): Promise<boolean> {
  const res = await fetch(`${MAIN_API_URL}/auth/register`, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errMsg = "Registration failed";
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        errMsg = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
      } else if (typeof errorData.detail === "string") {
        errMsg = errorData.detail;
      } else {
        errMsg = errorData.detail.msg || JSON.stringify(errorData.detail);
      }
    }
    throw new Error(errMsg);
  }
  return true;
}

export async function loginUser(_baseUrl: string, payload: any): Promise<{ access_token: string }> {
  const res = await fetch(`${MAIN_API_URL}/auth/login`, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let errMsg = "Login invalid credentials";
    if (errorData.detail) {
      if (typeof errorData.detail === "string") {
        errMsg = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errMsg = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
      } else {
        errMsg = errorData.detail.msg || JSON.stringify(errorData.detail);
      }
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function fetchSessions(_baseUrl: string, token: string): Promise<ChatSession[]> {
  const res = await fetch(`${MAIN_API_URL}/sessions`, {
    method: "GET",
    headers: buildAuthHeaders(token),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to load sessions from server");
  }
  return res.json();
}

export async function createSessionOnServer(_baseUrl: string, token: string): Promise<ChatSession> {
  const res = await fetch(`${MAIN_API_URL}/sessions`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify({ title: "New Chat" }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to create session on server");
  }
  return res.json();
}

export async function renameSessionOnServer(_baseUrl: string, token: string, sessionId: number, title: string): Promise<ChatSession> {
  const res = await fetch(`${MAIN_API_URL}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: buildAuthHeaders(token),
    body: JSON.stringify({ title }),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to rename session");
  }
  return res.json();
}

export async function deleteSessionFromServer(_baseUrl: string, token: string, sessionId: number): Promise<boolean> {
  const res = await fetch(`${MAIN_API_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete session from server");
  }
  return true;
}

export async function fetchSessionMessagesFromServer(_baseUrl: string, _token: string, sessionId: number): Promise<Message[]> {
  try {
    const raw = localStorage.getItem(`igris_msgs_${sessionId}`) || "[]";
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

export async function analyzeFile(file: File): Promise<any> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${FILE_API_BASE}/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`External analyze failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function analyzeFiles(files: File[]): Promise<any[]> {
  if (files.length === 0) return [];
  const form = new FormData();
  files.forEach((f) => form.append("file", f));
  const res = await fetch(`${FILE_API_BASE}/analyze/batch`, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`External analyze batch failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function postChatMessage(
  baseUrl: string,
  token: string,
  sessionId: number,
  message: string,
  files?: UploadedFile[],
  signal?: AbortSignal  // <-- ADD THIS
): Promise<{ response: string; session_id?: number }> {
  const msgsRaw = localStorage.getItem(`igris_msgs_${sessionId}`) || "[]";
  const msgs: Message[] = JSON.parse(msgsRaw);

  const formattedFiles = files?.map((f) => ({
    name: f.fileName,
    type: f.fileType === "docx" ? "doc" : f.fileType === "txt" ? "text" : f.fileType,
    file_type: f.fileType,
    summary: f.analysis?.summary || f.analysis?.description || "",
    analysis: f.analysis || null,
  })) || [];

  const payload: any = {
    message,
    session_id: sessionId,
  };

  if (formattedFiles.length > 0) {
    payload.files = formattedFiles;
  }

  const res = await fetch(`${MAIN_API_URL}/chat`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload),
    signal,  // <-- ADD THIS
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Chat service returned an error");
  }

  const responseData = await res.json();
  const assistantText =
    typeof responseData === "string"
      ? responseData
      : responseData.response || responseData.message || responseData.result || responseData.data || JSON.stringify(responseData);

  const userMsg: Message = {
    id: `user-${Date.now()}`,
    role: "user",
    content: message,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  const botMsg: Message = {
    id: `bot-${Date.now() + 1}`,
    role: "assistant",
    content: assistantText,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  const updated = [...msgs, userMsg, botMsg];
  localStorage.setItem(`igris_msgs_${sessionId}`, JSON.stringify(updated));

  return { response: assistantText, session_id: sessionId };
}