import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy";
}

export default function LegalModal({ isOpen, onClose, initialTab = "terms" }: LegalModalProps) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_0_50px_-12px_rgba(29,158,117,0.25)]"
          >
            {/* Header: Tactical Branding */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1D9E75]">Legal Directive</h2>
                <p className="text-lg font-medium text-zinc-100">Terms & Compliance</p>
              </div>
              <button 
                onClick={onClose} 
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 px-6 pt-4">
              {["terms", "privacy"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t as "terms" | "privacy")}
                  className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    tab === t ? "text-[#1D9E75]" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t}
                  {tab === t && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 h-[2px] w-full bg-[#1D9E75]" />
                  )}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="px-6 py-6">
              <div className="h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div className="prose prose-invert prose-sm">
                  <p className="text-zinc-400 leading-relaxed">
                    {tab === "terms" 
                      ? "Operational Protocol: By accessing the IGRIS neural framework, you acknowledge that all data streams are monitored. Failure to adhere to these parameters will result in immediate termination of access."
                      : "Privacy Directive: Your data is encrypted within the shadow clusters. We collect telemetry to optimize execution; privacy is not a request, it is an architectural requirement."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-zinc-900/50 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-[#1D9E75] px-6 py-2 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-[#2ed39e]"
              >
                Acknowledge
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}