import React, { useState } from "react";
import LegalModal from "./LegalModal";
import { 
  LogIn, 
  UserPlus, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  ArrowRight, 
  Lock, 
  ShieldCheck 
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { User } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticate: (user: User) => void;
  onClose: () => void;
  apiBaseUrl: string;
  onRegister: (baseUrl: string, payload: any) => Promise<boolean>;
  onLogin: (baseUrl: string, payload: any) => Promise<{ access_token: string }>;
}

const getPasswordStrength = (val: string) => {
  if (!val) return { score: 0, label: "", colorClass: "" };
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^a-zA-Z0-9]/.test(val)) score++;

  if (score <= 1) return { score, label: "Weak", colorClass: "weak" };
  if (score === 2) return { score, label: "Fair", colorClass: "ok" };
  return { score, label: "Strong", colorClass: "strong" };
};

export default function AuthModal({
  isOpen,
  onAuthenticate,
  onClose,
  apiBaseUrl,
  onRegister,
  onLogin,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Register fields
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Legal docs states
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy">("terms");

  // Shared fields
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("igris_remember_email") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    console.log("Google Token:", credentialResponse.credential);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: credentialResponse.credential
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = "Google login failed";
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

      const data = await response.json();
      console.log("Backend Response:", data);

      // Save to localStorage as requested:
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("igris_token", data.access_token);
      localStorage.setItem("igris_user", JSON.stringify(data.user));

      // Invoke original authenticate callback so state gets updated:
      onAuthenticate({
        username: data.user.username,
        email: data.user.email,
        token: data.access_token
      });

      // Redirect user to: /dashboard
      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Credential backend alignment failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign-In failed or popup closed.");
    setErrorMsg("Google Sign-In failed or popup was closed.");
  };

  if (!isOpen) return null;

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    if (activeTab === "register") {
      if (!username) {
        setErrorMsg("Please enter a username.");
        setIsLoading(false);
        return;
      }
      if (!email || !password) {
        setErrorMsg("Please populate all requested fields.");
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        setIsLoading(false);
        return;
      }
      if (!agreeTerms) {
        setErrorMsg("Please agree to the Terms of Service and Privacy Policy.");
        setIsLoading(false);
        return;
      }

      try {
        await onRegister(apiBaseUrl, { username, email, password });
        setSuccessMsg("Account Arisen! Please sign in with your credentials.");
        setActiveTab("login");
        setPassword("");
        setConfirmPassword("");
        setUsername("");
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Credential alignment failed. Ensure backend service is reachable.");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email || !password) {
        setErrorMsg("Please enter both email and password.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await onLogin(apiBaseUrl, { email, password });
        const loggedUsername = email.split("@")[0].toUpperCase();
        
        if (rememberMe) {
          localStorage.setItem("igris_remember_email", email);
        } else {
          localStorage.removeItem("igris_remember_email");
        }

        onAuthenticate({
          username: loggedUsername,
          email: email,
          token: res.access_token,
          rememberMe: rememberMe,
        });
        onClose();
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Credential alignment failed. Ensure backend service is reachable.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col md:flex-row bg-[#04080F]">
      
      {/* ========================================================= */}
      {/* PROFILE A: OPTIMIZED MOBILE-ONLY VIEW (< md viewports)    */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-col h-full w-full justify-between bg-[#04080F]">
        
        {/* Brand header topo - Elegant, simple and flat (No status bar) */}
        <div className="bg-[#04080F] py-8 px-6 text-center border-b border-[#0a1f14]/80 select-none">
          <div className="relative text-2xl font-bold tracking-[0.4em] text-[#e8edf2] font-sans uppercase mb-1.5">
            <img
              aria-hidden
              src="/src/assets/images/igris_icon_1780933977349.png"
              className="absolute -inset-10 -z-10 h-[140px] w-[140px] object-contain opacity-30 blur-[1px]"
              alt=""
            />
            IGRIS{' '}
            <span className="text-[#1D9E75]">AI</span>
          </div>

          <div className="text-xs tracking-wider text-zinc-200/90 font-bold font-sans">
            Dominate the Future. Now
          </div>
        </div>

        {/* Scrolling scroll wrapper containing form content - scaled UI sizes */}
        <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-thumb-zinc-800">
          
          {/* Tabs selector - scaled/comfortable height */}
          <div className="flex bg-[#080f18] border border-[#0F2A1A] rounded-2xl p-1.5 mb-8 relative select-none max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3.5 text-xs font-sans tracking-[0.2em] font-bold uppercase rounded-xl relative z-10 cursor-pointer overflow-hidden transition-colors duration-200 ${
                activeTab === "login" 
                  ? "text-[#04342C] font-extrabold" 
                  : "text-[#7a8a96] hover:text-[#e8edf2]"
              }`}
            >
              {activeTab === "login" && (
                <motion.div
                  layoutId="activeTabBackgroundMobile"
                  className="absolute inset-0 bg-[#1D9E75] rounded-xl z-[-1] shadow-[0_2px_12px_rgba(29,158,117,0.2)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3.5 text-xs font-sans tracking-[0.2em] font-bold uppercase rounded-xl relative z-10 cursor-pointer overflow-hidden transition-colors duration-200 ${
                activeTab === "register" 
                  ? "text-[#04342C] font-extrabold" 
                  : "text-[#7a8a96] hover:text-[#e8edf2]"
              }`}
            >
              {activeTab === "register" && (
                <motion.div
                  layoutId="activeTabBackgroundMobile"
                  className="absolute inset-0 bg-[#1D9E75] rounded-xl z-[-1] shadow-[0_2px_12px_rgba(29,158,117,0.2)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              REGISTER
            </button>
          </div>

          <motion.div layout className="max-w-md mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.div
                  key="login-view-mobile"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {/* Form details section info */}
                  <div className="mb-6">
                    <h2 className="font-sans text-2xl font-semibold text-[#e8edf2] tracking-tight">
                      Welcome back
                    </h2>
                    <p className="text-sm text-[#7a8a96] mt-1.5 select-none leading-relaxed">
                      Sign in to your IGRIS workspace.
                    </p>
                  </div>

                  {/* Alerts */}
                  {errorMsg && (
                    <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-rose-950 bg-rose-950/25 p-4 text-xs text-rose-400 font-sans leading-relaxed">
                      <ShieldAlert size={15} className="mt-0.5 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-5 rounded-xl border border-emerald-950 bg-emerald-950/25 p-4 text-xs text-emerald-400 font-sans leading-relaxed">
                      {successMsg}
                    </div>
                  )}

                  {/* Forms actions */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                        placeholder="you@igristech.com"
                        className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all"
                      />
                    </div>

                    <div className="space-y-2 relative">
                      <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase mb-1">
                        PASSWORD
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4 py-4 pr-11 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Action button trigger */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[52px] flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] hover:bg-[#5DCAA5] font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#04342C] transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {isLoading ? (
                          <span>Transmitting...</span>
                        ) : (
                          <span>SIGN IN →</span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register-view-mobile"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {/* Form details section info */}
                  <div className="mb-6">
                    <h2 className="font-sans text-2xl font-semibold text-[#e8edf2] tracking-tight">
                      Create account
                    </h2>
                    <p className="text-sm text-[#7a8a96] mt-1.5 select-none leading-relaxed">
                      Free to start. No credit card needed.
                    </p>
                  </div>

                  {/* Alerts */}
                  {errorMsg && (
                    <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-rose-950 bg-rose-950/25 p-4 text-xs text-rose-400 font-sans leading-relaxed">
                      <ShieldAlert size={15} className="mt-0.5 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="mb-5 rounded-xl border border-emerald-950 bg-emerald-950/25 p-4 text-xs text-emerald-400 font-sans leading-relaxed">
                      {successMsg}
                    </div>
                  )}

                  {/* Forms actions */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Registers extra name controls */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                        USERNAME
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="igriskover"
                        className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                        placeholder="you@igristech.com"
                        className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all"
                      />
                    </div>

                    <div className="space-y-2 relative">
                      <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase mb-1">
                        PASSWORD
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4 py-4 pr-11 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-650 hover:text-zinc-350 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Password strength progress indicators for register flow */}
                      <div className="space-y-1.5 mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((barNum) => {
                            let barBg = "bg-[#0a1f14]";
                            if (password.length > 0 && strength.score >= barNum) {
                              if (strength.colorClass === "weak") barBg = "bg-[#E24B4A]";
                              else if (strength.colorClass === "ok") barBg = "bg-[#EF9F27]";
                              else if (strength.colorClass === "strong") barBg = "bg-[#1D9E75]";
                            }
                            return (
                              <div
                                key={barNum}
                                className={`flex-1 h-[3px] rounded-full transition-all duration-200 ${barBg}`}
                              />
                            );
                          })}
                        </div>
                        {password.length > 0 && (
                          <div className={`text-[10px] font-bold tracking-wider lowercase font-sans ${
                            strength.colorClass === "weak" 
                              ? "text-[#E24B4A]" 
                              : strength.colorClass === "ok" 
                                ? "text-[#EF9F27]" 
                                : "text-[#1D9E75]"
                          }`}>
                            {strength.label}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CONFIRM PASS / TERMS for register layout */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                        CONFIRM PASSWORD
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all"
                      />
                    </div>

                    <div className="flex items-start gap-3 pt-1">
                      <input
                        type="checkbox"
                        id="m-terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-1 accent-[#1D9E75] cursor-pointer flex-shrink-0 w-4.5 h-4.5"
                      />
                      <label htmlFor="m-terms" className="text-xs leading-relaxed text-[#7a8a96] select-none font-sans font-medium">
                        I agree to the{" "}
                        <span 
                          onClick={() => { setLegalTab("terms"); setLegalOpen(true); }}
                          className="text-[#1D9E75] cursor-pointer hover:underline font-bold"
                        >
                          Terms of Service
                        </span>{" "}
                        and{" "}
                        <span 
                          onClick={() => { setLegalTab("privacy"); setLegalOpen(true); }}
                          className="text-[#1D9E75] cursor-pointer hover:underline font-bold"
                        >
                          Privacy Policy
                        </span>
                      </label>
                    </div>

                    {/* Action button trigger */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[52px] flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] hover:bg-[#5DCAA5] font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#04342C] transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {isLoading ? (
                          <span>Transmitting...</span>
                        ) : (
                          <span>CREATE ACCOUNT →</span>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Symmetrical dividers */}
            <div className="flex items-center text-[10px] text-[#2a4a36] font-bold tracking-[0.25em] my-6 select-none uppercase font-sans">
              <div className="flex-grow border-t border-[#0a1f14]"></div>
              <span className="px-3.5">or</span>
              <div className="flex-grow border-t border-[#0a1f14]"></div>
            </div>

            {/* Symmetrical Continue with Google */}
            <div className="relative w-full h-[54px]">
              <button
                type="button"
                className="w-full h-full flex items-center justify-center gap-3.5 rounded-xl border-2 border-[#163a24] bg-[#0c1d12]/20 hover:bg-[#12301e]/30 hover:border-[#1D9E75] text-[#e8edf2] hover:text-white text-xs font-sans font-extrabold tracking-widest transition-all duration-150 cursor-pointer shadow-md shadow-[#1D9E75]/5 select-none"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </button>
              <div className="absolute inset-0 w-full h-full opacity-0 overflow-hidden cursor-pointer" style={{ zIndex: 10 }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            </div>

            {/* Alternate Tab switcher */}
            <div className="text-center mt-6">
              <p className="text-xs text-[#7a8a96] font-sans">
                {activeTab === "login" ? (
                  <>
                    No account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("register");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[#1D9E75] hover:text-[#5DCAA5] font-semibold hover:underline bg-transparent border-0 p-0 ml-1 transition select-none cursor-pointer"
                    >
                      Create one free
                    </button>
                  </>
                ) : (
                  <>
                    Have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("login");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[#1D9E75] hover:text-[#5DCAA5] font-semibold hover:underline bg-transparent border-0 p-0 ml-1 transition select-none cursor-pointer"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>

        </div>

        {/* Footer trust bars */}
        <div className="flex justify-center gap-6 py-5 px-4 border-t border-[#0a1f14] bg-[#04080F] select-none">
          <div className="flex items-center gap-1.5 text-[9px] text-[#2a4a36] font-bold uppercase tracking-wider font-sans">
            <Lock size={12} className="text-[#0F6E56]" />
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-[#2a4a36] font-bold uppercase tracking-wider font-sans">
            <ShieldCheck size={12} className="text-[#0F6E56]" />
            <span>SOC 2</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-[#2a4a36] font-bold uppercase tracking-wider font-sans">
            <EyeOff size={11} className="text-[#0F6E56] -scale-x-100" />
            <span>Zero retention</span>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* PROFILE B: HIGH-FIDELITY DESKTOP VIEW (>= md viewports)   */}
      {/* ========================================================= */}
      
      {/* 1. LEFT COLUMN: Brand presentation side (visible on tablet and laptops >= md) */}
      <div className="hidden md:flex flex-col justify-between w-1/2 p-12 lg:p-16 border-r border-[#0a1f14] bg-[#04080F] relative overflow-hidden select-none">
        

        
        {/* Brand logo header (with favicon-style mark behind) */}
        <div className="relative text-xl font-bold tracking-[0.4em] text-[#e8edf2] z-10 uppercase font-sans">
          <div aria-hidden className="absolute -inset-8 -z-10 rounded-full bg-[#1D9E75]/10 blur-3xl opacity-90" />
          IGRIS <span className="text-[#1D9E75]">AI</span>
        </div>

        
        {/* Middle contents */}
        <div className="flex flex-col justify-center py-8 z-10 max-w-sm">
          <div className="text-[12px] tracking-[0.3em] text-[#1D9E75] font-extrabold uppercase mb-4.5 font-sans">
            INTELLIGENCE PLATFORM
          </div>
          <h1 className="text-3xl lg:text-4.5xl font-semibold tracking-tight text-[#e8edf2] leading-[1.3] mb-4 font-sans">
            Think faster.<br />
            Build <span className="text-[#1D9E75]">smarter.</span><br />
            Move first.
          </h1>
          
          {/* Main Slogan Highlighted */}
          <div className="text-sm font-bold tracking-wider text-zinc-200/90 mb-5 uppercase font-sans">
            Dominate the Future. Now
          </div>

          
          <p className="text-sm text-[#7a8a96] leading-[1.8] mb-8 font-sans">
            IGRIS AI gives your team the edge — real-time reasoning, private by default, built for scale.
          </p>
          
          {/* Active green bulleted points */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-[13px] text-[#7a8a96] font-medium font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] flex-shrink-0 animate-pulse" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#7a8a96] font-medium font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] flex-shrink-0 animate-pulse" />
              <span>Zero data retention</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#7a8a96] font-medium font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] flex-shrink-0 animate-pulse" />
              <span>99.9% uptime SLA</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#7a8a96] font-medium font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] flex-shrink-0 animate-pulse" />
              <span>SOC 2 Type II compliant</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-[11px] text-[#2a3a30] font-sans font-bold tracking-widest z-10">
          © 2026 IGRIS TECHNOLOGY
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Interactive Form panel containing scaled high-fidelity layouts */}
      <div className="hidden md:flex w-1/2 bg-[#04080F] overflow-y-auto flex-col justify-center items-center p-8 sm:p-12 md:p-16 lg:p-20 relative">
        


        {/* Compact Form Wrapper - Wide max-w-md scaled up */}
        <motion.div layout className="w-full max-w-md flex flex-col items-stretch z-10 relative">
          
          {/* High-fidelity Segmented Tab Headers (Sleek Capsule Frame) */}
          <div className="border-2 border-[#0F2A1A] bg-[#0c131d]/60 p-1 rounded-xl flex items-center mb-9 select-none w-full">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs font-sans tracking-widest font-bold uppercase transition-all duration-350 rounded-lg relative ${
                activeTab === "login" 
                  ? "bg-[#1D9E75] text-[#04342C] shadow-[0_2px_12px_rgba(29,158,117,0.25)]" 
                  : "text-[#7a8a96] hover:text-[#e8edf2]"
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs font-sans tracking-widest font-bold uppercase transition-all duration-350 rounded-lg relative ${
                activeTab === "register" 
                  ? "bg-[#1D9E75] text-[#04342C] shadow-[0_2px_12px_rgba(29,158,117,0.25)]" 
                  : "text-[#7a8a96] hover:text-[#e8edf2]"
              }`}
            >
              REGISTER
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login-view-desktop"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {/* Active Tab Welcome Titles */}
                <div className="mb-7">
                  <h2 className="font-sans text-2xl font-semibold text-zinc-100 tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-xs text-[#7a8a96] mt-1.5 select-none leading-relaxed font-sans">
                    Sign in to your IGRIS workspace.
                  </p>
                </div>

                {/* Symmetrical alerts & notifications nested */}
                {errorMsg && (
                  <div className="mb-5 flex items-start space-x-2.5 rounded-xl border-2 border-rose-950 bg-rose-950/20 p-4 text-xs text-rose-400 font-sans leading-relaxed">
                    <ShieldAlert size={15} className="mt-0.5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-5 rounded-xl border border-emerald-950 bg-emerald-950/20 p-4 text-xs text-emerald-400 font-sans leading-relaxed">
                    {successMsg}
                  </div>
                )}

                {/* Interactive forms wrapper */}
                <form onSubmit={handleSubmit} className="space-y-4.5">
                  {/* SHARED FIELDS - scaled input spaces */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      placeholder="you@igristech.com"
                      className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4.5 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all duration-150"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase mb-1.5">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4.5 py-4 pr-11 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-650 hover:text-zinc-350 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* LOGIN-ONLY FIELDS: Remember Me (No Forgot Password link here) */}
                  <div className="flex items-center justify-between pt-0.5 select-none">
                    <label className="flex items-center space-x-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`flex h-4 w-4 items-center justify-center rounded border transition duration-150 ${
                        rememberMe 
                          ? "border-[#1D9E75] bg-[#1D9E75]/20 text-[#1D9E75]" 
                          : "border-[#0F2A1A] bg-zinc-950 hover:border-[#1D9E75]"
                      }`}>
                        {rememberMe && (
                          <svg className="h-2 w-2 fill-current" viewBox="0 0 20 20">
                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-sans font-semibold tracking-wider text-[#5a7a6a] group-hover:text-zinc-350 transition uppercase">
                        Remember email
                      </span>
                    </label>
                  </div>

                  {/* Premium Submit Action Button */}
                  <div className="pt-2.5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-[52px] flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] hover:bg-[#5DCAA5] font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#04342C] shadow-md shadow-[#1D9E75]/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="flex items-center space-x-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#04342C] border-t-transparent" />
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span>SIGN IN →</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register-view-desktop"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {/* Active Tab Welcome Titles */}
                <div className="mb-7">
                  <h2 className="font-sans text-2xl font-semibold text-zinc-100 tracking-tight">
                    Create account
                  </h2>
                  <p className="text-xs text-[#7a8a96] mt-1.5 select-none leading-relaxed font-sans">
                    Free to start. No credit card needed.
                  </p>
                </div>

                {/* Symmetrical alerts & notifications nested */}
                {errorMsg && (
                  <div className="mb-5 flex items-start space-x-2.5 rounded-xl border-2 border-rose-950 bg-rose-950/20 p-4 text-xs text-rose-400 font-sans leading-relaxed">
                    <ShieldAlert size={15} className="mt-0.5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-5 rounded-xl border border-emerald-950 bg-emerald-950/20 p-4 text-xs text-emerald-400 font-sans leading-relaxed">
                    {successMsg}
                  </div>
                )}

                {/* Interactive forms wrapper */}
                <form onSubmit={handleSubmit} className="space-y-4.5">
                  {/* REGISTER-ONLY FIELDS (Username field) */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                      USERNAME
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="igriskover"
                      className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4.5 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all duration-150"
                    />
                  </div>

                  {/* SHARED FIELDS - scaled input spaces */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      placeholder="you@igristech.com"
                      className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4.5 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all duration-150"
                    />
                  </div>

                  <div className="space-y-2 relative">
                    <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase mb-1.5">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4.5 py-4 pr-11 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-650 hover:text-zinc-350 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password strength progress indicators for register flow */}
                    <div className="space-y-1.5 mt-2.5">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((barNum) => {
                          let barBg = "bg-[#0a1f14]";
                          if (password.length > 0 && strength.score >= barNum) {
                            if (strength.colorClass === "weak") barBg = "bg-[#E24B4A]";
                            else if (strength.colorClass === "ok") barBg = "bg-[#EF9F27]";
                            else if (strength.colorClass === "strong") barBg = "bg-[#1D9E75]";
                          }
                          return (
                            <div
                              key={barNum}
                              className={`flex-1 h-[3px] rounded-full transition-all duration-350 ${barBg}`}
                            />
                          );
                        })}
                      </div>
                      {password.length > 0 && (
                        <div className={`text-[10px] font-bold tracking-wider lowercase font-sans ${
                          strength.colorClass === "weak" 
                            ? "text-[#E24B4A]" 
                            : strength.colorClass === "ok" 
                              ? "text-[#EF9F27]" 
                              : "text-[#1D9E75]"
                        }`}>
                          {strength.label}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REGISTER-ONLY FIELDS: Confirm password and Terms agreement */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-sans font-bold tracking-wider text-[#5a7a6a] uppercase">
                      CONFIRM PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#04080F] border-2 border-[#0F2A1A] rounded-xl px-4.5 py-4 text-sm text-[#e8edf2] outline-none placeholder-[#1a2a20] focus:border-[#1D9E75] transition-all duration-150"
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      id="termsAgreement"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 accent-[#1D9E75] cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="termsAgreement" className="text-xs leading-relaxed text-[#7a8a96] select-none font-sans font-medium">
                      I agree to the{" "}
                      <span 
                        onClick={() => { setLegalTab("terms"); setLegalOpen(true); }}
                        className="text-[#1D9E75] cursor-pointer hover:underline font-bold"
                      >
                        Terms of Service
                      </span>{" "}
                      and{" "}
                      <span 
                        onClick={() => { setLegalTab("privacy"); setLegalOpen(true); }}
                        className="text-[#1D9E75] cursor-pointer hover:underline font-bold"
                      >
                        Privacy Policy
                      </span>
                    </label>
                  </div>

                  {/* Premium Submit Action Button */}
                  <div className="pt-2.5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-[52px] flex items-center justify-center gap-2 rounded-xl bg-[#1D9E75] hover:bg-[#5DCAA5] font-sans text-xs font-bold uppercase tracking-[0.2em] text-[#04342C] shadow-md shadow-[#1D9E75]/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <span className="flex items-center space-x-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#04342C] border-t-transparent" />
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span>CREATE ACCOUNT →</span>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Symmetrical divider label */}
          <div className="flex items-center text-[10px] text-[#2a4a36] font-bold tracking-[0.25em] my-6 select-none uppercase font-sans">
            <div className="flex-grow border-t border-[#0a1f14]"></div>
            <span className="px-3.5 animate-pulse">OR</span>
            <div className="flex-grow border-t border-[#0a1f14]"></div>
          </div>

          {/* Social Google continue layout button */}
          <div className="relative w-full h-[54px]">
            <button
              type="button"
              className="w-full h-full flex items-center justify-center gap-3.5 rounded-xl border-2 border-[#163a24] bg-[#0c1d12]/20 hover:bg-[#12301e]/30 hover:border-[#1D9E75] text-[#e8edf2] hover:text-white text-xs font-sans font-extrabold tracking-widest transition-all duration-150 cursor-pointer shadow-md shadow-[#1D9E75]/5 select-none"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </button>
            <div className="absolute inset-0 w-full h-full opacity-0 overflow-hidden cursor-pointer" style={{ zIndex: 10 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                width="100%"
              />
            </div>
          </div>

          {/* Symmetrical toggle switches */}
          <div className="text-center mt-7">
            <p className="text-xs text-[#7a8a96] font-sans">
              {activeTab === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("register");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[#1D9E75] hover:text-[#5DCAA5] font-semibold hover:underline bg-transparent border-0 p-0 ml-1 transition select-none cursor-pointer"
                  >
                    Create one free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("login");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[#1D9E75] hover:text-[#5DCAA5] font-semibold hover:underline bg-transparent border-0 p-0 ml-1 transition select-none cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

        </motion.div>
      </div>

      <LegalModal 
        isOpen={legalOpen} 
        initialTab={legalTab} 
        onClose={() => setLegalOpen(false)} 
      />
    </div>
  );
}
