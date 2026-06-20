import React, { useState } from "react";
import { X, Globe, Shield, RefreshCw, Terminal, Check } from "lucide-react";
import { AppConfig } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onChangeConfig: (newConfig: AppConfig) => void;
  onTestConnection: (url: string) => Promise<void>;
  isTestingConnection: boolean;
  connectionStatus: "idle" | "connected" | "failed";
  telegramLinked: boolean;
  onTelegramLinkedChange: (linked: boolean) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onTestConnection,
  isTestingConnection,
  connectionStatus,
  telegramLinked,
  onTelegramLinkedChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Frame Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-purple-500/20 bg-zinc-950/90 text-white shadow-2xl backdrop-blur-2xl transition-all duration-300 md:max-w-md">
        {/* Border glow decoration */}
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-violet-600/10 blur-2xl" />
        <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-purple-600/10 blur-2xl" />

        {/* Head */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/10 text-purple-400">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold tracking-wide text-zinc-100">
                SYSTEM CORE CONFIG
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-purple-400 font-mono">
                Commander Interface v0.1.0
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Base URL Settings */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">
              IGRIS Secure Server Base
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Globe size={14} />
                </span>
                <input
                  type="text"
                  value="••••••••••••••••••••••••••••••••••••"
                  disabled
                  readOnly
                  className="w-full rounded-lg border border-white/10 bg-zinc-900/40 py-2 pl-9 pr-16 font-mono text-sm text-zinc-500 select-none cursor-not-allowed"
                />
                <span className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[9px] uppercase font-bold tracking-wider text-emerald-400 font-mono border-l border-white/5 bg-zinc-950/20">
                  SECURED
                </span>
              </div>
              <button
                type="button"
                onClick={() => onTestConnection(config.apiBaseUrl)}
                disabled={isTestingConnection}
                className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-50 transition active:scale-95 text-xs font-mono font-medium cursor-pointer"
              >
                {isTestingConnection ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                ) : (
                  "TEST"
                )}
              </button>
            </div>
            {/* Status alerts */}
            {connectionStatus === "connected" && (
              <p className="text-[11px] text-emerald-400 flex items-center space-x-1 font-mono">
                <Check size={12} />
                <span>ONLINE: Client successfully reached the database!</span>
              </p>
            )}
            {connectionStatus === "failed" && (
              <p className="text-[11px] text-red-400 font-mono">
                ⚠️ REACH LIMIT: Gateway time out (Be sure your uvicorn is running).
              </p>
            )}
            <p className="text-[10px] text-zinc-500 leading-normal">
              Note: Direct browser connection requires CORS compatibility inside your FastAPI/Uvicorn server setup.
            </p>
          </div>

          <hr className="border-white/5" />

          {/* Telegram Account Status Segment */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">
              TELEGRAM SYNC STATUS
            </label>
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] p-3.5">
              <div className="flex items-center space-x-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  telegramLinked ? "bg-sky-500/15 text-sky-400 border border-sky-500/20" : "bg-zinc-805/40 text-zinc-500"
                }`}>
                  <span className="text-xs">✈️</span>
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold tracking-wide">
                    {telegramLinked ? "STATUS: PAIRED ⚔️" : "STATUS: UNPAIRED"}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                    {telegramLinked ? "Dashboard is fully linked to Telegram Bot." : "No Telegram active binding registered."}
                  </p>
                </div>
              </div>
              {telegramLinked ? (
                <button
                  type="button"
                  onClick={() => onTelegramLinkedChange(false)}
                  className="rounded-lg border border-red-500/30 bg-red-950/20 px-2.5 py-1 text-[10px] font-mono font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 active:scale-95 transition cursor-pointer"
                >
                  UNLINK
                </button>
              ) : (
                <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">
                  UNLINKED
                </span>
              )}
            </div>
          </div>

          <hr className="border-white/5" />

          <hr className="border-white/5" />
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">
              Core Core Glow Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "violet", name: "Igris Purple", color: "bg-purple-600" },
                { id: "crimson", name: "Blood Red", color: "bg-rose-600" },
                { id: "silver", name: "Silver Metal", color: "bg-zinc-400" },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onChangeConfig({ ...config, themeAccent: theme.id as any })}
                  className={`flex items-center space-x-2 rounded-lg border p-2 text-left transition duration-200 hover:bg-white/5 ${
                    config.themeAccent === theme.id
                      ? "border-purple-500/50 bg-purple-500/5"
                      : "border-white/5 bg-transparent"
                  }`}
                >
                  <span className={`h-3.5 w-3.5 rounded-full ${theme.color} ring-1 ring-white/10`} />
                  <span className="text-[11px] font-medium text-zinc-300 font-mono truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Foot of Card */}
        <div className="flex justify-end space-x-3 bg-white/[0.02] px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-transparent px-4 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-mono font-medium text-white hover:bg-purple-500 shadow-md shadow-purple-600/20 active:scale-95 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
