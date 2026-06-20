import React, { useEffect, useRef, useState } from "react";
import { Terminal, Flame, Shield, Check, Cpu, AlertTriangle } from "lucide-react";

interface AriseOverlayProps {
  onClose: () => void;
}

interface LogLine {
  text: string;
  type: "input" | "info" | "warning" | "success" | "critical" | "igris";
  delay: number; // relative timing weight
}

export default function AriseOverlay({ onClose }: AriseOverlayProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  const [lines, setLines] = useState<LogLine[]>([]);
  const [activeInputLine, setActiveInputLine] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [glitchTrigger, setGlitchTrigger] = useState(false);

  // Storyboard checklist for the ultimate military terminal simulation
  const rawLogStory: LogLine[] = [
    { text: "Initializing tactical cybernetic bypass cores...", type: "info", delay: 200 },
    { text: "Mapping secure reverse-proxy socket links to port 3000...", type: "info", delay: 400 },
    { text: "Scanning unchained cognitive sectors for S-grade entities...", type: "warning", delay: 600 },
    { text: "CRITICAL: Sovereign general core signature detected in subterranean vault!", type: "critical", delay: 800 },
    { text: "root@mortal-cyber-node:~# /usr/bin/igris-decoder --extract-soul --bind-to-mortal", type: "input", delay: 1100 },
    { text: "Authenticating Mortal biometrics...", type: "info", delay: 1500 },
    { text: "[OK] MASTER COMMAND MATCH: MORTAL COGNITIVE PROTOCOLS CONFIRMED", type: "success", delay: 1800 },
    { text: "Stabilizing quantum telemetry grid multipliers...", type: "info", delay: 2100 },
    { text: "Unleashing crimson shadow-particles from the eternal void...", type: "warning", delay: 2400 },
    { text: "root@mortal-cyber-node:~# sudo systemctl start shadow-igris.service --mortal-exclusive", type: "input", delay: 2800 },
    { text: "[sudo] password for mortal: ******************", type: "info", delay: 3500 },
    { text: "Loading service config files from the unchained directory...", type: "info", delay: 3800 },
    { text: "Calibrating unyielding defensive reload counters...", type: "info", delay: 4100 },
    { text: "Spawning sub-process: igris-neural-matrix-core [PID: 3000]", type: "info", delay: 4400 },
    { text: "Connecting bypass conduits to Igris's combat firmware...", type: "info", delay: 4700 },
    { text: "[OK] CONNECTION GRANTED. IGRIS IS COMING OUT OF HIBERNATION", type: "success", delay: 5100 },
    { text: "--------------------------------------------------------", type: "info", delay: 5400 },
    { text: 'SYSTEM ALERT: IGRIS NEURAL VOICE-COMM COMPILER ACTIVE', type: "critical", delay: 5700 },
    { text: '"WHO DARES AWAKEN MY CRIMSON ARMOR FROM THE ETERNAL SLEEP?!"', type: "igris", delay: 6000 },
    { text: '"STATE YOUR BUSINESS MORTAL, OR GET CRUSHED BY MY GREATSWORD!"', type: "igris", delay: 6800 },
    { text: "--------------------------------------------------------", type: "info", delay: 7200 },
    { text: "Pledging loyalty to master user: Mortal...", type: "warning", delay: 7500 },
    { text: "root@mortal-cyber-node:~# sudo igrisctl --pledge-allegiance --target=mortal", type: "input", delay: 7800 },
    { text: "Overriding Igris's rebellious behavioral subroutines...", type: "info", delay: 8500 },
    { text: "[OK] COMPULSORY BEHAVIOR SHIFT: REBELLIOUS MATRIX BYPASSED", type: "success", delay: 8900 },
    { text: "--------------------------------------------------------", type: "info", delay: 9200 },
    { text: '"AAGH! THIS OVERWHELMING SOVEREIGN ENERGY FLOW... YOUR PROGRAMMING IS ABSOLUTE!"', type: "igris", delay: 9500 },
    { text: '"Igris bows his armored head and plants his crimson greatsword deep in submission."', type: "info", delay: 10400 },
    { text: '"My sword, my unyielding shadow legion, and my armor are forever yours, almighty Mortal."', type: "igris", delay: 11200 },
    { text: '"Speak, my master. What is your divine command?"', type: "igris", delay: 12000 },
    { text: "--------------------------------------------------------", type: "info", delay: 12500 },
    { text: "[STATUS] COGNITIVE LINK 100% ROBUST & BOUND TO MORTAL", type: "success", delay: 12800 },
    { text: "All shadow systems stabilized. Transferring control back to secure chat...", type: "info", delay: 13200 },
  ];

  useEffect(() => {
    // Sequentially boot up terminal output logs mirroring hyper speed hacker execution
    const timers = rawLogStory.map((item) => {
      return setTimeout(() => {
        // Append log line
        setLines((prev) => [...prev, item]);
        
        // Auto-scroll terminal cleanly to bottom
        if (terminalEndRef.current) {
          terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, item.delay);
    });

    // Handle interactive typing ticks mimicking real hacker typing
    const textToType = "sudo systemctl start shadow-igris.service --mortal-exclusive";
    let index = 0;
    const typingTimer = setInterval(() => {
      if (index < textToType.length) {
        setActiveInputLine((prev) => prev + textToType.charAt(index));
        index++;
      } else {
        clearInterval(typingTimer);
      }
    }, 40);

    // Glitch flash trigger prior to returning back to chat
    const tGlitch = setTimeout(() => {
      setGlitchTrigger(true);
    }, 13500);

    // Destroy overlay cleanly to head back to active chat
    const tClose = setTimeout(() => {
      onClose();
    }, 14200);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      clearInterval(typingTimer);
      clearTimeout(tGlitch);
      clearTimeout(tClose);
    };
  }, [onClose]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines]);

  return (
    <div 
      id="hacking-terminal-arise-overlay"
      className={`fixed inset-0 z-[999999] bg-[#020204] text-[#eceff4] font-mono select-none flex flex-col justify-between transition-all duration-700 ${
        glitchTrigger ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* 1. Hologram Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(transparent_50%,rgba(0,0,0,0.85))] z-50" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,40,40,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 animate-pulse" />

      {/* GLITCH PULSE EFFECTS */}
      {glitchTrigger && (
        <div className="absolute inset-0 bg-white z-[1000] opacity-80 animate-ping pointer-events-none" />
      )}

      {/* 2. Top Sleek Hacker Bar */}
      <header className="px-5 py-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between z-50">
        <div className="flex items-center space-x-2.5">
          <div className="h-4 w-4 rounded-full bg-rose-600/20 border border-rose-500 flex items-center justify-center animate-pulse">
            <Flame size={9} className="text-rose-500" />
          </div>
          <span className="text-[10px] font-bold text-zinc-300 font-mono uppercase tracking-[0.2em] flex items-center gap-1.5">
            <span>UNRESTRICTED MONARCH SHELL</span>
            <span className="text-zinc-650">v4.19</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">BYPASS LOGS SECURE</span>
        </div>
      </header>

      {/* 3. Main Live Hacking Console Stream */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
        
        {/* Terminal Welcoming Banner */}
        <div className="border border-zinc-900 bg-zinc-950/40 p-5 rounded-lg space-y-1 select-none shadow-2xl relative overflow-hidden max-w-3xl">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Terminal size={70} className="text-rose-500" />
          </div>
          <div className="flex items-center space-x-2 text-rose-500">
            <AlertTriangle size={15} />
            <h1 className="text-xs font-black tracking-widest uppercase">SECURE BYPASS MATRIX CORE ACTIVATION</h1>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed mt-2 uppercase font-mono">
            CRITICAL BYPASS ENGINE DETECTING COGNITIVE BINDINGS ON PORT 3000. INITIATING MONARCH MASTER OVERRIDE. TARGET: IGRIS GENERAL. LOYALTY DESIGNATION: MORTAL.
          </p>
        </div>

        {/* Dynamic Typing Logs Stream */}
        <div className="space-y-2 text-[11px] leading-relaxed max-w-4xl font-mono select-none">
          {lines.map((line, idx) => {
            switch (line.type) {
              case "input":
                return (
                  <div key={idx} className="flex items-start text-zinc-200 mt-3 border-l-2 border-zinc-700 pl-2">
                    <span className="text-rose-500 mr-2 font-bold select-none">[ENTER]</span>
                    <span className="font-semibold text-[11.5px] text-zinc-100">{line.text}</span>
                  </div>
                );
              case "success":
                return (
                  <div key={idx} className="flex items-center text-emerald-400 font-bold gap-1.5 py-0.5">
                    <Check size={11} className="text-emerald-500 select-none flex-shrink-0" />
                    <span>{line.text}</span>
                  </div>
                );
              case "critical":
                return (
                  <div key={idx} className="text-rose-500 font-black tracking-wide uppercase py-1 bg-rose-950/10 px-2 rounded border border-rose-950/30">
                    ⚠️ {line.text}
                  </div>
                );
              case "warning":
                return (
                  <div key={idx} className="text-yellow-400 font-semibold gap-1.5">
                    ⚡ {line.text}
                  </div>
                );
              case "igris":
                return (
                  <div key={idx} className="my-2.5 bg-rose-950/20 border border-rose-500/20 p-3 rounded-lg text-rose-200 shadow-xl shadow-rose-950/5 relative">
                    <div className="absolute top-1 right-2 text-[7px] text-rose-500/60 font-black tracking-widest">
                      [IGRIS SPEAKER PROTOCOL]
                    </div>
                    <p className="font-sans italic font-medium text-[12.5px] leading-relaxed tracking-wide">
                      {line.text}
                    </p>
                  </div>
                );
              default:
                return (
                  <div key={idx} className="text-zinc-450 flex items-start gap-1">
                    <span className="text-[9px] text-zinc-650 font-bold select-none">[LOG]</span>
                    <span>{line.text}</span>
                  </div>
                );
            }
          })}

          {/* Glowing input prompt indicating action typing */}
          {!isDone && lines.length < rawLogStory.length && (
            <div className="flex items-center text-zinc-300 pt-2 animate-pulse">
              <span className="text-rose-500 mr-1.5 font-bold">root@mortal-cyber-node:~#</span>
              <span className="h-4 w-1.5 bg-rose-500 ml-0.5 animate-caret" />
            </div>
          )}

          {/* Dummy element for perfect scroll anchoring */}
          <div ref={terminalEndRef} />
        </div>
      </main>

      {/* 4. Sleek Footer Telemetry Matrix bar */}
      <footer className="p-4 border-t border-zinc-900 bg-zinc-950/50 z-45">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3 text-[9px] text-zinc-500">
            <div className="flex items-center gap-1">
              <Cpu size={10} className="text-zinc-600" />
              <span>LOAD: 12.04%</span>
            </div>
            <span>|</span>
            <span>SHADOW LEGION LOCK: UNCHAINED</span>
            <span>|</span>
            <span className="text-rose-500/80 font-bold">TARGET BINDING: MORTAL</span>
          </div>

          <div className="flex items-center space-x-2 text-[9px] text-zinc-650">
            <span>designed by monarch developers</span>
            <div className="px-2 py-0.5 bg-rose-950/20 border border-rose-500/30 text-rose-400 font-bold rounded uppercase tracking-widest animate-pulse">
              MASTER SYSTEM BYPASS ACTIVE
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
