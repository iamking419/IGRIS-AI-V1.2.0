import React from "react";
import { X, Link, AlertTriangle, Construction } from "lucide-react";

// ==========================================
// ⚔️ TELEGRAM BOT URL CONFIGURATION
// Update this link below whenever your Telegram command bot goes online!
// ==========================================
const TELEGRAM_BOT_URL = "https://t.me/igris_MDbot";

interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: "violet" | "crimson" | "silver";
  onSuccessToast: (text: string) => void;
  activeApiBaseUrl: string;
  activeAuthToken: string;
  onTelegramLinkedChange: (linked: boolean) => void;
}

export default function TelegramLinkModal({
  isOpen,
  onClose,
  accentColor,
}: TelegramLinkModalProps) {
  if (!isOpen) return null;

  const getAccentStyles = () => {
    switch (accentColor) {
      case "crimson":
        return {
          textColor: "text-rose-400 font-mono",
          borderGlow: "border-rose-500/30",
          glowBg: "bg-rose-500/10",
          accentBtn: "bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30",
          accentDot: "bg-rose-500 shadow-[0_0_8px_#f43f5e]",
          outlineText: "text-rose-300",
        };
      case "silver":
        return {
          textColor: "text-zinc-300 font-mono",
          borderGlow: "border-zinc-500/30",
          glowBg: "bg-zinc-500/10",
          accentBtn: "bg-zinc-600 hover:bg-zinc-500 shadow-md shadow-zinc-600/30",
          accentDot: "bg-zinc-300 shadow-[0_0_8px_#d4d4d8]",
          outlineText: "text-zinc-200",
        };
      default:
        return {
          textColor: "text-purple-400 font-mono",
          borderGlow: "border-purple-500/30",
          glowBg: "bg-purple-500/10",
          accentBtn: "bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30",
          accentDot: "bg-purple-500 shadow-[0_0_8px_#a78bfa]",
          outlineText: "text-purple-300",
        };
    }
  };

  const style = getAccentStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dynamic blurred overlay backdrop */}
      <div 
        className="absolute inset-0 bg-[#000000]/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Cyber Hacker Panel container */}
      <div className={`relative w-full max-w-lg overflow-hidden rounded-2xl border ${style.borderGlow} bg-[#020204]/95 text-[#eceff4] shadow-2xl backdrop-blur-3xl transition-all duration-300`}>
        
        {/* Glow decoration */}
        <div className={`absolute -top-16 -left-16 h-32 w-32 rounded-full ${style.glowBg} blur-3xl`} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-zinc-950/40 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.glowBg} ${style.textColor}`}>
              <Link size={16} />
            </div>
            <div>
              <h3 className="font-display text-sm font-black tracking-wider text-zinc-100 uppercase">
                TELEGRAM BOT PORTAL
              </h3>
              <p className="text-[9px] uppercase tracking-widest text-zinc-550 font-mono">
                COGNITIVE CHANNELS OVERVIEW
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-550 hover:bg-white/10 hover:text-white transition duration-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-center">
          
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
            <Construction size={28} />
          </div>

          <div className="space-y-2">
            <h4 className="font-display text-base font-black tracking-widest text-zinc-150 uppercase font-mono">
              TELEGRAM INTEGRATION <span className="text-yellow-405">COMING SOON</span> ⚔️
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto font-sans">
              The pairing endpoint has been decommissioned on the server pipeline. We are currently rebuilding the <b>@igris_MDbot</b> terminal connection engine for dynamic sync synchronization!
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
            <div className="flex items-start space-x-2.5 text-left text-xs bg-yellow-950/10 border border-yellow-500/20 p-3 rounded-lg">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-zinc-400 leading-normal font-sans">
                <span className="text-yellow-400 font-bold font-mono">Terminal Blueprint Log:</span> The pairing action on the client-side has been successfully decoupled. The bot link placeholder below is ready to be loaded once the shadow server is unchained.
              </div>
            </div>

            <div className="pt-2">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs px-5 py-3 tracking-wider transition duration-150 active:scale-95 shadow-lg shadow-sky-600/10 hover:shadow-sky-605/25 cursor-pointer uppercase w-full"
              >
                <span>✈️ Launch Telegram Bot Link</span>
              </a>
              <p className="text-[10px] text-zinc-500 tracking-wider font-mono mt-2 uppercase">
                Direct to {TELEGRAM_BOT_URL}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="flex justify-end items-center bg-zinc-950/40 px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
}
