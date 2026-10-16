import React, { useState } from 'react';
import { IntersectionNode } from '../types/traffic';
import { calculateWebsterCycle, getLOSFromDelay, getLOSColor } from '../utils/trafficMath';
import { 
  Zap, 
  RotateCw, 
  ShieldAlert, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  Clock, 
  Cpu
} from 'lucide-react';

interface SignalOptimizationHubProps {
  selectedNode: IntersectionNode | null;
  allNodes: IntersectionNode[];
  onSelectNode: (id: string) => void;
  onOptimizeAllSignals: () => void;
  emergencyPreemptionActive: boolean;
  onTogglePreemption: () => void;
  greenWaveSpeedMph: number;
  onChangeGreenWaveSpeed: (speed: number) => void;
}

export const SignalOptimizationHub: React.FC<SignalOptimizationHubProps> = ({
  selectedNode,
  allNodes,
  onSelectNode,
  onOptimizeAllSignals,
  emergencyPreemptionActive,
  onTogglePreemption,
  greenWaveSpeedMph,
  onChangeGreenWaveSpeed,
}) => {
  const [activeTab, setActiveTab] = useState<'selected' | 'network'>('selected');
  const [optimizing, setOptimizing] = useState(false);
  const [lastOptimizedTime, setLastOptimizedTime] = useState<string>('Just now');

  // Fallback to central hub if none selected
  const node = selectedNode || allNodes.find((n) => n.id === 'int-5') || allNodes[0];

  // Calculate flow ratios based on queues
  const queueNS = node.queueNorth + node.queueSouth;
  const queueEW = node.queueEast + node.queueWest;
  const totalQueue = Math.max(1, queueNS + queueEW);

  // Critical flow ratios for Webster model
  const flowRatioNS = (queueNS / totalQueue) * 0.75;
  const flowRatioEW = (queueEW / totalQueue) * 0.75;

  const webster = calculateWebsterCycle(flowRatioNS, flowRatioEW, 12);
  const currentLOS = getLOSFromDelay(node.websterDelaySec);
  const optimizedLOS = getLOSFromDelay(webster.totalDelaySec);
  const currentLOSStyle = getLOSColor(currentLOS);
  const optimizedLOSStyle = getLOSColor(optimizedLOS);

  const delayReductionPct = Math.round(
    Math.max(5, ((node.websterDelaySec - webster.totalDelaySec) / node.websterDelaySec) * 100)
  );

  const handleRunOptimization = () => {
    setOptimizing(true);
    setTimeout(() => {
      onOptimizeAllSignals();
      setOptimizing(false);
      setLastOptimizedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 600);
  };

  const activePhase = node.phases[node.currentPhaseIndex] || node.phases[0];
  const phaseProgressPct = Math.min(100, Math.round((node.currentPhaseElapsed / activePhase.durationSec) * 100));

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Adaptive Signal Flow Optimization</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Webster Model
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time green split balance based on induction sensor queues & corridor platoons
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunOptimization}
            disabled={optimizing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${optimizing ? 'animate-spin' : ''}`} />
            <span>{optimizing ? 'Rebalancing Grid...' : 'Auto-Optimize All Intersections'}</span>
          </button>

          <button
            onClick={onTogglePreemption}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              emergencyPreemptionActive
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-rose-500/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{emergencyPreemptionActive ? 'Emergency Preemption Active' : 'EVP Priority'}</span>
          </button>
        </div>
      </div>

      {/* Node Selector Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 shrink-0">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Controller:</span>
        </span>
        {allNodes.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelectNode(n.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium shrink-0 transition-all cursor-pointer ${
              node.id === n.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            {n.shortCode} - {n.name.split('&')[0]}
          </button>
        ))}
      </div>

      {/* Main Grid: Live Node State vs Webster AI Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Real-Time Phase Status & Queues */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Phase & Queues</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Cycle: {node.cycleLength}s
              </span>
            </div>

            <div className="text-sm font-bold text-white mb-1">{node.name}</div>
            <div className="text-xs text-slate-400 mb-4">{node.zone} • Controller #{node.shortCode}</div>

            {/* Live Phase Countdown & Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active: {activePhase.name}
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {node.currentPhaseElapsed}s / {activePhase.durationSec}s
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${phaseProgressPct}%` }}
                ></div>
              </div>
            </div>

            {/* Approach Queue Heat Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-slate-400 text-[11px]">North Approach</div>
                <div className="font-mono text-base font-bold text-white mt-0.5 flex items-center justify-between">
                  <span>{node.queueNorth} veh</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-sans">
                    N-S
                  </span>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-slate-400 text-[11px]">South Approach</div>
                <div className="font-mono text-base font-bold text-white mt-0.5 flex items-center justify-between">
                  <span>{node.queueSouth} veh</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-sans">
                    N-S
                  </span>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-slate-400 text-[11px]">East Approach</div>
                <div className="font-mono text-base font-bold text-white mt-0.5 flex items-center justify-between">
                  <span>{node.queueEast} veh</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-sans">
                    E-W
                  </span>
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <div className="text-slate-400 text-[11px]">West Approach</div>
                <div className="font-mono text-base font-bold text-white mt-0.5 flex items-center justify-between">
                  <span>{node.queueWest} veh</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-sans">
                    E-W
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Approach Delay:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded border ${currentLOSStyle.bg} ${currentLOSStyle.text} ${currentLOSStyle.border}`}>
              {node.websterDelaySec}s (LOS {currentLOS})
            </span>
          </div>
        </div>

        {/* Card 2: Webster's Optimum AI Solution */}
        <div className="bg-slate-950/70 border border-cyan-800/40 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>AI Optimum Split (Webster)</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-bold">
                -{delayReductionPct}% Delay
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400">Optimum Cycle C_opt</div>
                <div className="text-xl font-extrabold font-mono text-cyan-300 mt-1">
                  {webster.optimumCycleSec}s
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  vs {node.cycleLength}s baseline
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400">Predicted Delay</div>
                <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
                  {webster.totalDelaySec}s
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">
                  Upgraded to LOS {optimizedLOS}
                </div>
              </div>
            </div>

            {/* Split Comparison Bar */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Phase 1 (N-S Green):</span>
                  <span className="font-mono text-cyan-400 font-bold">{webster.greenSecNS}s ({Math.round((webster.greenSecNS / webster.optimumCycleSec) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${(webster.greenSecNS / webster.optimumCycleSec) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Phase 2 (E-W Green):</span>
                  <span className="font-mono text-amber-400 font-bold">{webster.greenSecEW}s ({Math.round((webster.greenSecEW / webster.optimumCycleSec) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${(webster.greenSecEW / webster.optimumCycleSec) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-cyan-300 font-semibold">Mathematical Basis:</span> Formulation derives critical flow ratios Y = Σ(q_i/s_i) with saturation flow s = 1900 vphpl and clearance lost time L = 12s.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Applied to Node Controller</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">{lastOptimizedTime}</span>
          </div>
        </div>

        {/* Card 3: Green Wave Arterial Coordination & Telemetry */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Green Wave Synchronization</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Coordinated
              </span>
            </div>

            {/* Green Wave Progression Velocity Slider */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-medium">Bandwidth Progression Speed</span>
                <span className="font-mono text-cyan-400 font-bold text-sm">{greenWaveSpeedMph} mph</span>
              </div>
              <input
                type="range"
                min="25"
                max="50"
                step="1"
                value={greenWaveSpeedMph}
                onChange={(e) => onChangeGreenWaveSpeed(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>25 mph (City Core)</span>
                <span>35 mph</span>
                <span>50 mph (Expressway)</span>
              </div>
            </div>

            {/* Coordinated Corridors List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-200">Downtown Corridor (Broadway)</span>
                </div>
                <span className="font-mono text-emerald-400 text-[11px] font-semibold">18s Offset</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-200">Tech Innovation Way</span>
                </div>
                <span className="font-mono text-emerald-400 text-[11px] font-semibold">14s Offset</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span className="text-slate-200">Financial-Medical Expressway</span>
                </div>
                <span className="font-mono text-cyan-400 text-[11px] font-semibold">22s Offset</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Average Stops Prevented:</span>
            <span className="font-mono font-bold text-emerald-400">
              ~4.2 stops / vehicle trip
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
