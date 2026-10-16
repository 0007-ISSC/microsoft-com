import React from 'react';
import { RoadCorridor, IntersectionNode } from '../types/traffic';
import { 
  BarChart3, 
  TrendingUp, 
  Leaf, 
  Activity, 
  Car, 
  Clock, 
  Cpu, 
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface UrbanAnalyticsModalProps {
  corridors: RoadCorridor[];
  intersections: IntersectionNode[];
}

export const UrbanAnalyticsModal: React.FC<UrbanAnalyticsModalProps> = ({
  corridors,
  intersections,
}) => {
  // Aggregate real-time statistics
  const avgCongestion = Math.round(
    corridors.reduce((acc, c) => acc + c.congestionPercent, 0) / corridors.length
  );
  const avgSpeed = Math.round(
    corridors.reduce((acc, c) => acc + c.currentSpeedMph, 0) / corridors.length
  );
  const totalFlow = corridors.reduce((acc, c) => acc + c.currentFlowVehPerHour, 0);
  const totalQueues = intersections.reduce(
    (acc, n) => acc + n.queueNorth + n.queueSouth + n.queueEast + n.queueWest,
    0
  );

  // Hourly profile simulation data
  const hourlyData = [
    { hour: '06:00', index: 24, flow: 1200 },
    { hour: '07:30', index: 62, flow: 3400 },
    { hour: '08:30 (AM Peak)', index: 84, flow: 4600 },
    { hour: '10:00', index: 48, flow: 2600 },
    { hour: '12:30 (Noon)', index: 54, flow: 2900 },
    { hour: '15:00', index: 58, flow: 3100 },
    { hour: '17:30 (PM Peak)', index: 88, flow: 4900 },
    { hour: '19:30', index: 44, flow: 2400 },
    { hour: '22:00', index: 21, flow: 1100 },
  ];

  // LOS distribution counts
  const losCounts = {
    A: corridors.filter((c) => c.levelOfService === 'A').length,
    B: corridors.filter((c) => c.levelOfService === 'B').length,
    C: corridors.filter((c) => c.levelOfService === 'C').length,
    D: corridors.filter((c) => c.levelOfService === 'D').length,
    E: corridors.filter((c) => c.levelOfService === 'E').length,
    F: corridors.filter((c) => c.levelOfService === 'F').length,
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Urban Traffic Analytics & Flow Optimization Telemetry</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Greenshields & HCM 2022
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Macro & micro urban mobility metrics, queuing delay reductions, and environmental impact
            </p>
          </div>
        </div>
      </div>

      {/* Top 4 Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Grid Congestion Index</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">
            {avgCongestion}%
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
            -18.2% vs uncoordinated baseline
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Average Arterial Speed</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
            {avgSpeed} mph
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
            +7.4 mph speed progression gain
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Carbon Emission Avoided</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
            14.8 Tons
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            6,420 L fuel saved today
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Network Commute Hours Saved</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-300 mt-1">
            1,840 hrs
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Across 28,400 daily trips
          </div>
        </div>
      </div>

      {/* Hourly Congestion Profile Chart (CSS Bar visualization) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-200">
            24-Hour Congestion Profile & Traffic Demand (Veh/Hr)
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            AM/PM Peak Wave Optimization Active
          </span>
        </div>

        <div className="grid grid-cols-9 gap-2 items-end h-32 pt-4 px-2 border-b border-slate-800">
          {hourlyData.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end group">
              <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                {h.index}%
              </span>
              <div
                className={`w-full rounded-t transition-all ${
                  h.index > 80
                    ? 'bg-rose-500'
                    : h.index > 50
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ height: `${h.index}%` }}
              ></div>
              <span className="text-[9px] font-mono text-slate-400 text-center truncate max-w-full">
                {h.hour.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Level of Service Distribution & Modal Classification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Level of Service Breakdown */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
            <span>Corridor Level of Service (HCM 2022)</span>
            <span className="text-[10px] text-slate-400 font-mono">{corridors.length} Total Corridors</span>
          </div>

          <div className="space-y-2">
            {[
              { los: 'A', label: 'LOS A (Free Flow, Delay <= 10s)', count: losCounts.A, color: 'bg-emerald-500' },
              { los: 'B', label: 'LOS B (Stable Flow, Delay 10-20s)', count: losCounts.B, color: 'bg-teal-500' },
              { los: 'C', label: 'LOS C (Minor Delay, 20-35s)', count: losCounts.C, color: 'bg-cyan-500' },
              { los: 'D', label: 'LOS D (High Density, 35-55s)', count: losCounts.D, color: 'bg-amber-500' },
              { los: 'E', label: 'LOS E (Near Capacity, 55-80s)', count: losCounts.E, color: 'bg-orange-500' },
              { los: 'F', label: 'LOS F (Breakdown / Gridlock > 80s)', count: losCounts.F, color: 'bg-rose-500' },
            ].map((item) => (
              <div key={item.los} className="text-xs">
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono font-bold text-white">{item.count} segments</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${item.color} h-full`}
                    style={{ width: `${(item.count / corridors.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Vehicle Fleet Composition */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span>Classified Vehicle Fleet Matrix</span>
              <span className="text-[10px] text-cyan-400 font-mono">CCTV Optical AI Counts</span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Passenger Cars & EVs', pct: 67, color: 'bg-cyan-400' },
                { name: 'Public Transit Buses (Green Wave Priority)', pct: 14, color: 'bg-emerald-400' },
                { name: 'Commercial Logistics & Delivery Vans', pct: 13, color: 'bg-amber-400' },
                { name: 'Micro-Mobility & Cyclists', pct: 4, color: 'bg-purple-400' },
                { name: 'Emergency Responders (EVP Equipped)', pct: 2, color: 'bg-rose-500' },
              ].map((item, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>{item.name}</span>
                    <span className="font-mono font-bold text-white">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full`} style={{ width: `${item.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              Real-time classification enables dynamic bus-priority extensions and heavy-truck acceleration clearance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
