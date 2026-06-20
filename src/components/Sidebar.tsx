import React, { useState } from "react";
import { 
  Plus, MessageSquare, Trash2, Edit2, LogOut, Settings, 
  ChevronLeft, Check, X, ShieldAlert, MonitorCheck, HelpCircle, Flame,
  Pin, PinOff
} from "lucide-react";
import { ChatSession, User, AppConfig } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onCreateSession: () => void;
  onRenameSession: (id: number, title: string) => void;
  onDeleteSession: (id: number) => void;
  user: User | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  config: AppConfig;
  serverOnline: boolean;
  onOpenTelegramModal: () => void;
  telegramLinked: boolean;
  diagnostics: {
    currentUrl: string;
    tokenPresent: boolean;
    lastRequest: string;
    lastResponse: string;
  };
  pinnedSessionIds: number[];
  onTogglePinSession: (id: number) => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  user,
  onLogout,
  onOpenSettings,
  config,
  serverOnline,
  onOpenTelegramModal,
  telegramLinked,
  diagnostics,
  pinnedSessionIds = [],
  onTogglePinSession,
}: SidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const getThemeClasses = () => {
    switch (config.themeAccent) {
      case "crimson":
        return {
          headerBg: "bg-gradient-to-b from-rose-950/20 to-transparent",
          glowBg: "bg-rose-600/10",
          igtText: "to-rose-400",
          tLetter: "text-rose-500",
          techText: "text-rose-400",
          dividerGlow: "via-rose-500/30",
          crownSign: "text-rose-400/80",
          newChatBtn: "bg-rose-600/10 border-rose-500/20 text-rose-300 hover:bg-rose-600/20 shadow-rose-500/5",
          activeSession: "bg-rose-500/10 border-rose-400/20 text-white",
          activeIcon: "text-rose-400",
          formBorder: "border-rose-400/30",
          hoverRename: "hover:text-rose-400",
          sandboxStatus: "text-rose-400 bg-rose-500/5 border-rose-500/10",
          avatar: "border-rose-500/20 bg-rose-600/15 text-rose-300"
        };
      case "silver":
        return {
          headerBg: "bg-gradient-to-b from-zinc-900/20 to-transparent",
          glowBg: "bg-zinc-400/10",
          igtText: "to-zinc-400",
          tLetter: "text-zinc-500",
          techText: "text-zinc-400",
          dividerGlow: "via-zinc-500/30",
          crownSign: "text-zinc-400/80",
          newChatBtn: "bg-zinc-600/10 border-zinc-500/20 text-zinc-300 hover:bg-zinc-600/20 shadow-zinc-500/5",
          activeSession: "bg-zinc-500/10 border-zinc-400/20 text-white",
          activeIcon: "text-zinc-300",
          formBorder: "border-zinc-400/30",
          hoverRename: "hover:text-zinc-300",
          sandboxStatus: "text-zinc-350 bg-zinc-500/5 border-zinc-500/10",
          avatar: "border-zinc-500/20 bg-zinc-600/15 text-zinc-300"
        };
      case "emerald":
        return {
          headerBg: "bg-gradient-to-b from-emerald-950/20 to-transparent",
          glowBg: "bg-emerald-600/10",
          igtText: "to-emerald-400",
          tLetter: "text-emerald-500",
          techText: "text-emerald-400",
          dividerGlow: "via-emerald-500/30",
          crownSign: "text-emerald-400/80",
          newChatBtn: "bg-emerald-600/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-600/20 shadow-emerald-500/5",
          activeSession: "bg-emerald-500/10 border-emerald-400/20 text-white",
          activeIcon: "text-emerald-400",
          formBorder: "border-emerald-400/30",
          hoverRename: "hover:text-emerald-400",
          sandboxStatus: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
          avatar: "border-emerald-500/20 bg-emerald-600/15 text-emerald-300"
        };
      default:
        return {
          headerBg: "bg-gradient-to-b from-purple-950/20 to-transparent",
          glowBg: "bg-purple-600/10",
          igtText: "to-purple-400",
          tLetter: "text-purple-500",
          techText: "text-purple-400",
          dividerGlow: "via-purple-500/30",
          crownSign: "text-purple-400/80",
          newChatBtn: "bg-purple-600/10 border-purple-500/20 text-purple-300 hover:bg-purple-600/20 shadow-purple-500/5",
          activeSession: "bg-purple-500/10 border-purple-400/20 text-white",
          activeIcon: "text-purple-400",
          formBorder: "border-purple-400/30",
          hoverRename: "hover:text-purple-400",
          sandboxStatus: "text-purple-400 bg-purple-500/5 border-purple-500/10",
          avatar: "border-purple-500/20 bg-purple-600/15 text-purple-300"
        };
    }
  };

  const theme = getThemeClasses();

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title.split(" ||| ")[0]);
  };

  const handleSaveRename = (id: number, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-white/5 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
        isOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]"
      } md:relative md:translate-x-0 ${
        isOpen
          ? "md:w-[280px] md:opacity-100"
          : "md:w-0 md:opacity-0 md:border-r-0 md:pointer-events-none md:overflow-hidden"
      }`}
    >
      <div className={`flex flex-col items-center justify-center border-b border-white/5 px-7 py-10 ${theme.headerBg}`}>
        <div className="relative flex flex-col items-center select-none text-center">
          <div className="font-display font-semibold text-2xl leading-[1.2] tracking-normal text-white italic">
            IGRIS <span className="text-purple-500 font-bold">AI</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400/80 pl-2">Threads</span>
        <button
          onClick={onCreateSession}
          className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-purple-500/20 text-zinc-400 hover:text-purple-400 transition-all duration-200 cursor-pointer"
          title="New Chat"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5 scrollbar-thin">
        <div className="px-0 pt-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400/80 flex items-center justify-between">
          <span>Recent Conversations</span>
          {pinnedSessionIds.length > 0 && <span className="text-[9px] text-amber-500 font-bold">★ Pinned Active</span>}
        </div>
        
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400/80 space-y-5 border border-white/[0.02] bg-white/[0.01] rounded-xl mx-2">
            <MessageSquare size={20} className="stroke-[1.5]" />
            <p className="text-[11px] font-mono">Shield commands pool is empty</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingSessionId;
            const isPinned = pinnedSessionIds.includes(session.id);

            return (
              <div
                key={session.id}
                onClick={() => !isEditing && onSelectSession(session.id)}
                className={`group relative flex items-center justify-between rounded-xl px-5 py-3.5 transition duration-150 ease-out cursor-pointer ${
                  isActive
                    ? theme.activeSession
                    : "border border-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex flex-1 items-center space-x-2.5 min-w-0">
                  <MessageSquare
                    size={14}
                    className={`flex-shrink-0 transition ${
                      isActive ? theme.activeIcon : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  />
                  {isPinned && !isActive && (
                    <Pin size={10} className="text-amber-500 fill-amber-500/80 shrink-0 rotate-45" />
                  )}
                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleSaveRename(session.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 flex items-center bg-zinc-900 rounded-xl border ${theme.formBorder} overflow-hidden px-1 py-0.5 z-20`}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent font-mono text-[11px] font-medium text-white p-1 focus:outline-none focus:ring-0 outline-none border-0"
                      />
                      <button
                        type="submit"
                        className="p-2 text-emerald-400 hover:text-emerald-300 transition cursor-pointer active:scale-90 touch-manipulation"
                        title="Confirm rename"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleCancelRename(e);
                        }}
                        className="p-2 text-rose-400 hover:text-rose-300 transition cursor-pointer active:scale-90 touch-manipulation"
                        title="Cancel rename"
                      >
                        <X size={13} />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate text-xs font-mono font-medium tracking-wide pr-24 md:pr-0 md:group-hover:pr-24 transition-all duration-150">
                      {(session.title && session.title.split(" ||| ")[0]) || `Combat Command #${session.id}`}
                    </span>
                  )}
                </div>

                {!isEditing && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 bg-transparent pl-2 py-1 transition duration-200 z-10"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onTogglePinSession(session.id);
                      }}
                      title={isPinned ? "Unpin command" : "Pin command"}
                      className={`rounded-lg p-1.5 transition active:scale-90 cursor-pointer touch-manipulation text-zinc-400 hover:text-amber-400 hover:bg-white/10`}
                    >
                      <Pin size={12} className={isPinned ? "fill-amber-400 text-amber-400" : ""} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleStartEdit(session, e);
                      }}
                      title="Rename command"
                      className={`rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 ${theme.hoverRename} transition active:scale-90 cursor-pointer touch-manipulation`}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteSession(session.id);
                      }}
                      title="Terminate session"
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-rose-400 transition active:scale-90 cursor-pointer touch-manipulation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-white/5 bg-zinc-950 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border font-sans font-bold text-sm tracking-wide ${theme.avatar} overflow-hidden`}>
            {user?.photoUrl ? (
                <img src={user.photoUrl} alt="User" className="h-full w-full object-cover" />
            ) : (
                user?.username ? user.username.substring(0, 2).toUpperCase() : "G"
            )}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-mono font-bold text-zinc-200">
              {user?.username || "Guest Monarch"}
            </p>
            <p className="truncate text-xs text-zinc-400/80 font-medium">
              {user?.email || "sandbox_legion"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenSettings}
            title="System Configurations"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition"
          >
            <Settings size={15} />
          </button>
          
          {user && (
            <button
              onClick={onLogout}
              title="De-authenticate Legion"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-rose-400 transition"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}