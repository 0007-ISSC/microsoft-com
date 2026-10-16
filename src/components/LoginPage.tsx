import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Radio, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  Sparkles,
  Bot,
  Terminal,
  Shield
} from 'lucide-react';
import { playHudClick, playSuccessChime } from '../utils/soundEffects';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  badgeCode: string;
  avatarColor: string;
}

interface LoginPageProps {
  onLogin: (profile: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('demo');
  const [email, setEmail] = useState('demo@urbanflow.its');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Chief Traffic Operations Commander');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!username.trim()) {
      setFormError('Please enter your Username');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid E-mail address');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setFormError('Password must be at least 4 characters');
      return;
    }

    playHudClick();
    setIsAuthenticating(true);

    setTimeout(() => {
      playSuccessChime();
      const profile: UserProfile = {
        id: `user-${Date.now()}`,
        name: username.trim(),
        email: email.trim(),
        role: selectedRole,
        badgeCode: `TOC-${username.slice(0, 3).toUpperCase()}-01`,
        avatarColor: 'from-cyan-500 via-blue-600 to-indigo-600',
      };
      onLogin(profile);
    }, 500);
  };

  const handleQuickFill = (u: string, e: string, p: string, r: string) => {
    playHudClick();
    setUsername(u);
    setEmail(e);
    setPassword(p);
    setSelectedRole(r);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Ambient Visual VFX & Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Cyber Grid SVG Backdrop */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.4) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      ></div>

      {/* Top Header */}
      <header className="relative z-10 px-6 py-4 border-b border-slate-900 bg-slate-950/70 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">UrbanFlow AI</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                MISSION CONTROL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Intelligent Transportation Operations Center (TOC)</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-bold">GRID READY</span>
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline text-cyan-400 font-bold">NODE 07</span>
        </div>
      </header>

      {/* Center Hero & Required Login Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Overview */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>Metropolitan Traffic Operations Center</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Real-Time Urban Flow & <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Autonomous Signal
                </span> Optimization
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Enter your credentials to access the live tactical grid, Webster split engine, camera AI vision with oral speech guidance, and the <span className="text-cyan-300 font-semibold">GEN AI Assistant</span>.
              </p>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Webster Cycle Tuning</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Automated queue balancing</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">GEN AI Assistant</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Gemini 3.8 Flash intelligence</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Camera AI & Oral Monitor</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Spoken instructions & vision</div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">EVP Priority Siren</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Emergency wave preemption</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Login Card Asking for Username, Email, Password */}
          <div className="lg:col-span-5 bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/40 flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Operator Secure Portal</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter your Username, E-mail, and Password to proceed to the dashboard
              </p>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 font-medium">
                {formError}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              {/* Username Input */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. demo or demo_operator"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>E-mail Address</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. operator@urbanflow.its"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Password</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              {/* Operational Role Select */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Operational Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  <option value="Chief Traffic Operations Commander">Chief Traffic Operations Commander</option>
                  <option value="Adaptive Webster Optimization Lead">Adaptive Webster Optimization Lead</option>
                  <option value="Emergency Vehicle Preemption Officer">Emergency Vehicle Preemption Officer</option>
                  <option value="Urban Mobility Analyst & Reviewer">Urban Mobility Analyst & Reviewer</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>Verifying Credentials & Entering Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Pre-fill Links */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Quick Presets:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('demo', 'demo@urbanflow.its', 'demo123', 'Chief Traffic Operations Commander')}
                  className="text-cyan-400 hover:underline font-mono"
                >
                  Demo Admin
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill('demo_operator', 'demo.operator@urbanflow.its', 'demo123', 'Adaptive Webster Optimization Lead')}
                  className="text-cyan-400 hover:underline font-mono"
                >
                  Demo Operator
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-3 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Protocol: AES-256-GCM Authorized ITS Access</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Simulation Engine: v1.0.0</span>
          <span>Docker Ready</span>
          <span>Gemini 3.8 Flash</span>
        </div>
      </footer>
    </div>
  );
};
