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
  ShieldCheck,
  Volume2,
  VolumeX,
  Megaphone,
  RotateCw
} from 'lucide-react';
import { playHudClick, playSuccessChime } from '../utils/soundEffects';
import { 
  speakMajorIncidentAlert, 
  speakIncidentClearance, 
  speakAnnouncement, 
  isTtsEnabled, 
  setTtsEnabled 
} from '../utils/trafficSpeech';

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
  const [newTitle, setNewTitle] = useState('Stalled Heavy Vehicle on Expressway');
  const [newType, setNewType] = useState<'collision' | 'stall' | 'roadwork' | 'debris' | 'weather'>('collision');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [selectedCorridorId, setSelectedCorridorId] = useState(corridors[0]?.id || 'corr-4-5');
  const [newBlockedLanes, setNewBlockedLanes] = useState(2);
  const [audioNotificationsOn, setAudioNotificationsOn] = useState(true);
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const activeIncidents = incidents.filter((i) => i.status !== 'cleared');

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const corr = corridors.find((c) => c.id === selectedCorridorId);
    const locationName = corr?.name || 'Metropolitan Urban Corridor';
    const detourText = 'Divert through adjacent parallel avenues to avoid queue spillback.';

    onAddIncident({
      title: newTitle,
      type: newType,
      severity: newSeverity,
      corridorId: selectedCorridorId,
      locationName,
      reportedMinutesAgo: 1,
      lanesBlocked: newBlockedLanes,
      estimatedClearanceMinutes: newSeverity === 'critical' ? 35 : newSeverity === 'high' ? 20 : 12,
      status: 'active',
      recommendedDetour: detourText,
    });

    setShowAddModal(false);
  };

  const handleResolveAndAnnounce = (incident: TrafficIncident) => {
    onResolveIncident(incident.id);
  };

  const handleManualBroadcast = (incident: TrafficIncident) => {
    playHudClick();
    setBroadcastingId(incident.id);
    speakMajorIncidentAlert(
      incident.title,
      incident.locationName,
      incident.severity,
      incident.lanesBlocked,
      incident.recommendedDetour
    );
    setTimeout(() => setBroadcastingId(null), 4000);
  };

  const handleTestTtsBroadcast = () => {
    playHudClick();
    speakMajorIncidentAlert(
      'Simulated Collision on Central Corridor',
      'Broadway & Grand Avenue Junction',
      'high',
      2,
      'Reroute traffic via 7th Avenue Expressway to prevent intersection gridlock.'
    );
  };

  const toggleTtsNotifications = () => {
    const next = !audioNotificationsOn;
    setAudioNotificationsOn(next);
    setTtsEnabled(next);
    playHudClick();
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
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
      
      {/* Panel Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Incident Response & Audio Dispatch Hub</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {activeIncidents.length} Active Incidents
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sensor anomaly detection, Web Speech API real-time oral incident broadcasts, and detour coordination
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {/* TTS Audio Notification Toggle */}
          <button
            onClick={toggleTtsNotifications}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              audioNotificationsOn
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Real-Time Audio TTS Broadcasts"
          >
            {audioNotificationsOn ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Oral Audio Alerts: {audioNotificationsOn ? 'ACTIVE' : 'MUTED'}</span>
          </button>

          {/* Test TTS Broadcast */}
          <button
            onClick={handleTestTtsBroadcast}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition cursor-pointer"
            title="Test Browser Text-to-Speech Voice"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Test Audio Alert</span>
          </button>

          {/* Report New Incident Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Dynamic VMS Warning Broadcast Banner with TTS indicator */}
      <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold flex items-center gap-2">
              <span>Dynamic VMS Sign & Audio Alert Engine:</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                Web Speech API Armed
              </span>
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-amber-200 mt-1">
              {activeIncidents.length > 0
                ? `[BROADCAST]: ${activeIncidents[0].title.toUpperCase()} • ${activeIncidents[0].lanesBlocked} LANES BLOCKED • ADAPTIVE DETOURS ACTIVE`
                : '[BROADCAST]: ALL METROPOLITAN SECTORS NOMINAL • HIGHWAY LEVEL OF SERVICE OPTIMAL'}
            </div>
          </div>
        </div>

        {activeIncidents.length > 0 && (
          <button
            onClick={() => handleManualBroadcast(activeIncidents[0])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition cursor-pointer shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Oral Broadcast</span>
          </button>
        )}
      </div>

      {/* Incidents List with Oral Speech Triggers */}
      <div className="space-y-3">
        {activeIncidents.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-bold text-slate-200">All Urban Corridors Free of Incidents</div>
            <div className="text-xs text-slate-400 mt-1">
              No active collisions, stalled vehicles, or lane closures across the metropolitan grid.
            </div>
          </div>
        ) : (
          activeIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col gap-3 transition shadow-lg"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
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
                  <h4 className="text-sm sm:text-base font-bold text-white mt-1.5">{incident.title}</h4>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Oral Speech Broadcast Button */}
                  <button
                    onClick={() => handleManualBroadcast(incident)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      broadcastingId === incident.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-800 hover:border-cyan-500/40'
                    }`}
                    title="Broadcast Spoken Incident Advisory via Text-to-Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{broadcastingId === incident.id ? 'Speaking...' : 'Oral Broadcast'}</span>
                  </button>

                  {/* Dispatch / Clear Button */}
                  <button
                    onClick={() => handleResolveAndAnnounce(incident)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dispatch & Clear</span>
                  </button>
                </div>
              </div>

              {/* Location & Detour details */}
              <div className="text-xs text-slate-400 flex items-center gap-2 font-medium">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-slate-300">{incident.locationName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-rose-400 font-semibold">{incident.lanesBlocked} Lane(s) Blocked</span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-400 font-mono">Est. Clearance: ~{incident.estimatedClearanceMinutes}m</span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 text-xs text-slate-300 border border-slate-800 flex items-start justify-between gap-3">
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Inject Traffic Incident & Trigger Audio Alert</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Headline</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
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
                      className={`flex-1 py-1.5 rounded-xl font-mono font-bold transition cursor-pointer ${
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
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer shadow-lg shadow-rose-950"
                >
                  Inject & Speak Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
