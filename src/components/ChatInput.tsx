import React, { useRef } from "react";
import { Paperclip, Loader2, Send, Square, ZapOff } from "lucide-react";

interface ChatInputProps {
  inputText: string;
  onChangeInput: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
  isFileAnalyzing: boolean;
  onFileSelect: (file: File) => void;
  activeSessionId: number | null;
  theme: {
    sendBtn: string;
  };
  hasAttachments: boolean;
  onCancelResponse?: () => void;
}

export default function ChatInput({
  inputText,
  onChangeInput,
  onSubmit,
  isSending,
  isFileAnalyzing,
  onFileSelect,
  activeSessionId,
  theme,
  hasAttachments,
  onCancelResponse,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: any) => {
        onFileSelect(file as File);
      });
      e.target.value = "";
    }
  };

  const isButtonDisabled = (!inputText.trim() && !hasAttachments) || isSending || isFileAnalyzing;

  return (
    <form
      id="combat-input-form"
      onSubmit={onSubmit}
      className="max-w-3xl mx-auto relative group select-none"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}  
      name="igris-form"
      aria-label="igris-form"
    >
      <div className="relative rounded-2xl border border-white/10 bg-zinc-900/90 p-2 backdrop-blur-xl flex items-center justify-between gap-1.5 shadow-2xl transition duration-150 hover:border-white/15">
        
        {/* Paperclip upload button */}
        <button
          id="btn-upload-paperclip"
          type="button"
          disabled={isFileAnalyzing || isSending || !activeSessionId}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
          title="Upload image, code, pdf, or docs to analyze"
        >
          {isFileAnalyzing ? <Loader2 className="animate-spin text-purple-400" size={15} /> : <Paperclip size={15} />}
        </button>

        <input
          id="hidden-file-uploader"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept=".png,.jpg,.jpeg,.webp,.py,.js,.ts,.html,.css,.php,.java,.c,.cpp,.json,.pdf,.docx,.txt"
        />

        {/* Text input - anti-autofill attributes added */}
        <input
          id="igris-input"
          name="igris_tactical_cmd"
          type="text"
          value={inputText}
          data-form-type="other"
          data-lpignore="true"
          onChange={(e) => onChangeInput(e.target.value)}
          disabled={isSending || !activeSessionId}
          placeholder={
            activeSessionId
              ? "Send a command… (supports paste: images + files)"
              : "Select or spawn active session first…"
          }
          className="flex-1 bg-transparent py-3 px-3 font-sans text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0 disabled:opacity-50"
          autoComplete="one-time-code"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          role="textbox"
          aria-autocomplete="none"
          onPaste={(e) => {
            if (!activeSessionId) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (!item) continue;
              if (item.type && item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) onFileSelect(file);
              }
            }
          }}
        />

        {/* Send / Cancel button - styled to match IGRIS tactical interface */}
        {isSending ? (
          /* CANCEL BUTTON - Tactical stop with crimson/rose glow */
          <button
            id="btn-cancel-response"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancelResponse?.();
            }}
            className="group flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 text-rose-400 transition-all duration-200 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 cursor-pointer"
            title="Cancel transmission"
          >
            <ZapOff size={13} className="animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase hidden sm:inline">Stop</span>
          </button>
        ) : (
          /* SEND BUTTON - Normal dispatch with theme accent */
          <button
            id="btn-submit-message"
            type="submit"
            disabled={isButtonDisabled}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-purple-950 transition-all duration-200 ${
              isButtonDisabled
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5 opacity-50"
                : theme.sendBtn + " cursor-pointer scale-100 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/10"
            }`}
            title="Dispatch squad query"
          >
            <Send size={15} />
          </button>
        )}
      </div>
    </form>
  );
}