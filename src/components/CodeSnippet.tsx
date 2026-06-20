import React, { useMemo, useState } from "react";
import { Copy, Check, Play, Maximize2 } from "lucide-react";
import CodePreviewModal, { buildPreviewDoc } from "./CodePreviewModal";

const previewableLanguages = new Set(["html", "htm", "css", "js", "javascript", "jsx", "tsx"]);

interface CodeSnippetProps {
  key?: React.Key;
  code: string;
  language?: string;
}

export default function CodeSnippet({ code, language = "code" }: CodeSnippetProps) {
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const normalizedLanguage = (language || "").toLowerCase().trim();
  const canPreview = previewableLanguages.has(normalizedLanguage);
  const inlinePreviewSrcDoc = useMemo(() => buildPreviewDoc(code, language) ?? "", [code, language]);

  const handlePreview = () => {
    if (!canPreview) return;
    setPreviewKey((prev) => prev + 1);
    setPreviewExpanded((current) => !current);
  };

  const handleOpenFullscreen = () => {
    if (!canPreview) return;
    setPreviewKey((prev) => prev + 1);
    setFullscreenOpen(true);
  };

  const handleCopy = async () => {
    const fallbackCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = code;
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

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        fallbackCopy();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      try {
        fallbackCopy();
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy!", err, fallbackErr);
      }
    }
  };

  return (
    <>
      <div className="relative my-4 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
        {/* Top Bar resembling elite IDE */}
        <div className="flex items-center justify-between border-b border-white/5 bg-zinc-900/60 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="ml-2 font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              {language}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-zinc-400 hover:bg-white/10 hover:text-white transition-all active:scale-95 duration-150"
              title="Copy Code"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handlePreview}
              className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs transition-all active:scale-95 duration-150 ${
                canPreview
                  ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
                  : "bg-white/5 text-zinc-500 hover:bg-white/10"
              }`}
              title={canPreview ? "Preview code" : "Preview unsupported for this language"}
              disabled={!canPreview}
            >
              <Play size={13} className={canPreview ? "text-emerald-300" : "text-zinc-500"} />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {canPreview && previewExpanded && (
          <div className="border-b border-white/10 bg-zinc-950/90 px-4 py-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Live Preview</div>
                <div className="text-xs text-zinc-400">Rendered above the code block in a secure sandbox.</div>
              </div>
              <button
                type="button"
                onClick={handleOpenFullscreen}
                className="inline-flex items-center gap-2 rounded-md bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
              >
                <Maximize2 size={14} />
                Fullscreen
              </button>
            </div>
            <div className="h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
              <iframe
                key={`${previewKey}-inline`}
                title="igris-inline-code-preview"
                sandbox="allow-scripts allow-same-origin"
                srcDoc={inlinePreviewSrcDoc}
                className="h-full w-full border-0 bg-black"
              />
            </div>
          </div>
        )}

        <div className="max-h-[480px] overflow-auto p-4 font-mono text-[13px] leading-relaxed text-zinc-100 select-text scrollbar-thin">
          <pre className="m-0 whitespace-pre scrollbar-none">
            <code>{code}</code>
          </pre>
        </div>
      </div>
      <CodePreviewModal
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        code={code}
        language={language}
        previewKey={previewKey}
      />
    </>
  );
}

// Utility to parse markdown string into list of text blocks and code blocks
export function parseMarkdownBlocks(text: string) {
  const parts: { type: "text" | "code"; content: string; lang?: string }[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push({ type: "text", content: textBefore });
    }
    
    parts.push({
      type: "code",
      lang: match[1] || "code",
      content: match[2].trimEnd(),
    });
    
    lastIndex = regex.lastIndex;
  }

  const textAfter = text.substring(lastIndex);
  if (textAfter) {
    parts.push({ type: "text", content: textAfter });
  }

  return parts;
}
