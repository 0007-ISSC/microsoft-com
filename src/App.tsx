import React, { useState, useEffect } from 'react';
import { 
  INITIAL_INTERSECTIONS, 
  INITIAL_CORRIDORS, 
  INITIAL_INCIDENTS, 
  INITIAL_VEHICLES 
} from './data/initialTrafficState';
import { 
  IntersectionNode, 
  RoadCorridor, 
  TrafficIncident, 
  MovingVehicle 
} from './types/traffic';
import { calculateWebsterCycle, getLOSFromDelay, calculateGreenshieldsSpeed } from './utils/trafficMath';
import { TrafficGridCanvas } from './components/TrafficGridCanvas';
import { SignalOptimizationHub } from './components/SignalOptimizationHub';
import { GenAssistantDrawer } from './components/GenAssistantDrawer';
import { IncidentDispatchPanel } from './components/IncidentDispatchPanel';
import { NavigationOptimizer } from './components/NavigationOptimizer';
import { UrbanAnalyticsModal } from './components/UrbanAnalyticsModal';
import { DevOpsDeploymentModal } from './components/DevOpsDeploymentModal';
import { IntersectionDetailModal } from './components/IntersectionDetailModal';
import { CameraVisionModule } from './components/CameraVisionModule';
import { LoginPage, UserProfile } from './components/LoginPage';
import { 
  Activity, 
  Bot, 
  Box, 
  Layers, 
  Navigation, 
  AlertTriangle, 
  Cpu, 
  BarChart3, 
  ShieldAlert, 
  Zap, 
  Flame, 
  CheckCircle2,
  LogOut,
  User,
  Eye,
  Volume2,
  VolumeX,
  Radio,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { 
  playHudClick, 
  playEmergencyAlert, 
  playSuccessChime, 
  setSoundEnabled, 
  isSoundEnabled 
} from './utils/soundEffects';
import { 
  speakMajorIncidentAlert, 
  speakIncidentClearance, 
  speakPreemptionActivation, 
  speakAnnouncement, 
  onSpeechBroadcast 
} from './utils/trafficSpeech';
import { Megaphone, RotateCw } from 'lucide-react';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('urbanflow_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem('urbanflow_user_profile', JSON.stringify(profile));
    } catch {}
  };

  const handleLogout = () => {
    playHudClick();
    setUserProfile(null);
    try {
      localStorage.removeItem('urbanflow_user_profile');
    } catch {}
  };

  const [intersections, setIntersections] = useState<IntersectionNode[]>(INITIAL_INTERSECTIONS);
  const [corridors, setCorridors] = useState<RoadCorridor[]>(INITIAL_CORRIDORS);
  const [incidents, setIncidents] = useState<TrafficIncident[]>(INITIAL_INCIDENTS);
  const [vehicles, setVehicles] = useState<MovingVehicle[]>(INITIAL_VEHICLES);

  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'camera' | 'signals' | 'navigation' | 'incidents' | 'analytics' | 'deployment'>('grid');
  const [highlightedCorridorIds, setHighlightedCorridorIds] = useState<string[]>([]);
  const [emergencyPreemptionActive, setEmergencyPreemptionActive] = useState<boolean>(false);
  const [isGenOpen, setIsGenOpen] = useState<boolean>(false);
  const [greenWaveSpeedMph, setGreenWaveSpeedMph] = useState<number>(34);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [latestAudioAnnouncement, setLatestAudioAnnouncement] = useState<string | null>(null);
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);

  // Subscribe to real-time Web Speech API announcements
  useEffect(() => {
    const unsubscribe = onSpeechBroadcast((text) => {
      setLatestAudioAnnouncement(text);
      setIsSpeakingTts(true);
      const timer = setTimeout(() => {
        setIsSpeakingTts(false);
      }, 5500);
      return () => clearTimeout(timer);
    });
    return unsubscribe;
  }, []);

  // REAL-TIME SIMULATION ENGINE
  useEffect(() => {
    const timer = setInterval(() => {
      // Advance vehicles
      setVehicles((prevVehicles) =>
        prevVehicles.map((v) => {
          let step = 0.045;
          if (v.isEmergency) step = 0.085;
          const newProgress = v.progress + step;
          return {
            ...v,
            progress: newProgress > 1 ? 0 : newProgress,
          };
        })
      );

      // Advance signal controllers
      setIntersections((prevNodes) =>
        prevNodes.map((node) => {
          const isPreemptedNode = emergencyPreemptionActive && (node.id === 'int-3' || node.id === 'int-6' || node.id === 'int-9');

          if (isPreemptedNode) {
            return {
              ...node,
              mode: 'preempted',
              currentPhaseIndex: 0,
              currentPhaseElapsed: 1,
              websterDelaySec: 4.2,
            };
          }

          const activePhase = node.phases[node.currentPhaseIndex] || node.phases[0];
          const newElapsed = node.currentPhaseElapsed + 2;

          let newPhaseIndex = node.currentPhaseIndex;
          let resetElapsed = newElapsed;

          if (newElapsed >= activePhase.durationSec) {
            newPhaseIndex = (node.currentPhaseIndex + 1) % node.phases.length;
            resetElapsed = 0;
          }

          const deltaN = (Math.random() > 0.6 ? 1 : 0) - (node.currentPhaseIndex === 0 ? 1 : 0);
          const deltaE = (Math.random() > 0.6 ? 1 : 0) - (node.currentPhaseIndex === 1 ? 1 : 0);

          return {
            ...node,
            currentPhaseIndex: newPhaseIndex,
            currentPhaseElapsed: resetElapsed,
            queueNorth: Math.max(1, node.queueNorth + deltaN),
            queueSouth: Math.max(1, node.queueSouth + deltaN),
            queueEast: Math.max(1, node.queueEast + deltaE),
            queueWest: Math.max(1, node.queueWest + deltaE),
          };
        })
      );

      // Recalculate corridors
      setCorridors((prevCorridors) =>
        prevCorridors.map((corr) => {
          const hasIncident = incidents.some(
            (inc) => inc.corridorId === corr.id && inc.status !== 'cleared'
          );

          let density = corr.densityVehPerKm;
          if (hasIncident) {
            density = Math.min(110, density + 0.5);
          } else {
            density = Math.max(18, density + (Math.random() * 2 - 1));
          }

          const currentSpeedMph = calculateGreenshieldsSpeed(density, corr.speedLimitMph, 120);
          const congestionPercent = Math.min(
            96,
            Math.max(15, Math.round(((corr.speedLimitMph - currentSpeedMph) / corr.speedLimitMph) * 100))
          );
          const levelOfService = getLOSFromDelay(congestionPercent * 0.8);

          return {
            ...corr,
            densityVehPerKm: Math.round(density),
            currentSpeedMph,
            congestionPercent,
            levelOfService,
            activeIncidentsCount: hasIncident ? 1 : 0,
          };
        })
      );
    }, 1200);

    return () => clearInterval(timer);
  }, [emergencyPreemptionActive, incidents]);

  const handleOptimizeAllSignals = () => {
    playSuccessChime();
    setIntersections((prev) =>
      prev.map((node) => {
        const queueNS = node.queueNorth + node.queueSouth;
        const queueEW = node.queueEast + node.queueWest;
        const total = Math.max(1, queueNS + queueEW);

        const flowNS = (queueNS / total) * 0.72;
        const flowEW = (queueEW / total) * 0.72;
        const webster = calculateWebsterCycle(flowNS, flowEW, 12);

        return {
          ...node,
          cycleLength: webster.optimumCycleSec,
          websterDelaySec: webster.totalDelaySec,
          mode: 'adaptive',
          phases: [
            { ...node.phases[0], durationSec: webster.greenSecNS },
            { ...node.phases[1], durationSec: webster.greenSecEW },
          ],
        };
      })
    );
  };

  const handleToggleEmergencyPreemption = () => {
    playEmergencyAlert();
    const nextState = !emergencyPreemptionActive;
    setEmergencyPreemptionActive(nextState);

    if (nextState) {
      setHighlightedCorridorIds(['corr-3-6', 'corr-6-9']);
      speakPreemptionActivation('Grand Central Expressway and Eastern Arterial Corridor');
    } else {
      setHighlightedCorridorIds([]);
      setIntersections((prev) =>
        prev.map((n) => ({ ...n, mode: 'adaptive' }))
      );
      speakAnnouncement('Emergency preemption cleared. All signalized intersections returned to coordinated Webster adaptive cycles.', false);
    }
  };

  const handleAddIncident = (newInc: Omit<TrafficIncident, 'id'>) => {
    playHudClick();
    const incident: TrafficIncident = {
      ...newInc,
      id: `inc-${Date.now()}`,
    };
    setIncidents((prev) => [incident, ...prev]);

    // Real-time professional Web Speech API notification for major traffic incident
    speakMajorIncidentAlert(
      incident.title,
      incident.locationName,
      incident.severity,
      incident.lanesBlocked,
      incident.recommendedDetour
    );
  };

  const handleResolveIncident = (id: string) => {
    playSuccessChime();
    const incidentToClear = incidents.find((i) => i.id === id);
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'cleared' } : inc))
    );

    if (incidentToClear) {
      speakIncidentClearance(incidentToClear.title, incidentToClear.locationName);
    }
  };

  // Test action for immediate audio demonstration
  const handleTestMajorIncidentTts = () => {
    playHudClick();
    speakMajorIncidentAlert(
      'Multi-Vehicle Collision on Central Expressway',
      'Broadway & Grand Avenue Junction',
      'critical',
      3,
      'Divert eastbound traffic via 7th Avenue arterial to prevent gridlock.'
    );
  };

  const handleFlushQueue = (nodeId: string, direction: 'N-S' | 'E-W') => {
    playHudClick();
    setIntersections((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;
        if (direction === 'N-S') {
          return {
            ...node,
            queueNorth: Math.max(1, Math.round(node.queueNorth * 0.2)),
            queueSouth: Math.max(1, Math.round(node.queueSouth * 0.2)),
            currentPhaseIndex: 0,
            currentPhaseElapsed: 0,
          };
        } else {
          return {
            ...node,
            queueEast: Math.max(1, Math.round(node.queueEast * 0.2)),
            queueWest: Math.max(1, Math.round(node.queueWest * 0.2)),
            currentPhaseIndex: 1,
            currentPhaseElapsed: 0,
          };
        }
      })
    );
  };

  const handleToggleNodeMode = (nodeId: string) => {
    playHudClick();
    setIntersections((prev) =>
      prev.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          mode: node.mode === 'adaptive' ? 'fixed' : 'adaptive',
        };
      })
    );
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    setSoundEnabled(next);
    if (next) playHudClick();
  };

  const selectedNode = intersections.find((n) => n.id === selectedIntersectionId) || null;

  // Render Login Page if not authenticated
  if (!userProfile) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Navigation Items on Left Sidebar
  const NAV_MODULES = [
    {
      id: 'grid' as const,
      label: 'Tactical Live Grid',
      icon: Layers,
      tag: 'HUD',
      color: 'text-cyan-400',
    },
    {
      id: 'camera' as const,
      label: 'Camera AI & Oral Monitor',
      icon: Eye,
      tag: 'VISION',
      color: 'text-emerald-400',
    },
    {
      id: 'signals' as const,
      label: 'Signal Optimization',
      icon: Cpu,
      tag: 'WEBSTER',
      color: 'text-blue-400',
    },
    {
      id: 'navigation' as const,
      label: 'AI Route & Green Wave',
      icon: Navigation,
      tag: 'NAV',
      color: 'text-indigo-400',
    },
    {
      id: 'incidents' as const,
      label: 'Incident Dispatch Hub',
      icon: AlertTriangle,
      tag: `${incidents.filter((i) => i.status !== 'cleared').length} ALERT`,
      color: 'text-rose-400',
      badgePulse: incidents.filter((i) => i.status !== 'cleared').length > 0,
    },
    {
      id: 'analytics' as const,
      label: 'Flow & Carbon Analytics',
      icon: BarChart3,
      tag: 'STATS',
      color: 'text-purple-400',
    },
    {
      id: 'deployment' as const,
      label: 'Docker & CI/CD Pipeline',
      icon: Box,
      tag: 'PROD',
      color: 'text-teal-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* =========================================================================
          LEFT-HAND SIDE COMMAND SIDEBAR (All Modules Anchored Left)
         ========================================================================= */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } shrink-0 bg-slate-950 border-r border-slate-800/90 flex flex-col justify-between transition-all duration-300 z-40 relative shadow-2xl`}
      >
        {/* Top Section: System Branding & Collapse Button */}
        <div>
          <div className="p-4 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-white">UrbanFlow AI</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      PROD
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">TOC MISSION CONTROL</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                playHudClick();
                setSidebarCollapsed(!sidebarCollapsed);
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition cursor-pointer"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Active Operator Profile Card */}
          {!sidebarCollapsed && (
            <div className="p-3 mx-3 my-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${userProfile.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow shrink-0`}>
                  {userProfile.name.charAt(0)}
                </div>
                <div className="text-left text-xs leading-tight truncate">
                  <div className="font-bold text-white truncate">{userProfile.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{userProfile.badgeCode}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
                title="Sign out & return to Login"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Module Navigation List (All modules on left) */}
          <div className="px-3 py-2 space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              {!sidebarCollapsed ? 'Operational Modules' : 'MENU'}
            </div>

            {NAV_MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeTab === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    playHudClick();
                    setActiveTab(mod.id);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                  title={mod.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : mod.color}`} />
                    {!sidebarCollapsed && <span className="truncate">{mod.label}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950'
                          : mod.badgePulse
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {mod.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: GEN Chatbot Launcher, EVP Toggle, Audio Toggle */}
        <div className="p-3 border-t border-slate-900 space-y-2">
          {/* GEN AI Chatbot Trigger (Highlighted in Left Sidebar) */}
          <button
            onClick={() => {
              playHudClick();
              setIsGenOpen(true);
            }}
            className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-950 flex items-center justify-between text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Ask GEN AI Co-Pilot</span>}
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </button>

          {/* Quick EVP Preemption Siren Trigger */}
          <button
            onClick={handleToggleEmergencyPreemption}
            className={`w-full p-2 rounded-xl text-[11px] font-mono font-bold flex items-center justify-between transition cursor-pointer border ${
              emergencyPreemptionActive
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950 animate-pulse'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-3.5 h-3.5 ${emergencyPreemptionActive ? 'text-white' : 'text-rose-400'}`} />
              {!sidebarCollapsed && <span>{emergencyPreemptionActive ? 'EVP ACTIVE' : 'EVP Priority'}</span>}
            </div>
            {!sidebarCollapsed && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40">
                {emergencyPreemptionActive ? 'CLEARED' : 'ARMED'}
              </span>
            )}
          </button>

          {/* Sound Synthesizer & Sign Out Bar */}
          <div className="flex items-center justify-between pt-1 text-slate-400">
            <button
              onClick={toggleAudio}
              className="p-1.5 rounded-lg hover:bg-slate-900 hover:text-cyan-400 transition cursor-pointer text-xs flex items-center gap-1.5"
              title={audioEnabled ? 'Mute Procedural HUD Audio' : 'Enable Procedural HUD Audio'}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              {!sidebarCollapsed && <span className="text-[10px] font-mono">AUDIO: {audioEnabled ? 'ON' : 'OFF'}</span>}
            </button>

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="text-[10px] font-mono text-slate-500 hover:text-rose-400 transition cursor-pointer"
              >
                EXIT PORTAL
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT-HAND MAIN WORKSPACE AREA
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Global Telemetry Strip */}
        <header className="px-6 py-3 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-white">TOC LIVE CORRIDOR STREAM</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-xs font-mono text-slate-400">
              Corridor Avg Speed: <span className="text-cyan-400 font-bold">
                {Math.round(corridors.reduce((acc, c) => acc + c.currentSpeedMph, 0) / corridors.length)} mph
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Quick Button to Test Major Incident Real-Time Web Speech API Notification */}
            <button
              onClick={handleTestMajorIncidentTts}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 transition active:scale-95 cursor-pointer font-sans text-xs font-semibold"
              title="Test Web Speech API Browser Audio Notification for Major Incidents"
            >
              <Megaphone className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="hidden sm:inline">Test Incident Audio</span>
            </button>

            <div className="bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 text-slate-300">
              Active Incidents: <span className="text-rose-400 font-bold">{incidents.filter((i) => i.status !== 'cleared').length}</span>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 text-slate-300">
              Webster Nodes: <span className="text-emerald-400 font-bold">9 / 9 Synchronized</span>
            </div>
          </div>
        </header>

        {/* Dynamic Web Speech API Real-Time Audio Broadcast HUD */}
        {latestAudioAnnouncement && (
          <div className="mx-4 lg:mx-6 mt-4 bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-slate-950/90 border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 relative shrink-0">
                <Volume2 className={`w-5 h-5 ${isSpeakingTts ? 'animate-pulse text-cyan-300' : 'text-cyan-400'}`} />
                {isSpeakingTts && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300"></span>
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <span>Web Speech API Live Audio Notification</span>
                    {isSpeakingTts && (
                      <span className="inline-flex gap-0.5 items-end h-2.5">
                        <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse"></span>
                        <span className="w-0.5 h-2.5 bg-cyan-400 animate-pulse delay-75"></span>
                        <span className="w-0.5 h-1 bg-cyan-400 animate-pulse delay-150"></span>
                        <span className="w-0.5 h-2 bg-cyan-400 animate-pulse"></span>
                      </span>
                    )}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    isSpeakingTts 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isSpeakingTts ? 'TRANSMITTING ORAL BROADCAST' : 'BROADCAST LOGGED'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium truncate max-w-2xl mt-0.5">
                  "{latestAudioAnnouncement}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  playHudClick();
                  speakAnnouncement(latestAudioAnnouncement, false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition active:scale-95 cursor-pointer"
                title="Replay Audio via Browser Speech Synthesis"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Replay Oral Audio</span>
              </button>

              <button
                onClick={() => setLatestAudioAnnouncement(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Dismiss Broadcast Banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto flex flex-col gap-6 overflow-y-auto">
          
          {/* MODULE 1: TACTICAL LIVE GRID */}
          {activeTab === 'grid' && (
            <div className="space-y-6">
              <TrafficGridCanvas
                intersections={intersections}
                corridors={corridors}
                incidents={incidents}
                vehicles={vehicles}
                selectedIntersectionId={selectedIntersectionId}
                onSelectIntersection={(id) => setSelectedIntersectionId(id)}
                highlightedCorridorIds={highlightedCorridorIds}
                emergencyPreemptionActive={emergencyPreemptionActive}
                onTriggerEmergencyPreemption={handleToggleEmergencyPreemption}
              />

              {/* Quick Signal Optimization Card below map */}
              <SignalOptimizationHub
                selectedNode={selectedNode}
                allNodes={intersections}
                onSelectNode={(id) => setSelectedIntersectionId(id)}
                onOptimizeAllSignals={handleOptimizeAllSignals}
                emergencyPreemptionActive={emergencyPreemptionActive}
                onTogglePreemption={handleToggleEmergencyPreemption}
                greenWaveSpeedMph={greenWaveSpeedMph}
                onChangeGreenWaveSpeed={(s) => setGreenWaveSpeedMph(s)}
              />
            </div>
          )}

          {/* MODULE 2: CAMERA AI VISION & ORAL MONITOR */}
          {activeTab === 'camera' && (
            <div className="space-y-6">
              <CameraVisionModule />
            </div>
          )}

          {/* MODULE 3: SIGNAL OPTIMIZATION */}
          {activeTab === 'signals' && (
            <div className="space-y-6">
              <SignalOptimizationHub
                selectedNode={selectedNode}
                allNodes={intersections}
                onSelectNode={(id) => setSelectedIntersectionId(id)}
                onOptimizeAllSignals={handleOptimizeAllSignals}
                emergencyPreemptionActive={emergencyPreemptionActive}
                onTogglePreemption={handleToggleEmergencyPreemption}
                greenWaveSpeedMph={greenWaveSpeedMph}
                onChangeGreenWaveSpeed={(s) => setGreenWaveSpeedMph(s)}
              />

              <TrafficGridCanvas
                intersections={intersections}
                corridors={corridors}
                incidents={incidents}
                vehicles={vehicles}
                selectedIntersectionId={selectedIntersectionId}
                onSelectIntersection={(id) => setSelectedIntersectionId(id)}
                highlightedCorridorIds={highlightedCorridorIds}
                emergencyPreemptionActive={emergencyPreemptionActive}
                onTriggerEmergencyPreemption={handleToggleEmergencyPreemption}
              />
            </div>
          )}

          {/* MODULE 4: NAVIGATION & GREEN WAVE */}
          {activeTab === 'navigation' && (
            <div className="space-y-6">
              <NavigationOptimizer
                corridors={corridors}
                onHighlightRoute={(ids) => setHighlightedCorridorIds(ids)}
                onOpenGenWithRoute={() => setIsGenOpen(true)}
              />

              <TrafficGridCanvas
                intersections={intersections}
                corridors={corridors}
                incidents={incidents}
                vehicles={vehicles}
                selectedIntersectionId={selectedIntersectionId}
                onSelectIntersection={(id) => setSelectedIntersectionId(id)}
                highlightedCorridorIds={highlightedCorridorIds}
                emergencyPreemptionActive={emergencyPreemptionActive}
                onTriggerEmergencyPreemption={handleToggleEmergencyPreemption}
              />
            </div>
          )}

          {/* MODULE 5: INCIDENT DISPATCH */}
          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <IncidentDispatchPanel
                incidents={incidents}
                corridors={corridors}
                onResolveIncident={handleResolveIncident}
                onAddIncident={handleAddIncident}
                onFocusCorridor={(cId) => {
                  setHighlightedCorridorIds([cId]);
                  setActiveTab('grid');
                }}
              />

              <TrafficGridCanvas
                intersections={intersections}
                corridors={corridors}
                incidents={incidents}
                vehicles={vehicles}
                selectedIntersectionId={selectedIntersectionId}
                onSelectIntersection={(id) => setSelectedIntersectionId(id)}
                highlightedCorridorIds={highlightedCorridorIds}
                emergencyPreemptionActive={emergencyPreemptionActive}
                onTriggerEmergencyPreemption={handleToggleEmergencyPreemption}
              />
            </div>
          )}

          {/* MODULE 6: URBAN ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <UrbanAnalyticsModal corridors={corridors} intersections={intersections} />
            </div>
          )}

          {/* MODULE 7: DEVOPS DEPLOYMENT */}
          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <DevOpsDeploymentModal />
            </div>
          )}
        </main>
      </div>

      {/* GEN ASSISTANT DRAWER */}
      <GenAssistantDrawer
        isOpen={isGenOpen}
        onClose={() => setIsGenOpen(false)}
        incidents={incidents}
        corridors={corridors}
        intersections={intersections}
        onTriggerOptimization={handleOptimizeAllSignals}
        onTriggerPreemption={handleToggleEmergencyPreemption}
      />

      {/* INTERSECTION INSPECTOR MODAL */}
      {selectedNode && (
        <IntersectionDetailModal
          node={selectedNode}
          onClose={() => setSelectedIntersectionId(null)}
          onToggleMode={handleToggleNodeMode}
          onFlushQueue={handleFlushQueue}
        />
      )}
    </div>
  );
}
