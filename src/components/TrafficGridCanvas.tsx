import React, { useState } from 'react';
import { IntersectionNode, RoadCorridor, TrafficIncident, MovingVehicle } from '../types/traffic';
import { getLOSColor } from '../utils/trafficMath';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Video, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Zap, 
  Radio,
  Eye,
  Crosshair,
  Sliders,
  MapPin,
  Compass,
  CloudRain,
  Sun,
  Moon,
  Clock,
  Globe
} from 'lucide-react';
import { playHudClick, playRadarPing, playEmergencyAlert } from '../utils/soundEffects';

interface GlobalLocation {
  id: string;
  name: string;
  city: string;
  lat: string;
  lng: string;
  altitude: string;
  bearing: string;
  timezone: string;
  baseSpeed: number;
}

const METROPOLITAN_LOCATIONS: GlobalLocation[] = [
  {
    id: 'loc-sf',
    name: 'Metropolitan Tech Corridor (Broadway & Grand)',
    city: 'San Francisco, CA',
    lat: '37.7749° N',
    lng: '122.4194° W',
    altitude: '48m MSL',
    bearing: '342° NNW',
    timezone: 'PST (UTC-8)',
    baseSpeed: 38,
  },
  {
    id: 'loc-nyc',
    name: 'Midtown 5th Avenue & Central Arterial',
    city: 'New York, NY',
    lat: '40.7580° N',
    lng: '73.9855° W',
    altitude: '12m MSL',
    bearing: '028° NNE',
    timezone: 'EST (UTC-5)',
    baseSpeed: 24,
  },
  {
    id: 'loc-ldn',
    name: 'Westminster & Thames Ring Expressway',
    city: 'London, UK',
    lat: '51.5074° N',
    lng: '0.1278° W',
    altitude: '18m MSL',
    bearing: '184° S',
    timezone: 'GMT (UTC+0)',
    baseSpeed: 30,
  },
  {
    id: 'loc-tky',
    name: 'Shinjuku High-Capacity Transit Loop',
    city: 'Tokyo, Japan',
    lat: '35.6895° N',
    lng: '139.6917° E',
    altitude: '34m MSL',
    bearing: '095° E',
    timezone: 'JST (UTC+9)',
    baseSpeed: 42,
  },
];

interface TrafficGridCanvasProps {
  intersections: IntersectionNode[];
  corridors: RoadCorridor[];
  incidents: TrafficIncident[];
  vehicles: MovingVehicle[];
  selectedIntersectionId: string | null;
  onSelectIntersection: (id: string | null) => void;
  highlightedCorridorIds?: string[];
  emergencyPreemptionActive: boolean;
  onTriggerEmergencyPreemption: () => void;
}

export const TrafficGridCanvas: React.FC<TrafficGridCanvasProps> = ({
  intersections,
  corridors,
  incidents,
  vehicles,
  selectedIntersectionId,
  onSelectIntersection,
  highlightedCorridorIds = [],
  emergencyPreemptionActive,
  onTriggerEmergencyPreemption,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showHeadlights, setShowHeadlights] = useState(true);
  const [mapVfxMode, setMapVfxMode] = useState<'cyber' | 'radar'>('cyber');
  const [weatherMode, setWeatherMode] = useState<'clear' | 'rain' | 'night'>('clear');
  const [selectedLocation, setSelectedLocation] = useState<GlobalLocation>(METROPOLITAN_LOCATIONS[0]);
  const [hoveredNode, setHoveredNode] = useState<IntersectionNode | null>(null);
  const [customPins, setCustomPins] = useState<{ x: number; y: number; label: string }[]>([]);

  const handleZoomIn = () => {
    playHudClick();
    setZoom((prev) => Math.min(1.8, prev + 0.15));
  };

  const handleZoomOut = () => {
    playHudClick();
    setZoom((prev) => Math.max(0.65, prev - 0.15));
  };

  const handleResetZoom = () => {
    playHudClick();
    setZoom(1);
  };

  const handleLocationChange = (locId: string) => {
    playRadarPing();
    const found = METROPOLITAN_LOCATIONS.find((l) => l.id === locId) || METROPOLITAN_LOCATIONS[0];
    setSelectedLocation(found);
  };

  const getNodePos = (id: string) => {
    const node = intersections.find((n) => n.id === id);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // Drop tactical coordinate pin
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 800 + 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 840 + 80);
    
    // Add custom inspection pin
    if (customPins.length >= 4) {
      setCustomPins([{ x, y, label: `PIN-${Date.now().toString().slice(-3)}` }]);
    } else {
      setCustomPins((prev) => [...prev, { x, y, label: `PIN-${Date.now().toString().slice(-3)}` }]);
    }
    playHudClick();
  };

  return (
    <div className="relative w-full h-[680px] rounded-3xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-2xl flex flex-col select-none">
      
      {/* Background Holographic Ambience & Weather Overlays */}
      <div className="absolute inset-0 bg-radial from-cyan-950/20 via-slate-950 to-black pointer-events-none"></div>

      {weatherMode === 'rain' && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none animate-pulse"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, rgba(56, 189, 248, 0.4) 0px, rgba(56, 189, 248, 0.4) 1px, transparent 1px, transparent 8px)',
          }}
        ></div>
      )}

      {/* Top HUD Telemetry Bar with Location Switcher */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Global Location Selector & GPS Coordinates */}
        <div className="flex items-center gap-3 pointer-events-auto bg-slate-950/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '16s' }} />
            <select
              value={selectedLocation.id}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
            >
              {METROPOLITAN_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-slate-900 text-white font-mono">
                  {loc.city} — {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800"></div>

          {/* GPS Telemetry */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="text-cyan-300 font-semibold">{selectedLocation.lat}, {selectedLocation.lng}</span>
            <span>ALT: {selectedLocation.altitude}</span>
            <span>BEARING: {selectedLocation.bearing}</span>
          </div>
        </div>

        {/* Right: Weather & Layer VFX Toggles */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          
          {/* Weather Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                playHudClick();
                setWeatherMode('clear');
              }}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                weatherMode === 'clear' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Clear Sky Conditions"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                playHudClick();
                setWeatherMode('rain');
              }}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                weatherMode === 'rain' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Precipitation / Wet Road Friction Conditions"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                playHudClick();
                setWeatherMode('night');
              }}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                weatherMode === 'night' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Night Thermal Vision Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-0.5"></div>

          {/* VFX Themes */}
          <button
            onClick={() => {
              playHudClick();
              setMapVfxMode(mapVfxMode === 'cyber' ? 'radar' : 'cyber');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              mapVfxMode === 'cyber'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>{mapVfxMode === 'cyber' ? 'CYBER HUD' : 'RADAR SWEEP'}</span>
          </button>

          <button
            onClick={() => {
              playHudClick();
              setShowHeadlights(!showHeadlights);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showHeadlights
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Headlights</span>
          </button>

          <button
            onClick={() => {
              playHudClick();
              setShowHeatmap(!showHeatmap);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showHeatmap
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Heat Glow</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5"></div>

          {/* Zoom Buttons */}
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Reset Grid Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Tactical Hover Card */}
      {hoveredNode && (
        <div className="absolute top-20 left-4 z-20 pointer-events-none bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl text-xs space-y-1.5 w-64 animate-fade-in">
          <div className="flex items-center justify-between font-mono">
            <span className="font-bold text-cyan-300">{hoveredNode.shortCode}</span>
            <span className="text-[10px] text-slate-400 uppercase">{hoveredNode.zone}</span>
          </div>
          <div className="text-white font-bold">{hoveredNode.name}</div>
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono text-slate-300">
            <div className="bg-slate-950 p-1.5 rounded">
              <span className="text-slate-400 block text-[9px]">Cycle Split:</span>
              <span className="text-cyan-400 font-bold">{hoveredNode.cycleLength}s</span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded">
              <span className="text-slate-400 block text-[9px]">Webster Delay:</span>
              <span className="text-emerald-400 font-bold">{hoveredNode.websterDelaySec}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Emergency Preemption Trigger Banner */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => {
            playEmergencyAlert();
            onTriggerEmergencyPreemption();
          }}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl border transition-all cursor-pointer ${
            emergencyPreemptionActive
              ? 'bg-rose-600 text-white border-rose-400 shadow-rose-950 animate-pulse'
              : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700 hover:border-rose-500/60'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${emergencyPreemptionActive ? 'text-white' : 'text-rose-400'}`} />
          <span>
            {emergencyPreemptionActive
              ? 'EVP ACTIVE: Priority Green Corridor 3 Cleared'
              : 'Trigger Emergency Vehicle Preemption (EVP)'}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-cyan-300">
            {emergencyPreemptionActive ? 'OVERRIDE ON' : 'STANDBY'}
          </span>
        </button>

        {customPins.length > 0 && (
          <button
            onClick={() => setCustomPins([])}
            className="px-3 py-2 rounded-xl text-[11px] font-mono bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Clear Dropped Waypoints"
          >
            Clear Pins ({customPins.length})
          </button>
        )}
      </div>

      {/* Interactive Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden md:flex items-center gap-3 bg-slate-950/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <span>LOS A-B (Free)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
          <span>LOS C (Stable)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <span>LOS D (Heavy)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
          <span>LOS E-F (Gridlock)</span>
        </div>
      </div>

      {/* Main Vector SVG Map Display */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-2">
        <svg
          viewBox="100 80 800 840"
          onClick={handleMapClick}
          className="w-full h-full transition-transform duration-200 select-none cursor-crosshair"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <defs>
            {/* Cyber Grid Lines */}
            <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" />
            </pattern>

            {/* Glowing filter for highlighted routes */}
            <filter id="neonRouteGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Glowing filter for vehicle light trails */}
            <filter id="headlightGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
            </filter>

            {/* Radar Sweep Radial Gradient */}
            <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Tactical Grid Background */}
          <rect x="0" y="0" width="1000" height="1000" fill="url(#tacticalGrid)" />

          {/* Radar Sweep Overlay Effect */}
          {mapVfxMode === 'radar' && (
            <g transform="translate(500, 500)" className="pointer-events-none">
              <circle r="420" fill="none" stroke="#0891b2" strokeWidth="1" strokeDasharray="6 8" opacity="0.4" />
              <circle r="280" fill="none" stroke="#0891b2" strokeWidth="1" opacity="0.3" />
              <circle r="140" fill="none" stroke="#0891b2" strokeWidth="1" opacity="0.2" />
              <line x1="-420" y1="0" x2="420" y2="0" stroke="#0891b2" strokeWidth="0.5" opacity="0.3" />
              <line x1="0" y1="-420" x2="0" y2="420" stroke="#0891b2" strokeWidth="0.5" opacity="0.3" />

              {/* Animated Rotating Radar Beam */}
              <circle
                r="420"
                fill="url(#radarSweepGrad)"
                className="animate-spin"
                style={{ animationDuration: '6s', transformOrigin: 'center center' }}
              />
            </g>
          )}

          {/* METROPOLITAN ROAD CORRIDORS */}
          {corridors.map((corr) => {
            const start = getNodePos(corr.fromNodeId);
            const end = getNodePos(corr.toNodeId);
            const losColors = getLOSColor(corr.levelOfService);
            const isHighlighted = highlightedCorridorIds.includes(corr.id);
            const isCorridorPreempted = emergencyPreemptionActive && (corr.id === 'corr-3-6' || corr.id === 'corr-6-9');
            const roadWidth = corr.lanes * 8 + 8;

            return (
              <g key={corr.id} className="cursor-pointer">
                {/* Heatmap Congestion Aura */}
                {showHeatmap && (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={losColors.dot}
                    strokeWidth={roadWidth + 22}
                    strokeOpacity={corr.congestionPercent / 180 + 0.12}
                    strokeLinecap="round"
                  />
                )}

                {/* Base Road Asphalt Layer */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#0f172a"
                  strokeWidth={roadWidth}
                  strokeLinecap="round"
                />

                {/* Inner Road Bed */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#020617"
                  strokeWidth={roadWidth - 4}
                  strokeLinecap="round"
                />

                {/* Animated Flow Center Markings */}
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="10 12"
                />

                {/* Green Wave Progression Beam */}
                {corr.hasGreenWave && (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray="16 20"
                    className="animate-pulse"
                    opacity="0.85"
                  />
                )}

                {/* AI Navigation Highlight */}
                {isHighlighted && (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#38bdf8"
                    strokeWidth="6"
                    strokeDasharray="14 10"
                    filter="url(#neonRouteGlow)"
                  />
                )}

                {/* Emergency EVP Priority Corridor Aura */}
                {isCorridorPreempted && (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray="16 12"
                    className="animate-pulse"
                  />
                )}

                {/* Corridor Flow & Velocity Badge */}
                <g transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2})`}>
                  <rect
                    x="-42"
                    y="-13"
                    width="84"
                    height="26"
                    rx="8"
                    fill="#030712"
                    stroke={losColors.dot}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="-1"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="monospace"
                  >
                    {corr.currentSpeedMph} MPH
                  </text>
                  <text
                    x="0"
                    y="7.5"
                    fill="#94a3b8"
                    fontSize="7.5"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="monospace"
                  >
                    LOS {corr.levelOfService} • {corr.congestionPercent}%
                  </text>
                </g>
              </g>
            );
          })}

          {/* ACTIVE MOVING VEHICLES & LIGHT TRAILS */}
          {vehicles.map((v) => {
            const corr = corridors.find((c) => c.id === v.corridorId);
            if (!corr) return null;
            const start = getNodePos(corr.fromNodeId);
            const end = getNodePos(corr.toNodeId);

            const curX = start.x + (end.x - start.x) * v.progress;
            const curY = start.y + (end.y - start.y) * v.progress;
            const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

            return (
              <g
                key={v.id}
                transform={`translate(${curX}, ${curY}) rotate(${angle})`}
                className="pointer-events-none transition-transform duration-100 ease-linear"
              >
                {/* Simulated Headlight Cone Ahead of Vehicle */}
                {showHeadlights && (
                  <path
                    d="M 6 -3 L 34 -12 L 34 12 L 6 3 Z"
                    fill="rgba(254, 240, 138, 0.15)"
                    filter="url(#headlightGlow)"
                  />
                )}

                {/* Emergency Siren Flare */}
                {v.isEmergency && (
                  <circle
                    r="18"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    className="animate-ping"
                  />
                )}

                {/* Vehicle Chassis */}
                {v.type === 'bus' ? (
                  <rect
                    x="-12"
                    y="-6"
                    width="24"
                    height="12"
                    rx="3"
                    fill={v.color}
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                ) : v.type === 'ambulance' ? (
                  <g>
                    <rect
                      x="-10"
                      y="-5"
                      width="20"
                      height="10"
                      rx="3"
                      fill="#ffffff"
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                    <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#ef4444" strokeWidth="2" />
                  </g>
                ) : (
                  <rect
                    x="-8"
                    y="-4"
                    width="16"
                    height="8"
                    rx="2"
                    fill={v.color}
                    stroke="#020617"
                    strokeWidth="1.2"
                  />
                )}

                {/* Tail Brake Lights */}
                <circle cx="-8" cy="-2.5" r="1.2" fill="#ef4444" />
                <circle cx="-8" cy="2.5" r="1.2" fill="#ef4444" />
              </g>
            );
          })}

          {/* ACTIVE INCIDENTS */}
          {incidents.map((inc) => {
            const corr = corridors.find((c) => c.id === inc.corridorId);
            if (!corr) return null;
            const start = getNodePos(corr.fromNodeId);
            const end = getNodePos(corr.toNodeId);
            const midX = (start.x + end.x) / 2 + 20;
            const midY = (start.y + end.y) / 2 - 20;

            return (
              <g key={inc.id} transform={`translate(${midX}, ${midY})`} className="cursor-pointer">
                <circle r="18" fill="#f43f5e" fillOpacity="0.25" className="animate-ping" />
                <circle r="14" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                <path d="M 0 -6 L -5 5 L 5 5 Z" fill="#ffffff" />
                <circle cx="0" cy="1.5" r="0.9" fill="#e11d48" />
                <circle cx="0" cy="3.5" r="0.9" fill="#e11d48" />
              </g>
            );
          })}

          {/* USER-DROPPED TACTICAL WAYPOINT PINS */}
          {customPins.map((pin, i) => (
            <g key={i} transform={`translate(${pin.x}, ${pin.y})`} className="cursor-pointer">
              <circle r="16" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" className="animate-spin" />
              <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="-12" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {pin.label}
              </text>
            </g>
          ))}

          {/* INTERSECTIONS (Nodes) */}
          {intersections.map((node) => {
            const isSelected = selectedIntersectionId === node.id;
            const isPreempted = node.mode === 'preempted' || (emergencyPreemptionActive && (node.id === 'int-3' || node.id === 'int-6' || node.id === 'int-9'));
            const activePhase = node.phases[node.currentPhaseIndex] || node.phases[0];
            const isNorthSouthGreen = activePhase.direction === 'N-S';
            const totalQueue = node.queueNorth + node.queueSouth + node.queueEast + node.queueWest;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  playHudClick();
                  onSelectIntersection(node.id);
                }}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
              >
                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    r="40"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                    className="animate-spin"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Preemption Siren Ring */}
                {isPreempted && (
                  <circle
                    r="44"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3.5"
                    className="animate-ping"
                  />
                )}

                {/* Intersection Junction Housing */}
                <rect
                  x="-26"
                  y="-26"
                  width="52"
                  height="52"
                  rx="14"
                  fill="#030712"
                  stroke={isSelected ? '#06b6d4' : isPreempted ? '#ef4444' : '#334155'}
                  strokeWidth={isSelected || isPreempted ? '3' : '1.8'}
                  className="transition-colors group-hover:stroke-cyan-400 shadow-2xl"
                />

                {/* 3-State Traffic Signal Gantry */}
                <g transform="translate(0, -7)">
                  <rect x="-16" y="-8" width="32" height="16" rx="5" fill="#000000" stroke="#1f2937" strokeWidth="1" />
                  
                  {/* N-S Signal Light */}
                  <circle
                    cx="-7"
                    cy="0"
                    r="4.5"
                    fill={isNorthSouthGreen ? '#10b981' : '#f43f5e'}
                    className={isNorthSouthGreen ? 'animate-pulse' : ''}
                  />

                  {/* E-W Signal Light */}
                  <circle
                    cx="7"
                    cy="0"
                    r="4.5"
                    fill={!isNorthSouthGreen ? '#10b981' : '#f43f5e'}
                    className={!isNorthSouthGreen ? 'animate-pulse' : ''}
                  />
                </g>

                {/* Controller Code */}
                <text
                  x="0"
                  y="14"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {node.shortCode}
                </text>

                {/* Queue badge */}
                {totalQueue > 0 && (
                  <g transform="translate(-18, -18)">
                    <rect
                      x="-11"
                      y="-8"
                      width="22"
                      height="15"
                      rx="4"
                      fill={totalQueue > 25 ? '#e11d48' : totalQueue > 12 ? '#f59e0b' : '#059669'}
                    />
                    <text
                      x="0"
                      y="4"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {totalQueue}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
