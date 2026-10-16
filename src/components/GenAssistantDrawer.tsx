import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TrafficIncident, RoadCorridor, IntersectionNode } from '../types/traffic';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Navigation, 
  AlertTriangle, 
  Cpu, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface GenAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: TrafficIncident[];
  corridors: RoadCorridor[];
  intersections: IntersectionNode[];
  onTriggerOptimization?: () => void;
  onTriggerPreemption?: () => void;
  onSelectRouteLandmarks?: (startId: string, endId: string) => void;
}

export const GenAssistantDrawer: React.FC<GenAssistantDrawerProps> = ({
  isOpen,
  onClose,
  incidents,
  corridors,
  intersections,
  onTriggerOptimization,
  onTriggerPreemption,
  onSelectRouteLandmarks,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      role: 'assistant',
      text: `Hello! I am **GEN** (Global Eco-Navigation & Traffic Intelligence Network), designed and developed by **Iqra Sultana**.

I am actively monitoring **${corridors.length} urban corridors** and **${intersections.length} adaptive signal controllers**. How can I help optimize your route, signal timing, or traffic flow right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Voice readout helper
  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Strip markdown symbols for clean speech
      const clean = text.replace(/[*#_`]/g, '').slice(0, 220);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const userQuery = (textToSend || input).trim();
    if (!userQuery || loading) return;

    setInput('');

    const newMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    // Compute live context payload
    const highCongestionCorridors = corridors.filter((c) => c.congestionPercent >= 70);
    const avgSpeed = Math.round(corridors.reduce((acc, c) => acc + c.currentSpeedMph, 0) / corridors.length);
    const activeIncidentsSummary = incidents
      .filter((i) => i.status !== 'cleared')
      .map((i) => `${i.title} (${i.severity})`)
      .join(', ');

    const trafficContext = {
      incidentCount: incidents.filter((i) => i.status !== 'cleared').length,
      majorIncidents: activeIncidentsSummary || 'No high severity incidents',
      congestionIndex: Math.round(
        corridors.reduce((acc, c) => acc + c.congestionPercent, 0) / corridors.length
      ),
      levelOfService: highCongestionCorridors.length > 2 ? 'LOS D' : 'LOS C',
      adaptiveSignalsCount: intersections.length,
      avgSpeed: `${avgSpeed} mph`,
      greenWaves: 'Downtown Corridor (Broadway) & Tech Innovation Way',
      emissionsReduction: '18.4%',
      preemptionActive: intersections.some((i) => i.mode === 'preempted'),
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userQuery,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          trafficContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const assistantReply = data.reply || 'No response generated.';

      const replyMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, replyMsg]);
      speakText(assistantReply);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackReply = `⚠️ I encountered a temporary connection glitch. Based on current telemetry:
• Active bottlenecks: Central Broadway & West Ring Parkway.
• Best alternate path: 7th Ave Bypass via Node 3 to 6.
• Adaptive controllers are balancing intersection queues to recover normal velocity.`;

      const fallbackMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'm-0',
        role: 'assistant',
        text: `Chat history reset. How can GEN assist you with navigation or traffic flow optimization?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const QUICK_PROMPTS = [
    { label: '👑 Creator & Head', query: 'Who is your creator, owner, and head engineer?' },
    { label: '🚨 Active Bottlenecks', query: 'Where are the most critical traffic bottlenecks and incidents right now?' },
    { label: '🧭 Fastest Cross-Town Route', query: 'Provide the fastest navigation route from North Harbor to the Medical Campus with delay comparisons.' },
    { label: '🚥 Adaptive Signal Strategy', query: 'How is the Webster adaptive signal timing minimizing delay on Broadway?' },
    { label: '🚑 Preemption Status', query: 'What is the procedure and current state of Emergency Vehicle Preemption (EVP)?' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">GEN Assistant</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-cyan-300/80 font-medium">Engineered by Iqra Sultana • Urban Flow AI</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* TTS Toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-lg text-xs transition cursor-pointer ${
              ttsEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={ttsEnabled ? 'Mute Voice Readout' : 'Enable Voice Readout'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset button */}
          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Context Strip */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Telemetry Synchronized</span>
        </div>
        <div className="font-mono text-cyan-400 font-medium">
          {incidents.filter((i) => i.status !== 'cleared').length} Incidents Active
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none'
                }`}
              >
                {/* Format markdown-like text */}
                <div className="space-y-1.5 whitespace-pre-line">
                  {msg.text.split('\n').map((line, idx) => {
                    // Highlight bold lines or bullet lines
                    if (line.startsWith('•') || line.startsWith('-')) {
                      return (
                        <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-200">
                          <span className="text-cyan-400">•</span>
                          <span>{line.replace(/^[•-]\s*/, '')}</span>
                        </div>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none p-3 shadow-md flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>GEN is evaluating live corridor matrices...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-3 border-t border-slate-800/70 bg-slate-900/40">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Recommended Queries:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp.query)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition cursor-pointer"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask GEN for routes, signal timing, or traffic alerts..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-900/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
