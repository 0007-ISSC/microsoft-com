import React, { useState } from 'react';
import { IntersectionNode } from '../types/traffic';
import { calculateWebsterCycle, getLOSFromDelay, getLOSColor } from '../utils/trafficMath';
import { 
  X, 
  Video, 
  Cpu, 
  Sliders, 
  Activity, 
  Radio, 
  ShieldAlert, 
  CheckCircle2,
  Clock
} from 'lucide-react';

interface IntersectionDetailModalProps {
  node: IntersectionNode | null;
  onClose: () => void;
  onToggleMode: (nodeId: string) => void;
  onFlushQueue: (nodeId: string, direction: 'N-S' | 'E-W') => void;
}

export const IntersectionDetailModal: React.FC<IntersectionDetailModalProps> = ({
  node,
  onClose,
  onToggleMode,
  onFlushQueue,
}) => {
  if (!node) return null;

  const queueNS = node.queueNorth + node.queueSouth;
  const queueEW = node.queueEast + node.queueWest;
  const totalQueue = Math.max(1, queueNS + queueEW);

  const flowRatioNS = (queueNS / totalQueue) * 0.75;
  const flowRatioEW = (queueEW / totalQueue) * 0.75;
  const webster = calculateWebsterCycle(flowRatioNS, flowRatioEW, 12);
  const currentLOS = getLOSFromDelay(node.websterDelaySec);
  const currentLOSStyle = getLOSColor(currentLOS);

  const activePhase = node.phases[node.currentPhaseIndex] || node.phases[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{node.name}</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {node.shortCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">{node.zone} • Adaptive Signal Controller</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Simulated CCTV Camera Feed with Optical AI Detections */}
          <div className="relative w-full h-48 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-3 select-none">
            {/* Scanline & Glitch overlay */}
            <div className="absolute inset-0 bg-radial from-transparent via-cyan-950/10 to-black/80 pointer-events-none"></div>
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #38bdf8 0px, transparent 2px, transparent 4px)',
              }}
            ></div>

            {/* Top Camera HUD Info */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-rose-400 font-bold uppercase">REC [CCTV CAM-{node.shortCode}]</span>
              </div>
              <div className="text-cyan-400 font-bold">
                {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
              </div>
            </div>

            {/* Middle Simulated Intersection Lanes & Detections */}
            <div className="relative z-10 flex items-center justify-center gap-6">
              {/* Simulated Optical AI Detection Boxes */}
              <div className="border border-cyan-400 bg-cyan-500/10 px-2 py-1 rounded text-[10px] font-mono text-cyan-300 flex flex-col items-center">
                <span>[SEDAN_08]</span>
                <span className="text-[8px] text-emerald-400">SPEED: 34 mph</span>
              </div>
              <div className="border border-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300 flex flex-col items-center">
                <span>[BUS_PRIORITY]</span>
                <span className="text-[8px] text-emerald-300">CONFIDENCE: 98%</span>
              </div>
              <div className="border border-amber-400 bg-amber-500/10 px-2 py-1 rounded text-[10px] font-mono text-amber-300 flex flex-col items-center">
                <span>[QUEUE_DETECTION]</span>
                <span className="text-[8px] text-amber-300">{totalQueue} VEHICLES</span>
              </div>
            </div>

            {/* Bottom Camera Telemetry */}
            <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>FPS: 30.0 • 1080p • OPTICAL VEHICLE TRACKER</span>
              <span className="text-emerald-400 font-bold">SENSOR FEED HEALTH: {node.sensorHealth}%</span>
            </div>
          </div>

          {/* Controller Modes & Queue Flushing Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left: Approach Queues */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
                <span>Approach Vehicle Queues</span>
                <span className="font-mono text-cyan-400">{totalQueue} Total</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">North:</span>
                  <span className="text-sm font-bold text-white">{node.queueNorth} veh</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">South:</span>
                  <span className="text-sm font-bold text-white">{node.queueSouth} veh</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">East:</span>
                  <span className="text-sm font-bold text-white">{node.queueEast} veh</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">West:</span>
                  <span className="text-sm font-bold text-white">{node.queueWest} veh</span>
                </div>
              </div>

              {/* Manual Override Flush Buttons */}
              <div className="mt-3 pt-2 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => onFlushQueue(node.id, 'N-S')}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-semibold text-[11px] transition cursor-pointer"
                >
                  Flush N-S Queue
                </button>
                <button
                  onClick={() => onFlushQueue(node.id, 'E-W')}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-semibold text-[11px] transition cursor-pointer"
                >
                  Flush E-W Queue
                </button>
              </div>
            </div>

            {/* Right: Webster Split & Delay Assessment */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Controller Mode</span>
                  <button
                    onClick={() => onToggleMode(node.id)}
                    className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition ${
                      node.mode === 'adaptive'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {node.mode === 'adaptive' ? 'ADAPTIVE' : 'FIXED CYCLE'}
                  </button>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Current Control Delay:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded border ${currentLOSStyle.bg} ${currentLOSStyle.text} ${currentLOSStyle.border}`}>
                      {node.websterDelaySec}s (LOS {currentLOS})
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Webster Optimal Cycle:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {webster.optimumCycleSec}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>N-S Green Allocation:</span>
                    <span className="font-mono text-white">
                      {webster.greenSecNS}s
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>E-W Green Allocation:</span>
                    <span className="font-mono text-white">
                      {webster.greenSecEW}s
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                Phase clearance includes 4.0s Amber + 2.0s All-Red per standard MUTCD safety guidelines.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
