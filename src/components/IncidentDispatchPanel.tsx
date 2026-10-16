import React, { useState } from 'react';
import { TrafficIncident, RoadCorridor } from '../types/traffic';
import { 
  AlertTriangle, 
  Truck, 
  CheckCircle, 
  Plus, 
  Clock, 
  MapPin, 
  Radio, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface IncidentDispatchPanelProps {
  incidents: TrafficIncident[];
  corridors: RoadCorridor[];
  onResolveIncident: (id: string) => void;
  onAddIncident: (incident: Omit<TrafficIncident, 'id'>) => void;
  onFocusCorridor: (corridorId: string) => void;
}

export const IncidentDispatchPanel: React.FC<IncidentDispatchPanelProps> = ({
  incidents,
  corridors,
  onResolveIncident,
  onAddIncident,
  onFocusCorridor,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Stalled Truck on Expressway');
  const [newType, setNewType] = useState<'collision' | 'stall' | 'roadwork' | 'debris' | 'weather'>('collision');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [selectedCorridorId, setSelectedCorridorId] = useState(corridors[0]?.id || 'corr-4-5');
  const [newBlockedLanes, setNewBlockedLanes] = useState(2);

  const activeIncidents = incidents.filter((i) => i.status !== 'cleared');

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const corr = corridors.find((c) => c.id === selectedCorridorId);
    onAddIncident({
      title: newTitle,
      type: newType,
      severity: newSeverity,
      corridorId: selectedCorridorId,
      locationName: corr?.name || 'Metropolitan Urban Corridor',
      reportedMinutesAgo: 1,
      lanesBlocked: newBlockedLanes,
      estimatedClearanceMinutes: newSeverity === 'critical' ? 35 : newSeverity === 'high' ? 20 : 12,
      status: 'active',
      recommendedDetour: 'Divert through adjacent parallel avenues to avoid queue spillback.',
    });
    setShowAddModal(false);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Incident Response & Dispatch Hub</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {activeIncidents.length} Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Automated sensor anomaly detection & clearance tracking</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Dynamic VMS Warning Broadcast Banner */}
      <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
        <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
            Dynamic VMS Sign Broadcast Live:
          </div>
          <div className="text-xs font-mono font-bold text-amber-200 mt-0.5">
            {activeIncidents.length > 0
              ? `[VMS ALERT]: ${activeIncidents[0].title.toUpperCase()} • ${activeIncidents[0].lanesBlocked} LANES BLOCKED • ADAPTIVE DETOURS ACTIVE`
              : '[VMS NORMAL]: ALL METROPOLITAN CORRIDORS RUNNING AT OPTIMAL LEVEL OF SERVICE'}
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {activeIncidents.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-semibold text-slate-300">All Urban Corridors Clear</div>
            <div className="text-xs text-slate-400 mt-1">
              No reported accidents, stalls, or lane closures across the metropolitan grid.
            </div>
          </div>
        ) : (
          activeIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 flex flex-col gap-2 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">
                      {incident.type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {incident.reportedMinutesAgo}m ago
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white mt-1">{incident.title}</h4>
                </div>

                {/* Dispatch / Clear Button */}
                <button
                  onClick={() => onResolveIncident(incident.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition active:scale-95 cursor-pointer shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dispatch & Clear</span>
                </button>
              </div>

              {/* Location & Detour details */}
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-300">{incident.locationName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-rose-400 font-semibold">{incident.lanesBlocked} Lane(s) Blocked</span>
              </div>

              <div className="bg-slate-900/90 rounded-lg p-2.5 text-[11px] text-slate-300 border border-slate-800 flex items-start justify-between gap-2">
                <div>
                  <span className="text-cyan-400 font-semibold">AI Reroute Recommendation: </span>
                  <span>{incident.recommendedDetour}</span>
                </div>
                <button
                  onClick={() => onFocusCorridor(incident.corridorId)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono shrink-0 cursor-pointer"
                >
                  Locate
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal to report simulated incident */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Simulate / Inject Urban Incident</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Headline</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="collision">Collision</option>
                    <option value="stall">Stalled Vehicle</option>
                    <option value="roadwork">Emergency Roadwork</option>
                    <option value="debris">Debris on Roadway</option>
                    <option value="weather">Localized Flooding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="low">Low (Shoulder)</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Gridlock Risk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Affected Corridor</label>
                <select
                  value={selectedCorridorId}
                  onChange={(e) => setSelectedCorridorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  {corridors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.speedLimitMph} mph)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Lanes Blocked</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewBlockedLanes(num)}
                      className={`flex-1 py-1.5 rounded-lg font-mono font-bold transition cursor-pointer ${
                        newBlockedLanes === num
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {num} {num === 1 ? 'Lane' : 'Lanes'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                >
                  Inject Incident Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
