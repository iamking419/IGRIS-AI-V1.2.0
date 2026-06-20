import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Bot, CornerDownLeft, Sparkles, Check, Copy, Flame, 
  Terminal, ShieldAlert, BookOpen, Layers, Menu, HelpCircle, Code, Download,
  MoreHorizontal, Share2, Pin, PinOff, Edit2, Trash2, PhoneCall, ChevronLeft, ChevronRight,
  Upload, Paperclip, Loader2, FileCode, FileText, File, Image, AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { analyzeFile } from "../lib/api";
import { Message, AppConfig, UploadedFile } from "../types";
import CodeSnippet, { parseMarkdownBlocks } from "./CodeSnippet";
import { useAttachments } from "../hooks/useAttachments";
import AttachmentChips from "./AttachmentChips";
import FilePreview from "./FilePreview";
import ChatInput from "./ChatInput";

// Helper to detect URLs (both raw and markdown [text](url)) and render as clickable links
const renderTextWithLinks = (text: string, themeTextColor: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  // Match markdown links [text](url) OR raw URLs https://...
  const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"{}|\^`\[\]]+)/gi;
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (match[1] && match[2]) {
      // Markdown link: [text](url)
      const linkText = match[1];
      const url = match[2];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 ${themeTextColor} hover:underline underline-offset-2 decoration-current/40 transition font-medium`}
        >
          {linkText}
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-60">
            <path d="M3.5 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 6l5-5M7 1h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      );
    } else if (match[3]) {
      // Raw URL: https://...
      const url = match[3];
      let domain = url;
      try {
        domain = new URL(url).hostname.replace("www.", "");
      } catch {
        // invalid URL, keep raw
      }

      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 ${themeTextColor} hover:underline underline-offset-2 decoration-current/40 transition font-medium`}
        >
          {domain}
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="opacity-60">
            <path d="M3.5 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 6l5-5M7 1h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [text];
};


interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, filesToAttach?: UploadedFile[]) => Promise<void>;
  isSending: boolean;
  onToggleSidebar: () => void;
  config: AppConfig;
  activeSessionId: number | null;
  onCreateSession: () => void;
  onOpenTelegramModal: () => void;
  telegramLinked: boolean;
  sidebarOpen: boolean;
  pinnedSessionIds?: number[];
  onTogglePinSession?: (id: number) => void;
  onRenameSession?: (id: number, title: string) => void;
  onDeleteSession?: (id: number) => void;
  onShowToast?: (type: "success" | "error" | "info", text: string) => void;
  onCancelResponse?: () => void;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isSending,
  onToggleSidebar,
  config,
  activeSessionId,
  onCreateSession,
  onOpenTelegramModal,
  telegramLinked,
  sidebarOpen,
  pinnedSessionIds = [],
  onTogglePinSession,
  onRenameSession,
  onDeleteSession,
  onCancelResponse,
  onShowToast,
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState("");
  const [showTacticalMenu, setShowTacticalMenu] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Three-dot options and rename dialog states
  const [showDropdown, setShowDropdown] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tap-to-copy state for glassy user chat bubbles
  const [tappedMessageId, setTappedMessageId] = useState<string | null>(null);

  // Separate, insulated active attachments hook state management
  const {
    activeAttachments,
    setActiveAttachments,
    isFileAnalyzing,
    setIsFileAnalyzing,
    addAttachment,
    removeAttachment,
    clearAttachments,
  } = useAttachments();

  const [attachmentStatus, setAttachmentStatus] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state for image preview modal
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState<string | null>(null);

  const getFileType = (name: string): UploadedFile["fileType"] | null => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
    if (["py", "js", "ts", "html", "css", "php", "java", "c", "cpp", "json"].includes(ext)) return "code";
    if (ext === "pdf") return "pdf";
    if (ext === "docx") return "docx";
    if (ext === "txt") return "txt";
    return null;
  };

  const handleFileSelected = (file: File) => {
    if (!activeSessionId) {
      if (onShowToast) onShowToast("error", "Please select or create an active session first.");
      return;
    }

    const fileType = getFileType(file.name);
    if (!fileType) {
      if (onShowToast) onShowToast("error", `Unsupported file format: .${file.name.split(".").pop()}. Use png, jpg, webp, code, pdf, docx, or txt.`);
      return;
    }

    if (activeAttachments.some((attachment) =>
      attachment.fileName === file.name &&
      attachment.fileSize === file.size &&
      attachment.lastModified === file.lastModified
    )) {
      if (onShowToast) onShowToast("info", "This file is already attached.");
      return;
    }

    const previewUrl = fileType === "image" ? URL.createObjectURL(file) : undefined;

    const newAttachment: UploadedFile = {
      fileName: file.name,
      fileType,
      analysis: undefined,
      isStaged: true,
      previewUrl,
      fileObject: file,
      fileSize: file.size,
      lastModified: file.lastModified,
    };

    addAttachment(newAttachment);
  };

  const cleanupAttachmentPreview = (attachment: UploadedFile) => {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  };

  const clearAttachmentsSafely = () => {
    activeAttachments.forEach(cleanupAttachmentPreview);
    clearAttachments();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Lightbox handlers
  const openLightbox = (url: string | undefined, name?: string) => {
    if (!url) return;
    setLightboxUrl(url);
    setLightboxName(name || null);
  };
  const closeLightbox = () => {
    setLightboxUrl(null);
    setLightboxName(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveAttachment = (attachment: UploadedFile) => {
    cleanupAttachmentPreview(attachment);
    removeAttachment(attachment);
    if (activeAttachments.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!activeSessionId || isFileAnalyzing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file: any) => {
        handleFileSelected(file as File);
      });
      e.dataTransfer.clearData();
    }
  };

  // Clear tappedMessageId automatically after 2.5 seconds
  useEffect(() => {
    if (tappedMessageId) {
      const timer = setTimeout(() => {
        setTappedMessageId(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [tappedMessageId]);

  const handleUserMessageClick = (msgId: string, content: string) => {
    handleCopyMessage(msgId, content);
    setTappedMessageId(msgId);
    if (onShowToast) {
      onShowToast("success", "Message text copied to tactical clipboard!");
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    const fallbackCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = content;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand("copy");
        if (!ok) throw new Error("execCommand(copy) failed");
      } finally {
        document.body.removeChild(ta);
      }
    };

    const doCopied = () => {
      setCopiedMessageId(msgId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    };

    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(content);
        doCopied();
      } else {
        fallbackCopy();
        doCopied();
      }
    } catch (err) {
      try {
        fallbackCopy();
        doCopied();
      } catch (fallbackErr) {
        console.error("Failed to copy text: ", err, fallbackErr);
      }
    }
  };

  const getThemeClasses = () => {
    switch (config.themeAccent) {
      case "crimson":
        return {
          textColor: "text-rose-400",
          textHover: "group-hover:text-rose-300",
          itemBorder: "border-rose-500/80",
          headerTag: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]",
          tagGlow: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse",
          nebula1: "bg-rose-950/15",
          nebula2: "bg-pink-950/10",
          emptyStateIcon: "border-rose-500/30 bg-rose-950/20 shadow-xl shadow-rose-500/10 mb-2",
          emptyStateSparkles: "text-rose-400 animate-pulse",
          presetCardHover: "hover:bg-rose-950/15 hover:border-rose-500/25 shadow-rose-900/5 hover:shadow-rose-950/20",
          userAvatar: "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-md",
          userBubble: "bg-rose-500/5 border-rose-500/20 text-zinc-100 rounded-tr-none",
          streamingIndicator: "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
          inputHoverGlow: "from-rose-600/20 to-pink-600/20",
          sendBtn: "bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 disabled:hover:bg-rose-600",
          glowPulseBg: "bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
          glowingPulseDot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]",
          typingSubtitle: "Commander is channeling crimson aura spells...",
          headerBorderGlow: "from-transparent via-rose-500/40 to-transparent shadow-[0_1px_15px_rgba(244,63,94,0.15)]"
        };
      case "silver":
        return {
          textColor: "text-zinc-300",
          textHover: "group-hover:text-zinc-200",
          itemBorder: "border-zinc-500/80",
          headerTag: "text-zinc-350 bg-zinc-500/10 border-zinc-500/20 shadow-[0_0_12px_rgba(240,240,240,0.05)]",
          tagGlow: "bg-zinc-300 shadow-[0_0_8px_rgba(240,240,240,0.6)] animate-pulse",
          nebula1: "bg-zinc-900/15",
          nebula2: "bg-slate-950/10",
          emptyStateIcon: "border-zinc-500/30 bg-zinc-900/20 shadow-xl shadow-zinc-500/10 mb-2",
          emptyStateSparkles: "text-zinc-300 animate-pulse",
          presetCardHover: "hover:bg-zinc-900/30 hover:border-zinc-500/25 shadow-zinc-900/5 hover:shadow-zinc-950/20",
          userAvatar: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300 shadow-md",
          userBubble: "bg-zinc-500/5 border-zinc-500/20 text-zinc-100 rounded-tr-none",
          streamingIndicator: "bg-zinc-300 shadow-[0_0_6px_rgba(240,240,240,0.6)]",
          inputHoverGlow: "from-zinc-600/20 to-slate-600/20",
          sendBtn: "bg-zinc-600 hover:bg-zinc-500 shadow-md shadow-zinc-600/30 disabled:hover:bg-zinc-600",
          glowPulseBg: "bg-zinc-500/20 border-zinc-500/40 text-zinc-300 shadow-[0_0_15px_rgba(240,240,240,0.15)]",
          glowingPulseDot: "bg-zinc-300 shadow-[0_0_8px_rgba(240,240,240,0.8)]",
          typingSubtitle: "Commander is formulating metallic cognitive matrix...",
          headerBorderGlow: "from-transparent via-zinc-400/40 to-transparent shadow-[0_1px_15px_rgba(240,240,240,0.15)]"
        };
      default: // "violet"
        return {
          textColor: "text-purple-400",
          textHover: "group-hover:text-purple-300",
          itemBorder: "border-purple-500/80",
          headerTag: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.05)]",
          tagGlow: "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse",
          nebula1: "bg-purple-950/15",
          nebula2: "bg-violet-950/10",
          emptyStateIcon: "border-purple-500/30 bg-purple-950/20 shadow-xl shadow-purple-500/10 mb-2",
          emptyStateSparkles: "text-purple-400 animate-pulse",
          presetCardHover: "hover:bg-purple-950/15 hover:border-purple-500/25 shadow-purple-900/5 hover:shadow-purple-950/20",
          userAvatar: "border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-md",
          userBubble: "bg-purple-500/5 border-purple-500/20 text-zinc-100 rounded-tr-none",
          streamingIndicator: "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]",
          inputHoverGlow: "from-purple-600/20 to-violet-600/20",
          sendBtn: "bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 disabled:hover:bg-purple-600",
          glowPulseBg: "bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
          glowingPulseDot: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
          typingSubtitle: "Commander is realigning portals for shadow retrieval...",
          headerBorderGlow: "from-transparent via-purple-500/40 to-transparent shadow-[0_1px_15px_rgba(168,85,247,0.15)]"
        };
    }
  };

  const theme = getThemeClasses();

  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    
    let markdownContent = `# Igris Tech Shadow Command Session\n\n`;
    markdownContent += `*Generated automatically from active session #${activeSessionId} on ${new Date().toLocaleString()}*\n\n`;
    markdownContent += `---\n\n`;

    messages.forEach((msg) => {
      const senderName = msg.role === "user" ? "USER COMMAND" : "SHADOW COMMANDER (IGRIS)";
      markdownContent += `### ✦ ${senderName}\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Igris_Tech_Session_${activeSessionId || "Export"}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Automatically scroll to bottom of chat on new content - optimized for lag-free mobile frames
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    messagesEndRef.current?.scrollIntoView({ behavior: isMobile ? "auto" : "smooth" });
  }, [messages, isSending]);

  const analyzeAttachment = async (attachment: UploadedFile): Promise<UploadedFile> => {
    if (!attachment.fileObject) return attachment;

    try {
      const analysis = await analyzeFile(attachment.fileObject);
      // Sanitize analysis so it is JSON-serializable and cannot contain circular refs
      let safeAnalysis: any = null;
      try {
        safeAnalysis = JSON.parse(JSON.stringify(analysis.analysis || analysis));
      } catch (e) {
        safeAnalysis = { summary: (analysis && (analysis.summary || analysis.description)) || null };
      }

      return {
        ...attachment,
        analysis: safeAnalysis,
      };
    } catch (error) {
      console.warn("Attachment analysis failed:", error);
      return { ...attachment, analysis: undefined };
    }
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput && activeAttachments.length === 0) return;
    if (isSending) return;

    const finalQuery = trimmedInput || "Analyze this file";

    let readyAttachments: UploadedFile[] = [];
    if (activeAttachments.length > 0) {
      setIsFileAnalyzing(true);
      setAttachmentStatus("Uploading files...");
      setAttachmentStatus("Analyzing attachments...");
      readyAttachments = await Promise.all(activeAttachments.map(analyzeAttachment));
    }

    try {
      setAttachmentStatus(activeAttachments.length > 0 ? "Sending..." : "Sending message...");
      await onSendMessage(finalQuery, readyAttachments);
      setInputText("");
      clearAttachmentsSafely();
    } finally {
      setIsFileAnalyzing(false);
      setAttachmentStatus("");
    }
  };

  // Helper renderer to handle text/code fences cleanly
  const renderMessageContent = (content: string) => {
    const blocks = parseMarkdownBlocks(content);

    return (
      <div className="space-y-3.5">
        {blocks.map((block, idx) => {
          if (block.type === "code") {
            return (
              <CodeSnippet 
                key={idx} 
                code={block.content} 
                language={block.lang || "code"} 
              />
            );
          } else {
            // Render basic markdown support inline: lists, headers, strong and simple breaks
            return (
              <div key={idx} className="text-zinc-300 font-sans text-[13.5px] leading-relaxed whitespace-pre-wrap select-text selection:bg-purple-500/30">
                {block.content.split("\n").map((line, lIdx) => {
                  // Heading level 3 ###
                  if (line.trim().startsWith("###")) {
                    return (
                      <h4 key={lIdx} className={`text-sm font-display font-bold tracking-wider text-white border-l-2 ${theme.itemBorder} pl-2.5 mt-4 mb-2 first:mt-0 uppercase`}>
                        {line.trim().replace("###", "").trim()}
                      </h4>
                    );
                  }
                  
                  // Heading level 2 ##
                  if (line.trim().startsWith("##")) {
                    return (
                      <h3 key={lIdx} className={`text-base font-display font-black tracking-wider ${theme.textColor} mt-5 mb-2 first:mt-0 uppercase`}>
                        {line.trim().replace("##", "").trim()}
                      </h3>
                    );
                  }

                  // Bullet lists: - text
                  if (line.trim().startsWith("-")) {
                    const bulletText = line.trim().substring(1).trim();
                    const bulletParts = renderTextWithLinks(bulletText, theme.textColor);
                    const bulletElements = bulletParts.map((part, partIdx) => {
                      if (typeof part === 'string' && part.includes("**")) {
                        const boldParts = part.split("**");
                        return (
                          <span key={partIdx}>
                            {boldParts.map((bp, bpIdx) => {
                              if (bpIdx % 2 === 1) {
                                return <strong key={bpIdx} className={`${theme.textColor} font-bold`}>{bp}</strong>;
                              }
                              return <span key={bpIdx}>{bp}</span>;
                            })}
                          </span>
                        );
                      }
                      return <span key={partIdx}>{part}</span>;
                    });
                    return (
                      <div key={lIdx} className="flex items-start pl-4 mt-1.5 space-x-2">
                        <span className={`${theme.textColor} mt-1 select-none text-[10px]`}>✦</span>
                        <span>{bulletElements}</span>
                      </div>
                    );
                  }

                  // Default line — process links and bold text
                  const linkParts = renderTextWithLinks(line, theme.textColor);
                  const elements = linkParts.map((part, partIdx) => {
                    if (typeof part === 'string' && part.includes("**")) {
                      const boldParts = part.split("**");
                      return (
                        <span key={partIdx}>
                          {boldParts.map((bp, bpIdx) => {
                            if (bpIdx % 2 === 1) {
                              return <strong key={bpIdx} className={`${theme.textColor} font-bold`}>{bp}</strong>;
                            }
                            return <span key={bpIdx}>{bp}</span>;
                          })}
                        </span>
                      );
                    }
                    return <span key={partIdx}>{part}</span>;
                  });

                  return (
                    <p key={lIdx} className="min-h-[1.2em]">
                      {elements}
                    </p>
                  );
                })}
              </div>
            );
          }
        })}
      </div>
    );
  };

  const getAccentGlowClass = () => {
    switch (config.themeAccent) {
      case "crimson":
        return "shadow-rose-500/10 border-rose-500/35 text-rose-400";
      case "silver":
        return "shadow-zinc-300/10 border-zinc-500/35 text-zinc-300";
      default:
        return "shadow-purple-500/10 border-purple-500/35 text-purple-400";
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      className="flex flex-1 flex-col h-full bg-zinc-950 text-white relative overflow-hidden"
    >
      
      {/* Drag & Drop Visual overlay */}
      {isDragging && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 border-2 border-dashed border-purple-500/40 m-4 rounded-2xl transition duration-200"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="rounded-full bg-purple-500/10 p-6 border border-purple-500/20 text-purple-400 mb-4 animate-bounce">
            <Upload size={32} />
          </div>
          <h3 className="text-xs font-bold tracking-widest font-mono uppercase text-purple-400">Arise Multimodal Analysis</h3>
          <p className="text-[10px] text-zinc-400 font-mono mt-1">Drop image, code, PDF, Docx, or txt file to analyze</p>
        </div>
      )}
      
      {/* Clean background */}
      <div className="absolute inset-0 bg-zinc-950 pointer-events-none" />

      {/* Floating Menu Toggle & Status Pill */}
      <div className="absolute top-4 left-4 z-40 flex items-center space-x-2.5">
        <div className="relative group/toggle">
          <motion.button
            onClick={onToggleSidebar}
            animate={{
              rotate: sidebarOpen ? 180 : 0,
              scale: sidebarOpen ? 1.05 : 1,
              backgroundColor: sidebarOpen ? "rgba(24, 24, 27, 0.85)" : "rgba(24, 24, 27, 0.6)",
              borderColor: sidebarOpen ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.1)"
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: config.themeAccent === "crimson" 
                ? "0 0 15px rgba(244, 63, 94, 0.3)" 
                : config.themeAccent === "silver"
                ? "0 0 15px rgba(240, 240, 240, 0.3)"
                : "0 0 15px rgba(168, 85, 247, 0.3)"
            }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border text-zinc-400 hover:text-white cursor-pointer shadow-lg backdrop-blur-md"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </motion.button>
          
          {/* Tooltip */}
          <div className="absolute top-1/2 left-full ml-2.5 -translate-y-1/2 opacity-0 group-hover/toggle:opacity-100 pointer-events-none transition-all duration-200 delay-300 scale-95 group-hover/toggle:scale-100 bg-zinc-900/90 border border-white/10 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold font-mono tracking-widest text-zinc-300 shadow-xl backdrop-blur-md z-50 whitespace-nowrap">
            {sidebarOpen ? "COLLAPSE PANEL" : "EXPAND PANEL"}
          </div>
        </div>

        {/* Glassy Bubble Active Block / Dynamic Status Pill */}
        <div className="hidden xs:flex items-center bg-zinc-900/40 hover:bg-zinc-900/65 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg transition duration-200 select-none">
          {/* Micro active power core dot */}
          <div className="relative mr-2 flex h-2 w-2 select-none">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.glowingPulseDot}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.glowingPulseDot}`} />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className={`font-sans font-extrabold tracking-wider bg-gradient-to-r ${
              config.themeAccent === "crimson" 
                ? "from-rose-500 via-red-500 to-orange-400" 
                : config.themeAccent === "silver" 
                ? "from-zinc-300 via-slate-100 to-zinc-400" 
                : "from-purple-500 via-violet-400 to-fuchsia-400"
            } bg-clip-text text-transparent uppercase text-[10px]`}>
              The King Speaks
            </span>
            <span className="text-zinc-750 font-mono text-[9px]">|</span>
            <span className={`text-[10px] font-mono tracking-widest uppercase font-bold animate-pulse ${theme.textColor}`}>
              System Obeys
            </span>
          </div>
        </div>
      </div>

      {/* Floating Tactical Actions Group in upper-right corner */}
      <div className="absolute top-4 right-4 z-40 flex items-center space-x-2">
        {/* Live Grid Online dot wrapper */}
        <span className="hidden sm:flex items-center space-x-1.5 border border-white/[0.06] bg-zinc-900/40 px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-400 shadow-md backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shadow-[0_0_8px_#10b981]" />
          <span className="text-zinc-300">Live Grid</span>
        </span>

        {activeSessionId !== null && (
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ 
              scale: sidebarOpen ? 0 : 1, 
              opacity: sidebarOpen ? 0 : 1,
              pointerEvents: sidebarOpen ? "none" : "auto" 
            }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative"
          >
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              title="Session Control Matrix"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white transition active:scale-95 duration-100 cursor-pointer shadow-lg backdrop-blur-md"
            >
              <MoreHorizontal size={16} />
            </button>
 
             {showDropdown && (
               <>
                 {/* Backdrop overlay to close when clicking outside */}
                 <div 
                   className="fixed inset-0 z-40 bg-transparent" 
                   onClick={() => setShowDropdown(false)} 
                 />
                 
                 {/* Float Options Dropdown Container */}
                 <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-fade-in font-mono text-[11px] text-zinc-300">
                   <div className="px-2.5 py-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1 select-none">
                     Session Actions
                   </div>
 
                   {/* Pin Option */}
                   <button
                     onClick={() => {
                       setShowDropdown(false);
                       if (onTogglePinSession) onTogglePinSession(activeSessionId);
                     }}
                     className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-2 hover:bg-white/5 text-left hover:text-white transition cursor-pointer"
                   >
                     {pinnedSessionIds.includes(activeSessionId) ? (
                       <>
                         <PinOff size={13} className="text-amber-500 shrink-0" />
                         <span>Unpin Tactical Chat</span>
                       </>
                     ) : (
                       <>
                         <Pin size={13} className="text-zinc-500 hover:text-amber-400 shrink-0 animate-pulse" />
                         <span>Pin Tactical Chat</span>
                       </>
                     )}
                   </button>
 
                   {/* Rename Option */}
                   <button
                     onClick={() => {
                       setShowDropdown(false);
                       setNewSessionTitle("");
                       setRenameModalOpen(true);
                     }}
                     className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-2 hover:bg-white/5 text-left hover:text-white transition cursor-pointer"
                   >
                     <Edit2 size={13} className="text-sky-400 shrink-0" />
                     <span>Rename Chat</span>
                   </button>
 
                                                           {/* Support Option */}
                    <a
                      href={`https://wa.me/2348147648714?text=Hello%20Igris%20Support%2C%20I%20need%20tactical%20assistance%20with%20Active%20Session%20%23${activeSessionId || "Main"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowDropdown(false)}
                      className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-2 hover:bg-emerald-500/10 text-left hover:text-emerald-400 text-zinc-300 transition cursor-pointer"
                    >
                      <PhoneCall size={13} className="text-emerald-400 shrink-0 animate-pulse" />
                      <span>Support & Contact</span>
                    </a>
 
                   <div className="h-[1px] bg-white/5 my-1" />
 
                   {/* Delete Option */}
                   <button
                     onClick={() => {
                       setShowDropdown(false);
                       if (onDeleteSession) onDeleteSession(activeSessionId);
                     }}
                     className="flex w-full items-center space-x-2.5 rounded-lg px-2.5 py-2 hover:bg-rose-500/10 text-rose-400 font-bold text-left transition cursor-pointer"
                  >
                    <Trash2 size={13} className="text-rose-400 shrink-0" />
                    <span>Delete Chat Session</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* 2. Chat Timeline Section - Padding matched perfectly for floating buttons blend */}
      <div className="flex-1 overflow-y-auto px-4 pt-20 pb-6 md:px-8 space-y-6 scrollbar-thin z-10">
        {messages.length === 0 ? (
          /* Empty state view */
          <div className="h-full flex flex-col justify-center items-center max-w-2xl mx-auto space-y-6 text-center select-none py-12">
            <div className="space-y-2">
              <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${theme.emptyStateIcon}`}>
                <Sparkles size={26} className={`${theme.emptyStateSparkles} animate-bounce`} />
              </div>
              <h2 className="font-display text-2xl font-black tracking-wide text-white">
                ARISE, MY KNOWLEDGE ARCHIVE
              </h2>
              <p className="text-xs text-zinc-400 leading-normal max-w-md mx-auto">
                As your loyal Blood-Red Commander, I hold ultimate devotion to your scripts, databases and content pipelines. Ask any technical command or draft scripts.
              </p>
            </div>

            {/* Real Network Core Connected */}
          </div>
        ) : (
          /* Timeline messages list resembling ChatGPT styled layout */
          <div className="max-w-3xl mx-auto space-y-8 py-4 px-1">
            {messages.map((msg) => {
              const isUser = msg.role === "user";

              if (isUser) {
                return (
                  <div
                    key={msg.id}
                    className="flex flex-col items-end w-full space-y-1.5 mb-6 group animate-fade-in"
                  >
                    {/* User Label + Timestamp */}
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 mr-2 selection:bg-none">
                      <span className="font-semibold uppercase tracking-wider text-zinc-400">You</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Compact, clean user chat bubble styled with an elegant blurry glass canvas */}
                    <div 
                      onClick={() => handleUserMessageClick(msg.id, msg.content)}
                      className="relative flex flex-col max-w-[85%] md:max-w-[70%] rounded-[20px] bg-white/[0.06] hover:bg-white/[0.08] border border-white/10 hover:border-white/15 backdrop-blur-md text-zinc-100 px-5 pt-3.5 pb-8 shadow-xl transition-all duration-300 cursor-pointer active:scale-[0.99] group/bubble"
                    >
                      {msg.content ? (
                        <>
                          <div className="text-[14px] leading-relaxed select-text w-full">
                            {false ? (
                              <div className="flex items-center space-x-2 text-[11.5px] font-mono text-zinc-400">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                                <span className="uppercase font-bold tracking-wide">Cognitive Core Scan: {msg.fileName}</span>
                              </div>
                            ) : (
                              renderMessageContent(msg.content)
                            )}
                          </div>

                          {msg.files && msg.files.length > 0 ? (
                            <div className="mt-3 w-full flex flex-wrap gap-3">
                              {msg.files.map((file, idx) => (
                                file.fileType === "image" && file.previewUrl ? (
                                  <button
                                    key={idx}
                                    onClick={() => openLightbox(file.previewUrl, file.fileName)}
                                    className="p-0 m-0 border-0 bg-transparent cursor-pointer rounded-lg"
                                  >
                                    <FilePreview
                                      fileName={file.fileName}
                                      fileType={file.fileType as any}
                                      previewUrl={file.previewUrl}
                                      pageCount={file.pageCount}
                                    />
                                  </button>
                                ) : (
                                  <FilePreview
                                    key={idx}
                                    fileName={file.fileName}
                                    fileType={file.fileType as any}
                                    pageCount={file.pageCount}
                                  />
                                )
                              ))}
                            </div>
                          ) : null}
                          
                          {/* Absolute corner dynamic copy icon (appears on hover on desktop, or instantly on tap on mobile, and fades out later) */}
                          <div 
                            className={`absolute bottom-2 right-3 flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-zinc-950/75 border border-white/5 text-[10px] text-zinc-400 backdrop-blur-md transition-all duration-300 ${
                              tappedMessageId === msg.id 
                                ? "opacity-100 scale-100 translate-y-0 text-emerald-400" 
                                : "opacity-0 md:group-hover/bubble:opacity-100 scale-90 translate-y-1"
                            }`}
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check size={11} className="text-emerald-400 shrink-0" />
                                <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} className="shrink-0" />
                                <span className="text-[9px] font-mono tracking-wider hidden group-hover/bubble:inline">COPY</span>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center space-x-1 py-1 px-1">
                          <div className={`h-1.5 w-1.5 rounded-full ${theme.glowingPulseDot} animate-bounce`} style={{ animationDelay: "0s", animationDuration: "1s" }} />
                          <div className={`h-1.5 w-1.5 rounded-full ${theme.glowingPulseDot} animate-bounce`} style={{ animationDelay: "150ms", animationDuration: "1s" }} />
                          <div className={`h-1.5 w-1.5 rounded-full ${theme.glowingPulseDot} animate-bounce`} style={{ animationDelay: "300ms", animationDuration: "1s" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Assistant (Igris Commander) Response Style - Elegant left block on clean canvas with no box border
              return (
                <div
                  key={msg.id}
                  className="w-full flex flex-col items-start space-y-2 mb-8 group pl-1 animate-fade-in border-b border-white/[0.02] last:border-0 pb-6"
                >
                  {/* Assistant Identity & Timestamp */}
                  <div className="flex items-center space-x-3 text-[10px] font-mono text-zinc-400">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-zinc-950 text-[10px] font-black tracking-tighter ${theme.textColor}`}>
                      IG
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold uppercase tracking-widest text-zinc-200">Igris Commander</span>
                      <span className="text-zinc-650">•</span>
                      <span className="text-zinc-500">{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* Wide text content - no solid border or solid bubble for premium reading, like ChatGPT */}
                  <div className="w-full text-zinc-200 leading-relaxed font-sans text-sm md:text-[14.5px] pl-0.5 max-w-full overflow-hidden select-text">
                    {msg.content ? (
                      <>
                        <div className="prose prose-invert max-w-none text-zinc-200">
                          {renderMessageContent(msg.content)}
                        </div>

                        {/* Large, sleek copy action underneath the assistant message */}
                        <div className="flex items-center justify-start mt-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="flex items-center space-x-1 p-1 px-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/5 transition active:scale-95 touch-manipulation cursor-pointer"
                            title="Copy response text"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check size={11} className="text-emerald-400" />
                                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Copied</span>
                              </>
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-1.5 py-4 pl-1">
                        <div className={`h-2.5 w-2.5 rounded-full ${theme.glowingPulseDot} animate-bounce`} style={{ animationDelay: "0s", animationDuration: "1s" }} />
                        <div className={`h-2.5 w-2.5 rounded-full ${theme.glowingPulseDot} animate-bounce`} style={{ animationDelay: "150ms", animationDuration: "1s" }} />
                        <div className={`h-2.5 w-2.5 rounded-full ${theme.glowingPulseDot} animate-bounce`} style={{ animationDelay: "300ms", animationDuration: "1s" }} />
                        <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase pl-2 animate-pulse">Waiting for IGRIS...</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
            onClick={closeLightbox}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <img
                src={lightboxUrl}
                alt={lightboxName || "preview"}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeLightbox();
                }}
                className="absolute top-2 right-2 rounded-full bg-zinc-900/60 p-2 text-white border border-white/10"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Message Input Area */}
      <div className="p-4 md:p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md z-10 relative">
        
        {/* Floating Glass Tactical Presets Panel */}
        {showTacticalMenu && (
          <div className="absolute bottom-[72px] md:bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-zinc-950/90 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl z-50 flex flex-col space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
              <span className="text-[9px] font-mono font-black tracking-widest text-zinc-500 uppercase flex items-center space-x-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${theme.tagGlow}`} />
                <span>COGNITIVE COMMAND CORE</span>
              </span>
              <button 
                onClick={() => setShowTacticalMenu(false)}
                className="text-zinc-500 hover:text-zinc-300 text-[9px] font-bold font-mono"
              >
                ✕ CLOSE
              </button>
            </div>
            
             <button
              type="button"
              onClick={() => {
                if (isSending) return;
                if (!activeSessionId) {
                  onCreateSession();
                  setTimeout(() => {
                    onSendMessage("ARISE");
                  }, 400);
                } else {
                  onSendMessage("ARISE");
                }
                setShowTacticalMenu(false);
              }}
              disabled={isSending}
              className="flex items-center space-x-2 w-full text-left p-2 rounded-xl hover:bg-white/[0.04] transition border-2 border-transparent hover:border-[#1D9E75]/20 active:scale-98"
            >
              <div className="p-1 rounded bg-zinc-900 border border-white/5">
                <Flame size={11} className="text-rose-400 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-zinc-200 font-bold truncate">⚡ Trigger Arise Command</p>
                <p className="text-[8.5px] text-rose-500/80 truncate font-mono">Activate supreme commander boot mode</p>
              </div>
            </button>

            <a
              href="https://wa.me/2348147648714"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowTacticalMenu(false)}
              className="flex items-center space-x-2 w-full text-left p-2 rounded-lg hover:bg-emerald-500/10 transition border border-transparent hover:border-emerald-500/20 active:scale-98 select-none"
            >
              <div className="p-1 rounded bg-zinc-900 border border-white/5 text-emerald-400">
                <Sparkles size={11} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-zinc-200 font-bold truncate">💬 WhatsApp Creator (King)</p>
                <p className="text-[8.5px] text-emerald-400/80 truncate font-mono">Secure DM: +234 814 764 8714</p>
              </div>
            </a>

            <a
              href="https://t.me/igris_MDbot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowTacticalMenu(false)}
              className="flex items-center space-x-2 w-full text-left p-2 rounded-lg hover:bg-sky-500/10 transition border border-transparent hover:border-sky-500/20 active:scale-98 select-none"
            >
              <div className="p-1 rounded bg-zinc-900 border border-white/5 text-sky-400">
                <Terminal size={11} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-zinc-200 font-bold truncate">✈️ Telegram Bot Portal</p>
                <p className="text-[8.5px] text-sky-400/80 truncate font-mono">Connect path: @igris_MDbot</p>
              </div>
            </a>
          </div>
        )}

        {/* Background attachment processing statuses */}
        {isFileAnalyzing && attachmentStatus && (
          <div id="tactical-scan-loader" className="max-w-3xl mx-auto flex items-center space-x-2 bg-purple-500/5 border border-purple-500/10 rounded-xl px-4 py-2.5 mb-2.5 text-xs text-purple-300 font-mono shadow-lg select-none">
            <Loader2 className="animate-spin text-purple-400 shrink-0" size={14} />
            <span className="text-[10px] tracking-wider uppercase font-black text-purple-400">{attachmentStatus}</span>
          </div>
        )}

        {/* ChatGPT Style Multiple Attachments Chips Bar */}
        <AttachmentChips attachments={activeAttachments} onRemove={handleRemoveAttachment} />

                {/* ChatGPT Style Modular Chat Input Form */}
        <ChatInput
          inputText={inputText}
          onChangeInput={setInputText}
          onSubmit={handleSendSubmit}
          isSending={isSending}
          isFileAnalyzing={isFileAnalyzing}
          onFileSelect={handleFileSelected}
          activeSessionId={activeSessionId}
          theme={theme}
          hasAttachments={activeAttachments.length > 0}
          onCancelResponse={onCancelResponse}
        />
      </div>

      {/* Rename Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                <Edit2 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-widest text-zinc-300 uppercase">Rename Command</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Designate a new title for tactical chat session</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newSessionTitle.trim() && activeSessionId !== null && onRenameSession) {
                  onRenameSession(activeSessionId, newSessionTitle.trim());
                  if (onShowToast) onShowToast("success", "Tactical title updated successfully.");
                }
                setRenameModalOpen(false);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Enter custom combat title..."
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                autoFocus
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-sky-500 transition duration-150 outline-none"
              />

              <div className="flex items-center space-x-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900 px-4 py-2.5 text-[11px] text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!newSessionTitle.trim()}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90 px-4 py-2.5 text-[11px] font-bold text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  RENAME
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}