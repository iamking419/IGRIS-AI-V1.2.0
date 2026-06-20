import React, { useState, useEffect, useRef } from "react";
import { 
  getStoredApiUrl, setStoredApiUrl, getStoredToken, setStoredToken, 
  clearStoredToken, getStoredUser, setStoredUser, checkServerStatus, 
  registerUser, loginUser, fetchSessions, createSessionOnServer, 
  renameSessionOnServer, deleteSessionFromServer, postChatMessage,
  subscribeToDiagnostics, fetchSessionMessagesFromServer
} from "./lib/api";
import { ChatSession, Message, User, AppConfig, UploadedFile } from "./types";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import AuthModal from "./components/AuthModal";
import SettingsModal from "./components/SettingsModal";
import AriseOverlay from "./components/AriseOverlay";
import TelegramLinkModal from "./components/TelegramLinkModal";
import { Sparkles, Terminal, Info, X } from "lucide-react";

interface CompressedMessage {
  r: "u" | "a";
  c: string;
  t: string;
}

function compressMessages(msgs: Message[]): string {
  const compact = msgs.map(m => [
    m.role === "user" ? "u" : "a",
    m.content,
    m.timestamp
  ]);
  return JSON.stringify(compact);
}

function decompressMessages(serialized: string): Message[] {
  try {
    const parsed = JSON.parse(serialized);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any, idx: number) => {
        if (Array.isArray(item)) {
          return {
            id: `msg-${idx}-${item[2] || "t"}`,
            role: item[0] === "u" ? "user" : "assistant",
            content: item[1] || "",
            timestamp: item[2] || "",
          };
        }
        return {
          id: `msg-${idx}-${item.t || "t"}`,
          role: item.r === "u" ? "user" : "assistant",
          content: item.c || "",
          timestamp: item.t || "",
        };
      });
    }
  } catch (e) {
    console.error("Decompress failed:", e);
  }
  return [];
}

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [config, setConfig] = useState<AppConfig>({
    apiBaseUrl: getStoredApiUrl(),
    themeAccent: "violet",
    systemInstructions: "You are Igris the Blood-Red Knight. Act with high loyalty.",
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  
  const [pinnedSessionIds, setPinnedSessionIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("igris_pinned_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track last activity timestamp per session for sidebar ordering
  const [sessionActivity, setSessionActivity] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem("igris_session_activity");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleTogglePinSession = (id: number) => {
    setPinnedSessionIds((prev) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter((pId) => pId !== id);
        showToast("info", "Session unpinned from tactical board.");
      } else {
        updated = [...prev, id];
        showToast("success", "Session pinned to top level dashboard.");
      }
      localStorage.setItem("igris_pinned_sessions", JSON.stringify(updated));
      return updated;
    });
  };

  const updateSessionActivity = (sessionId: number) => {
    setSessionActivity((prev) => {
      const updated = { ...prev, [sessionId]: Date.now() };
      localStorage.setItem("igris_session_activity", JSON.stringify(updated));
      return updated;
    });
  };
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAriseAnimation, setShowAriseAnimation] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState<boolean>(() => {
    return localStorage.getItem("igris_telegram_linked") === "true";
  });
  const [isSending, setIsSending] = useState(false);
  
  const sessionsRef = useRef<ChatSession[]>(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const syncQueueRef = useRef<Record<number, Message[]>>({});
  const isSyncingRef = useRef<Record<number, boolean>>({});
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("pre") ||
      target.closest("code") ||
      target.closest(".overflow-x-auto") ||
      target.closest(".scrollbar-thin") ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("a")
    ) {
      setTouchStart(null);
      return;
    }
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStart.x;
    const diffY = touch.clientY - touchStart.y;
    const swipeThreshold = 55;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > swipeThreshold) {
        if (!sidebarOpen) {
          setSidebarOpen(true);
          showToast("info", "Shadow archives unraveled via swipe.");
        }
      } else if (diffX < -swipeThreshold) {
        if (sidebarOpen) {
          setSidebarOpen(false);
        }
      }
    }
    setTouchStart(null);
  };
  
  const [serverOnline, setServerOnline] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "failed">("idle");
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const [diagnostics, setDiagnostics] = useState({
    currentUrl: config.apiBaseUrl,
    tokenPresent: !!getStoredToken(),
    lastRequest: "None",
    lastResponse: "None",
  });

  useEffect(() => {
    const unsubscribe = subscribeToDiagnostics((diag) => {
      setDiagnostics(diag);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const initAndLoad = async () => {
      const isOnline = await checkServerStatus(config.apiBaseUrl);
      setServerOnline(isOnline);
      if (!user || !user.token) {
        setSessions([]);
        setMessages([]);
        setActiveSessionId(null);
        return;
      }
      try {
        const remoteSessions = await fetchSessions(config.apiBaseUrl, user.token);
        setSessions(remoteSessions);
        const visibleSessions = remoteSessions.filter(s => !s.title.startsWith("__chunk_"));
        if (visibleSessions.length > 0) {
          if (!activeSessionId || !visibleSessions.some(s => s.id === activeSessionId)) {
            setActiveSessionId(visibleSessions[0].id);
          }
        } else {
          try {
            const sess = await createSessionOnServer(config.apiBaseUrl, user.token);
            setSessions([sess]);
            setActiveSessionId(sess.id);
            setMessages([]);
          } catch (createErr: any) {
            console.error("Could not spawn initial session:", createErr);
            showToast("error", `Could not spawn initial session: ${createErr.message}`);
            setSessions([]);
            setActiveSessionId(null);
            setMessages([]);
          }
        }
      } catch (err: any) {
        console.error("Remote session fetch failed:", err);
        showToast("error", `Session tracking alignment failed: ${err.message}`);
        setSessions([]);
        setActiveSessionId(null);
        setMessages([]);
      }
    };
    initAndLoad();
  }, [config.apiBaseUrl, user]);

  useEffect(() => {
    let active = true;
    const loadSessionMessages = async () => {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
      const localMsgsStr = localStorage.getItem(`igris_msgs_${activeSessionId}`);
      if (localMsgsStr) {
        try {
          setMessages(JSON.parse(localMsgsStr));
        } catch (err) {
          console.warn("Failed to parse cached session messages:", err);
          localStorage.removeItem(`igris_msgs_${activeSessionId}`);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
      if (!user || !user.token) return;
      const currentSessions = sessionsRef.current;
      const chunks = currentSessions.filter(s => s.title.startsWith(`__chunk_${activeSessionId}_`));
      if (chunks.length > 0) {
        const sortedChunks = [...chunks].sort((a, b) => {
          const aParts = a.title.split(" ||| ");
          const bParts = b.title.split(" ||| ");
          const aMeta = aParts[0];
          const bMeta = bParts[0];
          const aMetaParts = aMeta.split("_");
          const bMetaParts = bMeta.split("_");
          const aIndex = parseInt(aMetaParts[aMetaParts.length - 1] || "0", 10);
          const bIndex = parseInt(bMetaParts[bMetaParts.length - 1] || "0", 10);
          return aIndex - bIndex;
        });
        const mergedSerialized = sortedChunks.map(c => {
          const parts = c.title.split(" ||| ");
          return parts.length > 1 ? parts[1].trim() : "";
        }).join("");
        if (mergedSerialized) {
          const parsedMsgs = decompressMessages(mergedSerialized);
          if (parsedMsgs.length > 0) {
            setMessages(prev => {
              if (JSON.stringify(prev) === JSON.stringify(parsedMsgs)) {
                return prev;
              }
              localStorage.setItem(`igris_msgs_${activeSessionId}`, JSON.stringify(parsedMsgs));
              return parsedMsgs;
            });
            return;
          }
        }
      }
      const currentSess = currentSessions.find(s => s.id === activeSessionId);
      if (currentSess && currentSess.title.includes(" ||| ")) {
        const parts = currentSess.title.split(" ||| ");
        const serialized = parts[1];
        const parsedMsgs = decompressMessages(serialized);
        if (parsedMsgs.length > 0) {
          setMessages(prev => {
            if (JSON.stringify(prev) === JSON.stringify(parsedMsgs)) {
              return prev;
            }
            localStorage.setItem(`igris_msgs_${activeSessionId}`, JSON.stringify(parsedMsgs));
            return parsedMsgs;
          });
          return;
        }
      }
    };
    loadSessionMessages();
    return () => {
      active = false;
    };
  }, [activeSessionId, user]);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    if (toastMsg?.type === type && toastMsg.text === text) {
      return;
    }
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };
  
  const handleAuthenticate = (authenticatedUser: User) => {
    const remember = authenticatedUser.rememberMe !== false;
    setUser(authenticatedUser);
    setStoredUser(authenticatedUser, remember);
    if (authenticatedUser.token) {
      showToast("success", `Authorized Monarch: ${authenticatedUser.username} Arisen!`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    clearStoredToken();
    localStorage.removeItem("igris_user");
    showToast("info", "Monarch de-authenticated. Secure gateway closed.");
  };

  const syncMessagesToServer = (sessionId: number, updatedList: Message[]) => {
    syncQueueRef.current[sessionId] = updatedList;
    if (isSyncingRef.current[sessionId]) {
      return;
    }
    isSyncingRef.current[sessionId] = true;
    (async () => {
      try {
        while (syncQueueRef.current[sessionId]) {
          const msgsToSync = syncQueueRef.current[sessionId];
          delete syncQueueRef.current[sessionId];
          if (!user || !user.token) continue;
          const currentRemoteSessions = await fetchSessions(config.apiBaseUrl, user.token);
          const compressed = compressMessages(msgsToSync);
          const CHUNK_SIZE = 220;
          const chunks: string[] = [];
          for (let i = 0; i < compressed.length; i += CHUNK_SIZE) {
            chunks.push(compressed.substring(i, i + CHUNK_SIZE));
          }
          const N = chunks.length;
          const existingChunks = currentRemoteSessions.filter(s => s.title.startsWith(`__chunk_${sessionId}_`));
          let sessionsStateUpdated = [...currentRemoteSessions];
          let stateChanged = false;
          for (let i = 0; i < N; i++) {
            const requiredPrefix = `__chunk_${sessionId}_${i} |||`;
            const requiredTitle = `${requiredPrefix} ${chunks[i]}`;
            const matchingChunks = existingChunks.filter(s => 
              s.title.startsWith(`${requiredPrefix} `) || 
              s.title === requiredPrefix || 
              s.title.startsWith(`__chunk_${sessionId}_${i} `)
            );
            const existing = matchingChunks[0];
            if (matchingChunks.length > 1) {
              for (let k = 1; k < matchingChunks.length; k++) {
                try {
                  await deleteSessionFromServer(config.apiBaseUrl, user.token, matchingChunks[k].id);
                  sessionsStateUpdated = sessionsStateUpdated.filter(s => s.id !== matchingChunks[k].id);
                  stateChanged = true;
                } catch (e) {
                  console.error("Auto-heal failed to purge duplicate chunk:", e);
                }
              }
            }
            if (existing) {
              if (existing.title !== requiredTitle) {
                await renameSessionOnServer(config.apiBaseUrl, user.token, existing.id, requiredTitle);
                sessionsStateUpdated = sessionsStateUpdated.map(s => s.id === existing.id ? { ...s, title: requiredTitle } : s);
                stateChanged = true;
              }
            } else {
              const newSess = await createSessionOnServer(config.apiBaseUrl, user.token);
              await renameSessionOnServer(config.apiBaseUrl, user.token, newSess.id, requiredTitle);
              newSess.title = requiredTitle;
              sessionsStateUpdated = [newSess, ...sessionsStateUpdated];
              stateChanged = true;
            }
          }
          const prefixRegex = new RegExp(`^__chunk_${sessionId}_(\\d+)`);
          for (const oldSess of existingChunks) {
            const match = oldSess.title.match(prefixRegex);
            if (match) {
              const idx = parseInt(match[1], 10);
              if (idx >= N) {
                try {
                  await deleteSessionFromServer(config.apiBaseUrl, user.token, oldSess.id);
                } catch (err) {
                  console.error("Failed to delete stale chunk session:", err);
                }
                sessionsStateUpdated = sessionsStateUpdated.filter(s => s.id !== oldSess.id);
                stateChanged = true;
              }
            }
          }
          if (stateChanged || !sessions.some(s => s.title.startsWith(`__chunk_${sessionId}_`))) {
            setSessions(sessionsStateUpdated);
          }
        }
      } catch (err) {
        console.error("Sequential sync worker thread failed:", err);
      } finally {
        isSyncingRef.current[sessionId] = false;
      }
    })();
  };

  const handleCreateSession = async () => {
    if (!user || !user.token) {
      showToast("error", "You must be authenticated to create a session.");
      return;
    }
    try {
      const sess = await createSessionOnServer(config.apiBaseUrl, user.token);
      const welcomeMsg: Message = {
        id: `sys-${Date.now()}`,
        role: "assistant",
        content: `### COMMAND CENTER INITIALIZED 🛡️\n\nHail, **My Liege**! This new session #${sess.id} is officially allocated to your command.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const welcomeList = [welcomeMsg];
      setMessages(welcomeList);
      localStorage.setItem(`igris_msgs_${sess.id}`, JSON.stringify(welcomeList));
      const updatedSess = [sess, ...sessions];
      setSessions(updatedSess);
      setActiveSessionId(sess.id);
      updateSessionActivity(sess.id);
      setMessages([]);
      syncMessagesToServer(sess.id, welcomeList);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout();
        showToast("error", "Your session has expired. Please authenticate again.");
        return;
      }
      showToast("error", `Could not spawn new database session: ${err.message}`);
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (id: number) => {
    setActiveSessionId(id);
    updateSessionActivity(id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleRenameSession = async (id: number, newTitle: string) => {
    if (!user || !user.token) return;
    const cleanTitle = newTitle.split(" ||| ")[0];
    try {
      await renameSessionOnServer(config.apiBaseUrl, user.token, id, cleanTitle);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: cleanTitle } : s)));
      updateSessionActivity(id);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout();
        showToast("error", "Your session has expired. Please authenticate again.");
        return;
      }
      showToast("error", `Database rename failed: ${err.message}`);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!user || !user.token) return;
    try {
      const ok = await deleteSessionFromServer(config.apiBaseUrl, user.token, id);
      if (ok) {
        const chunksToDelete = sessions.filter(s => s.title.startsWith(`__chunk_${id}_`));
        for (const chunk of chunksToDelete) {
          try {
            await deleteSessionFromServer(config.apiBaseUrl, user.token, chunk.id);
          } catch (e) {
            console.error("Failed to delete stale chunk session on deletion:", e);
          }
        }
        const updatedSess = sessions.filter((s) => s.id !== id && !s.title.startsWith(`__chunk_${id}_`));
        setSessions(updatedSess);
        localStorage.removeItem(`igris_msgs_${id}`);
        setSessionActivity((prev) => {
          const { [id]: _, ...rest } = prev;
          localStorage.setItem("igris_session_activity", JSON.stringify(rest));
          return rest;
        });
        if (activeSessionId === id) {
          const visibleSess = updatedSess.filter(s => !s.title.startsWith("__chunk_"));
          setActiveSessionId(visibleSess.length > 0 ? visibleSess[0].id : null);
        }
        showToast("success", "Session terminated successfully.");
      }
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout();
        showToast("error", "Your session has expired. Please authenticate again.");
        return;
      }
      showToast("error", `Session terminate failed: ${err.message}`);
    }
  };

  const handleCancelResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    showToast("info", "Response transmission cancelled by monarch decree.");
  };

  const handleSendMessage = async (
    text: string,
    filesToAttach?: UploadedFile[]
  ) => {
    if (isSending) return;
    if (!user || !user.token) {
      showToast("error", "Authentication required to dispatch query decrees.");
      return;
    }
    if (!activeSessionId) {
      showToast("error", "Please select or create an active session first.");
      return;
    }

    setIsSending(true);

    const triggerWords = [ "commence", "initiate 419 protocol"];
    const isAriseTrigger = triggerWords.some(word => text.toLowerCase().includes(word));
    if (isAriseTrigger) {
      setShowAriseAnimation(true);
      setConfig(prev => ({ ...prev, themeAccent: "crimson" }));
    }

    const attaches = filesToAttach || [];

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(attaches.length > 0 ? {
        files: attaches.map((f) => ({
          fileName: f.fileName,
          fileType: f.fileType,
          analysis: f.analysis,
          pageCount: f.pageCount,
          previewUrl: f.previewUrl || undefined,
        })),
      } : {})
    };

    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    updateSessionActivity(activeSessionId);
    localStorage.setItem(`igris_msgs_${activeSessionId}`, JSON.stringify(updatedMsgs));
    syncMessagesToServer(activeSessionId, updatedMsgs);

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (activeSessionId && currentSession && (
      currentSession.title.toLowerCase().startsWith("session #") ||
      currentSession.title.toLowerCase().includes("new session") ||
      currentSession.title.toLowerCase().includes("new chat") ||
      currentSession.title.toLowerCase().startsWith("combat command #") ||
      currentSession.title === ""
    )) {
      let autoTitle = text === "Analyze this file" && attaches.length > 0 ? `Analyze: ${attaches[0].fileName}` : text.trim();
      autoTitle = autoTitle.replace(/[#*`_\[\]()]/g, "");
      const words = autoTitle.split(/\s+/).filter(Boolean);
      if (words.length > 5) {
        autoTitle = words.slice(0, 5).join(" ") + "...";
      } else {
        autoTitle = words.join(" ");
      }
      if (autoTitle.length > 28) {
        autoTitle = autoTitle.substring(0, 25) + "...";
      }
      if (autoTitle) {
        autoTitle = autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1);
        setTimeout(() => {
          handleRenameSession(activeSessionId, autoTitle);
        }, 400);
      }
    }

    const botMsgId = `bot-${Date.now()}`;
    const botMsgPlaceholder: Message = {
      id: botMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };
    
    setMessages((prev) => [...prev, botMsgPlaceholder]);

    let messageToSend = text || "User uploaded files";

    if (attaches.length > 0) {
      let allFilesContext = "";
      
      attaches.forEach((f, fileIdx) => {
        const fileNumber = fileIdx + 1;
        const isFirstFile = fileIdx === 0;
        
        if (isFirstFile) {
          allFilesContext += "\n\n[PRIMARY ATTACHMENT ANALYSIS]";
        } else if (fileIdx === 1) {
          allFilesContext += "\n\n[ADDITIONAL ATTACHMENTS]";
        }
        
        allFilesContext += `\n\nFile #${fileNumber}: "${f.fileName}" (${f.fileType.toUpperCase()})`;
        allFilesContext += `\n─────────────────────────`;
        
        if (f.analysis) {
          if (f.fileType === "image") {
            if (f.analysis.description) {
              allFilesContext += `\n📷 Visual Description: ${f.analysis.description}`;
            }
            if (f.analysis.ocrText) {
              allFilesContext += `\n📝 Text in Image (OCR): ${f.analysis.ocrText}`;
            }
            if (Array.isArray(f.analysis.detectedObjects) && f.analysis.detectedObjects.length > 0) {
              allFilesContext += `\n🔍 Detected Objects: ${f.analysis.detectedObjects.join(", ")}`;
            }
            if (f.analysis.uiAnalysis) {
              allFilesContext += `\n🎨 UI/UX Analysis: ${f.analysis.uiAnalysis}`;
            }
          }
          else if (f.fileType === "code") {
            if (f.analysis.language) {
              allFilesContext += `\n💻 Language: ${f.analysis.language}`;
            }
            if (f.analysis.purpose) {
              allFilesContext += `\n🎯 Purpose: ${f.analysis.purpose}`;
            }
            if (f.analysis.summary) {
              allFilesContext += `\n📋 Summary: ${f.analysis.summary}`;
            }
            if (Array.isArray(f.analysis.bugs) && f.analysis.bugs.length > 0) {
              allFilesContext += `\n🐛 Identified Bugs:\n  • ${f.analysis.bugs.join("\n  • ")}`;
            }
            if (Array.isArray(f.analysis.securityIssues) && f.analysis.securityIssues.length > 0) {
              allFilesContext += `\n🔒 Security Issues:\n  • ${f.analysis.securityIssues.join("\n  • ")}`;
            }
            if (Array.isArray(f.analysis.suggestedImprovements) && f.analysis.suggestedImprovements.length > 0) {
              allFilesContext += `\n✨ Suggested Improvements:\n  • ${f.analysis.suggestedImprovements.join("\n  • ")}`;
            }
          }
          else if (f.fileType === "pdf") {
            if (f.analysis.summary) {
              allFilesContext += `\n📄 Summary: ${f.analysis.summary}`;
            }
            if (Array.isArray(f.analysis.keyPoints) && f.analysis.keyPoints.length > 0) {
              allFilesContext += `\n⭐ Key Points:\n  • ${f.analysis.keyPoints.join("\n  • ")}`;
            }
            if (Array.isArray(f.analysis.importantSections) && f.analysis.importantSections.length > 0) {
              allFilesContext += `\n📑 Important Sections:\n  • ${f.analysis.importantSections.join("\n  • ")}`;
            }
          }
          else if (f.fileType === "docx") {
            if (f.analysis.summary) {
              allFilesContext += `\n📝 Summary: ${f.analysis.summary}`;
            }
            if (Array.isArray(f.analysis.insights) && f.analysis.insights.length > 0) {
              allFilesContext += `\n💡 Key Insights:\n  • ${f.analysis.insights.join("\n  • ")}`;
            }
          }
          else if (f.fileType === "txt") {
            if (f.analysis.summary) {
              allFilesContext += `\n📄 Summary: ${f.analysis.summary}`;
            }
            if (Array.isArray(f.analysis.insights) && f.analysis.insights.length > 0) {
              allFilesContext += `\n💡 Key Insights:\n  • ${f.analysis.insights.join("\n  • ")}`;
            }
          }
        }
      });
      
      messageToSend += allFilesContext;
    }

    try {
      abortControllerRef.current = new AbortController();
      
      const result = await postChatMessage(
        config.apiBaseUrl,
        user.token,
        activeSessionId,
        messageToSend,
        attaches,
        abortControllerRef.current.signal
      );
      
      let finalBotText = result.response;
      if (isAriseTrigger) {
        finalBotText = `🛡️⚔️ **[THE BLOOD-RED KNIGHT COMMANDER REVEALED]** ⚔️🛡️\n\n*"Hail, My Liege! Igris the Blood-Red Squire reports for duty. By your supreme decree, the absolute power of the shadow legion has risen. System protocols are perfectly synchronized and the crimson core glows with unwavering devotion."*\n\n---\n\n${finalBotText}`;
      }

      const mergedMsgs = [...updatedMsgs, { ...botMsgPlaceholder, content: finalBotText, isStreaming: false }];
      setMessages(mergedMsgs);
      setIsSending(false);
      localStorage.setItem(
        `igris_msgs_${activeSessionId}`,
        JSON.stringify(mergedMsgs)
      );
      syncMessagesToServer(activeSessionId, mergedMsgs);

    } catch (err: any) {
      console.error("Transmission error:", err);
      
      if (err.name === "AbortError" || err.message === "AbortError" || err.message?.includes("abort")) {
        setIsSending(false);
        abortControllerRef.current = null;
        return;
      }
      
      setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
      setIsSending(false);

      if (err.message === "UNAUTHORIZED") {
        handleLogout();
        showToast("error", "Your session has expired. Please authenticate again.");
        return;
      }

      showToast("error", `Gateway response failed: ${err.message}`);
    }
  };

  const handleTestConnection = async (testUrl?: string) => {
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    const urlToTest = testUrl || config.apiBaseUrl;
    const ok = await checkServerStatus(urlToTest);
    
    if (ok) {
      setConnectionStatus("connected");
      setServerOnline(true);
    } else {
      setConnectionStatus("failed");
      setServerOnline(false);
    }
    setIsTestingConnection(false);
  };

  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    setStoredApiUrl(newConfig.apiBaseUrl);
    showToast("success", "System configuration refreshed.");
  };

  return (
    <div 
      className="flex h-[100dvh] w-screen overflow-hidden bg-zinc-950 font-sans text-white select-text"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      <div className={`fixed -top-40 -left-40 h-80 w-80 rounded-full filter blur-[120px] opacity-10 pointer-events-none transition duration-500 ${
        config.themeAccent === "crimson" ? "bg-rose-600" : config.themeAccent === "silver" ? "bg-zinc-400" : config.themeAccent === "emerald" ? "bg-emerald-600" : "bg-purple-600"
      }`} />

      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden cursor-pointer transition-opacity duration-300 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          id="mobile-sidebar-backdrop"
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions
          .filter(s => !s.title.startsWith("__chunk_"))
          .sort((a, b) => {
            const aPinned = pinnedSessionIds.includes(a.id);
            const bPinned = pinnedSessionIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            const aTime = sessionActivity[a.id] || 0;
            const bTime = sessionActivity[b.id] || 0;
            return bTime - aTime;
          })}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setSettingsModalOpen(true)}
        config={config}
        serverOnline={serverOnline}
        onOpenTelegramModal={() => setTelegramModalOpen(true)}
        telegramLinked={telegramLinked}
        diagnostics={diagnostics}
        pinnedSessionIds={pinnedSessionIds}
        onTogglePinSession={handleTogglePinSession}
      />

      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isSending={isSending}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        config={config}
        activeSessionId={activeSessionId}
        onCreateSession={handleCreateSession}
        onOpenTelegramModal={() => setTelegramModalOpen(true)}
        telegramLinked={telegramLinked}
        sidebarOpen={sidebarOpen}
        pinnedSessionIds={pinnedSessionIds}
        onTogglePinSession={handleTogglePinSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onShowToast={showToast}
        onCancelResponse={handleCancelResponse}
      />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-white/5 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-xl animate-bounce flex items-start space-x-3 text-white">
          <div className={`mt-0.5 rounded-full p-1.5 flex items-center justify-center ${
            toastMsg.type === "success" 
              ? "bg-emerald-500/10 text-emerald-400" 
              : toastMsg.type === "error" 
                ? "bg-rose-500/10 text-rose-400" 
                : "bg-purple-500/10 text-purple-400"
          }`}>
            {toastMsg.type === "error" ? <Terminal size={14} /> : <Sparkles size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-mono font-bold tracking-wider text-zinc-300 uppercase">
              System Dispatch Node
            </h4>
            <p className="text-xs text-zinc-400 mt-1 leading-normal font-sans">
              {toastMsg.text}
            </p>
          </div>
          <button 
            onClick={() => setToastMsg(null)}
            className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <AuthModal
        isOpen={!user && authModalOpen}
        onAuthenticate={handleAuthenticate}
        onClose={() => setAuthModalOpen(false)}
        apiBaseUrl={config.apiBaseUrl}
        onRegister={registerUser}
        onLogin={loginUser}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        config={config}
        onChangeConfig={handleUpdateConfig}
        onTestConnection={handleTestConnection}
        isTestingConnection={isTestingConnection}
        connectionStatus={connectionStatus}
        telegramLinked={telegramLinked}
        onTelegramLinkedChange={(linked) => {
          setTelegramLinked(linked);
          localStorage.setItem("igris_telegram_linked", linked ? "true" : "false");
        }}
      />

      <TelegramLinkModal
        isOpen={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        accentColor={config.themeAccent}
        onSuccessToast={(text) => showToast("success", text)}
        activeApiBaseUrl={config.apiBaseUrl}
        activeAuthToken={user?.token || getStoredToken() || ""}
        onTelegramLinkedChange={(linked) => {
          setTelegramLinked(linked);
          localStorage.setItem("igris_telegram_linked", linked ? "true" : "false");
        }}
      />

      {!user && (
        <AuthModal
          isOpen={true}
          onAuthenticate={handleAuthenticate}
          onClose={() => setAuthModalOpen(false)}
          apiBaseUrl={config.apiBaseUrl}
          onRegister={registerUser}
          onLogin={loginUser}
        />
      )}

      {showAriseAnimation && (
        <AriseOverlay onClose={() => setShowAriseAnimation(false)} />
      )}
    </div>
  );
}