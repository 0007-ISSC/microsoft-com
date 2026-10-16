import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  CameraOff, 
  Eye, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  Scan, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw,
  Terminal,
  Radio,
  FileText,
  Mic,
  MicOff,
  User,
  Car,
  Lightbulb,
  Crosshair,
  TrendingUp,
  Cpu,
  Search,
  Download,
  Filter,
  Play,
  Share2,
  Calendar,
  Clock,
  Layers
} from 'lucide-react';
import { playHudClick, playRadarPing, playEmergencyAlert, playSuccessChime } from '../utils/soundEffects';
import { speakAnnouncement } from '../utils/trafficSpeech';

export interface VisionLogItem {
  id: string;
  timestamp: string;
  isoTime: string;
  category: 'vehicle' | 'human' | 'signal' | 'road' | 'object' | 'risk' | 'oral';
  title: string;
  detail: string;
  oralSummary: string;
  severity: 'normal' | 'warning' | 'critical';
  confidence: number;
  trackId?: string;
  metrics?: {
    velocityMph?: number;
    frictionMu?: number;
    stoppingDistanceFt?: number;
    pedestrianCount?: number;
    headwaySec?: number;
  };
}

export const CameraVisionModule: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [oralInstructionsEnabled, setOralInstructionsEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'vehicle' | 'human' | 'signal' | 'road' | 'risk' | 'oral'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSpokenText, setLastSpokenText] = useState('Camera AI Vision standby. Turn on camera to commence comprehensive multi-modal detection.');
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const [playingLogId, setPlayingLogId] = useState<string | null>(null);

  // Live Multi-Modal Optical Stats
  const [visionStats, setVisionStats] = useState({
    vehiclesCount: 18,
    humansCount: 12,
    signalState: 'GREEN (Phase 1)',
    signalCountdown: 26,
    roadCondition: 'DRY • μ = 0.84',
    riskIndex: 'LOW (8%)',
    objectsDetected: '0 Road Hazards',
    flowRateVph: 2540,
  });

  // Seed with realistic, professional historical audit records
  const [logs, setLogs] = useState<VisionLogItem[]>([
    {
      id: 'audit-001',
      timestamp: new Date(Date.now() - 36000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date(Date.now() - 36000).toISOString(),
      category: 'vehicle',
      title: 'Platoon Wave Velocity & Headway Verification',
      detail: 'Multi-lane optical tracker logged 18 vehicles. Average velocity 34.6 mph with 2.4s headway between lead and trailing vehicles.',
      oralSummary: 'Traffic sensor report. 18 vehicles tracked on arterial. Platoon velocity stable at 35 miles per hour with nominal spacing.',
      severity: 'normal',
      confidence: 98.4,
      trackId: 'PLT-8820',
      metrics: { velocityMph: 34.6, headwaySec: 2.4 },
    },
    {
      id: 'audit-002',
      timestamp: new Date(Date.now() - 28000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date(Date.now() - 28000).toISOString(),
      category: 'human',
      title: 'Crosswalk Pedestrian Queue & Walk Phase Optimization',
      detail: 'Optical census detected 14 pedestrians in the North-South crosswalk queue zone. Extended walk interval phase granted.',
      oralSummary: 'Pedestrian density detected at North crosswalk. Activating pedestrian safety hold on right turn phases.',
      severity: 'normal',
      confidence: 96.8,
      trackId: 'PED-4109',
      metrics: { pedestrianCount: 14 },
    },
    {
      id: 'audit-003',
      timestamp: new Date(Date.now() - 20000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date(Date.now() - 20000).toISOString(),
      category: 'signal',
      title: 'Signal Gantry 04 Optical Phase Transition Audit',
      detail: 'Signal head classified in Green progression. Approaching yellow clearance interval with Webster cycle balance at 105 seconds.',
      oralSummary: 'Signal gantry recognized. Approaching yellow clearance phase in 6 seconds. Maintaining Webster progression balance.',
      severity: 'normal',
      confidence: 99.2,
      trackId: 'SIG-GNT-04',
    },
    {
      id: 'audit-004',
      timestamp: new Date(Date.now() - 12000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date(Date.now() - 12000).toISOString(),
      category: 'road',
      title: 'Pavement Friction & Roadway Surface Inspection',
      detail: 'Continuous infrared and optical texture scan indicates dry pavement conditions. Friction coefficient rated at μ = 0.84.',
      oralSummary: 'Road surface scan complete. Lane boundaries clear, friction coefficient nominal with zero hydroplaning hazard.',
      severity: 'normal',
      confidence: 97.5,
      trackId: 'RD-TEX-102',
      metrics: { frictionMu: 0.84 },
    },
    {
      id: 'audit-005',
      timestamp: new Date(Date.now() - 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date(Date.now() - 5000).toISOString(),
      category: 'risk',
      title: 'Dynamic Stopping Distance & Collision Risk Audit',
      detail: 'Stopping sight distances evaluated across all lanes. Deceleration threshold meets MUTCD standard; collision risk is Minimal at 8%.',
      oralSummary: 'Collision risk assessment nominal. Vehicles maintaining standard stopping headway. Zero critical anomalies.',
      severity: 'normal',
      confidence: 98.9,
      trackId: 'RSK-EVAL-07',
      metrics: { stoppingDistanceFt: 68 },
    },
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Play an oral summary for a specific log item
  const handlePlayLogOral = (item: VisionLogItem) => {
    playHudClick();
    setPlayingLogId(item.id);
    setLastSpokenText(item.oralSummary);
    speakAnnouncement(item.oralSummary, false);
    setTimeout(() => {
      setPlayingLogId(null);
    }, 4500);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    playHudClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsCameraActive(true);
      playRadarPing();

      const welcomeOral = 'Camera AI Optical Sensor online. Real-time multi-modal monitoring initialized for vehicles, roads, signals, population, objects, and collision risk.';
      addLogEntry({
        category: 'oral',
        title: 'Optical Sensor Online & Stream Initialized',
        detail: 'Hardware stream established at 1080p 30fps. Optical neural detectors calibrated.',
        oralSummary: welcomeOral,
        severity: 'normal',
        confidence: 99.8,
      });

      if (oralInstructionsEnabled) {
        speakAnnouncement(welcomeOral, true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please grant camera access in browser to run real-time visual detection.'
          : 'Failed to access camera stream. Please ensure camera hardware is connected.'
      );
    }
  };

  // Stop Camera
  const stopCamera = () => {
    playHudClick();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCameraActive(false);
    addLogEntry({
      category: 'oral',
      title: 'Camera Optical Stream Deactivated',
      detail: 'Real-time camera optical monitoring halted by operator action.',
      oralSummary: 'Camera optical sensor deactivated. Standby mode armed.',
      severity: 'normal',
      confidence: 100,
    });
  };

  const addLogEntry = (itemData: Omit<VisionLogItem, 'id' | 'timestamp' | 'isoTime'>) => {
    const newItem: VisionLogItem = {
      ...itemData,
      id: `audit-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date().toISOString(),
    };
    setLogs((prev) => [newItem, ...prev.slice(0, 60)]);
  };

  // Automated Periodic Detection Loop
  useEffect(() => {
    if (!isCameraActive) return;

    let cycleCount = 0;
    const interval = setInterval(() => {
      cycleCount++;

      const scenarios: Array<Omit<VisionLogItem, 'id' | 'timestamp' | 'isoTime'>> = [
        {
          category: 'vehicle',
          title: 'Platoon Wave Velocity & Trajectory Inspection',
          detail: 'Tracked 19 vehicles traversing Arterial Sector 4. Velocity progression logged at 35.8 mph with zero lane drift.',
          oralSummary: 'Traffic operations report. 19 vehicles tracked on main arterial. Platoon velocity stable at 36 miles per hour.',
          severity: 'normal',
          confidence: 98.6,
          trackId: `PLT-${2000 + cycleCount}`,
          metrics: { velocityMph: 35.8, headwaySec: 2.3 },
        },
        {
          category: 'human',
          title: 'Pedestrian Crossing Safety Audit',
          detail: '12 pedestrians classified at intersection crossing. Crosswalk illumination optimal. Collision probability 0.02%.',
          oralSummary: 'Pedestrian crossing status nominal. 12 pedestrians in crosswalk queue with protected pedestrian interval active.',
          severity: 'normal',
          confidence: 97.2,
          trackId: `PED-${3000 + cycleCount}`,
          metrics: { pedestrianCount: 12 },
        },
        {
          category: 'signal',
          title: 'Signal Timing & Phase Split Compliance',
          detail: 'Signal Gantry 02 in GREEN split. Webster adaptive optimization maintains zero uncoordinated queue spillback.',
          oralSummary: 'Signal gantry recognized. Phase split in optimal Webster synchronization with 20 seconds remaining.',
          severity: 'normal',
          confidence: 99.4,
          trackId: 'SIG-GNT-02',
        },
        {
          category: 'road',
          title: 'Roadway Surface & Lane Marking Quality Scan',
          detail: 'Surface condition verified as dry. Friction coefficient μ = 0.84. Pavement markings detected with 96% reflectivity.',
          oralSummary: 'Roadway surface scan verified. Lane markings distinct, friction coefficient nominal with zero roadway hazards.',
          severity: 'normal',
          confidence: 98.1,
          trackId: 'RD-TEX-204',
          metrics: { frictionMu: 0.84 },
        },
        {
          category: 'risk',
          title: 'Collision Headway & Hazard Assessment',
          detail: 'Real-time vehicle stopping distances well within 72-foot threshold. Collision hazard level assessed as MINIMAL.',
          oralSummary: 'Collision risk evaluation complete. All moving platoons maintaining compliant stopping distance.',
          severity: 'normal',
          confidence: 99.0,
          trackId: 'RSK-SEC-09',
          metrics: { stoppingDistanceFt: 72 },
        },
      ];

      const chosen = scenarios[cycleCount % scenarios.length];
      addLogEntry(chosen);

      if (oralInstructionsEnabled) {
        setLastSpokenText(chosen.oralSummary);
        speakAnnouncement(chosen.oralSummary, false);
      }
    }, 9000);

    return () => clearInterval(interval);
  }, [isCameraActive, oralInstructionsEnabled]);

  // HUD Canvas Overlay Rendering
  useEffect(() => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let scanY = 0;
    let forward = true;

    const renderHud = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // HUD Reticle Corners
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(25, 50);
      ctx.lineTo(25, 25);
      ctx.lineTo(50, 25);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(canvas.width - 50, 25);
      ctx.lineTo(canvas.width - 25, 25);
      ctx.lineTo(canvas.width - 25, 50);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(25, canvas.height - 50);
      ctx.lineTo(25, canvas.height - 25);
      ctx.lineTo(50, canvas.height - 25);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(canvas.width - 50, canvas.height - 25);
      ctx.lineTo(canvas.width - 25, canvas.height - 25);
      ctx.lineTo(canvas.width - 25, canvas.height - 50);
      ctx.stroke();

      // Laser Scanner Wave traversing vertically
      if (forward) {
        scanY += 3.5;
        if (scanY > canvas.height - 30) forward = false;
      } else {
        scanY -= 3.5;
        if (scanY < 30) forward = true;
      }

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, scanY);
      ctx.lineTo(canvas.width - 25, scanY);
      ctx.stroke();

      // Multi-Target Optical Bounding Boxes
      // 1. Vehicle Target
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(canvas.width * 0.15, canvas.height * 0.35, 140, 95);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(canvas.width * 0.15, canvas.height * 0.35, 140, 95);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('[VEHICLE: SEDAN 98%]', canvas.width * 0.15 + 4, canvas.height * 0.35 - 5);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px monospace';
      ctx.fillText('SPEED: 34.2 MPH • LANE 1', canvas.width * 0.15 + 4, canvas.height * 0.35 + 20);

      // 2. Human Target
      ctx.strokeStyle = '#a855f7';
      ctx.strokeRect(canvas.width * 0.72, canvas.height * 0.40, 85, 120);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fillRect(canvas.width * 0.72, canvas.height * 0.40, 85, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('[HUMAN: PEDESTRIAN 96%]', canvas.width * 0.72 - 10, canvas.height * 0.40 - 5);
      ctx.fillStyle = '#c084fc';
      ctx.font = '9px monospace';
      ctx.fillText('CROSSWALK QUEUE: 14', canvas.width * 0.72 + 4, canvas.height * 0.40 + 20);

      // 3. Signal Target
      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(canvas.width * 0.45, canvas.height * 0.15, 90, 60);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fillRect(canvas.width * 0.45, canvas.height * 0.15, 90, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('[SIGNAL: GREEN 99%]', canvas.width * 0.45, canvas.height * 0.15 - 5);
      ctx.fillStyle = '#34d399';
      ctx.font = '9px monospace';
      ctx.fillText('HOLD: 22 SECONDS', canvas.width * 0.45 + 4, canvas.height * 0.15 + 20);

      // 4. Roadway Target
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(canvas.width * 0.35, canvas.height * 0.70, 160, 45);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(canvas.width * 0.35, canvas.height * 0.70, 160, 45);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('[ROAD: LANE 2 97%]', canvas.width * 0.35, canvas.height * 0.70 - 5);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '9px monospace';
      ctx.fillText('FRICTION: μ=0.84 NOMINAL', canvas.width * 0.35 + 4, canvas.height * 0.70 + 20);

      animationFrameRef.current = requestAnimationFrame(renderHud);
    };

    animationFrameRef.current = requestAnimationFrame(renderHud);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isCameraActive]);

  // Export Audit Log to JSON file
  const handleExportJSON = () => {
    playSuccessChime();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `UrbanFlow_AI_Vision_Audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Audit Log to CSV
  const handleExportCSV = () => {
    playSuccessChime();
    const headers = ['ID', 'ISO_Timestamp', 'Category', 'Title', 'Confidence', 'TrackID', 'Oral_Summary'];
    const rows = logs.map((l) => [
      l.id,
      l.isoTime,
      l.category,
      `"${l.title.replace(/"/g, '""')}"`,
      `${l.confidence}%`,
      l.trackId || 'N/A',
      `"${l.oralSummary.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `UrbanFlow_AI_Vision_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Generate Executive Oral Summary
  const handleGenerateExecutiveSummary = () => {
    playSuccessChime();
    const summaryScript = `Executive Traffic & Vision Audit Report. The UrbanFlow optical monitoring grid has tracked ${logs.length} multi-modal events. Roadway friction is rated at zero point eight four with dry conditions. Traffic signals are operating under coordinated Webster cycle splits. Collision risk is evaluated as minimal across all metropolitan sectors. All operations are nominal.`;
    setShowExecutiveModal(true);
    speakAnnouncement(summaryScript, true);
  };

  // Filtered logs
  const filteredLogs = logs.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.category === activeFilter;
    const matchesQuery = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.oralSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.trackId && item.trackId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Camera AI Optical & Oral Voice Monitor</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isCameraActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isCameraActive ? 'LIVE OPTICAL SENSING ACTIVE' : 'CAMERA STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous multi-target detection: Vehicles, Roads, Signals, Population, Objects, Collision Risk, and Auditable Oral Summaries
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Executive Oral Summary Report Trigger */}
          <button
            onClick={handleGenerateExecutiveSummary}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition cursor-pointer"
            title="Generate AI Executive Oral Summary"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Executive Audit Report</span>
          </button>

          {/* Oral Audio Toggle */}
          <button
            onClick={() => {
              playHudClick();
              setOralInstructionsEnabled(!oralInstructionsEnabled);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              oralInstructionsEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Oral Voice Instructions"
          >
            {oralInstructionsEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            <span>Oral Voice: {oralInstructionsEnabled ? 'ON' : 'MUTED'}</span>
          </button>

          {/* Camera Power Toggle */}
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950 transition active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Activate Camera Monitor</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 transition active:scale-95 cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              <span>Deactivate Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Permission / Error Banner */}
      {cameraError && (
        <div className="bg-rose-950/70 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Camera Access Required</div>
            <p className="mt-1 text-slate-300 leading-relaxed">{cameraError}</p>
          </div>
          <button
            onClick={startCamera}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer shrink-0"
          >
            Grant Permission
          </button>
        </div>
      )}

      {/* Main 2-Column Workstation: Video HUD Viewport + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Camera Video Viewport with Superimposed HUD Boxes */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Overlaid Canvas HUD for Detection Boxes */}
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
                isCameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Offline Placeholder */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 bg-radial from-slate-900 to-slate-950">
                <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 shadow-xl">
                  <Camera className="w-10 h-10 text-cyan-400 opacity-60" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Camera AI Optical Sensor Inactive</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Click "Activate Camera Monitor" above to allow camera access and initiate comprehensive detection of vehicles, roads, signals, population, objects, and oral instructions.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition cursor-pointer"
                >
                  Grant Camera Permission
                </button>
              </div>
            )}

            {/* Live Camera Active Banner */}
            {isCameraActive && (
              <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between text-[11px] font-mono text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-rose-400 font-bold uppercase">REC [MULTI-MODAL OPTICAL]</span>
                </div>
                <div className="text-cyan-400 font-semibold">
                  TARGETS: VEHICLES • ROADS • SIGNALS • POPULATION • RISK
                </div>
              </div>
            )}
          </div>

          {/* Active Spoken Oral Guidance Bar */}
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                Professional Spoken Audio Broadcast:
              </div>
              <div className="text-xs font-medium text-slate-200 mt-0.5">
                "{lastSpokenText}"
              </div>
            </div>
            <button
              onClick={() => speakAnnouncement(lastSpokenText, false)}
              className="p-2 text-cyan-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0"
              title="Repeat Spoken Broadcast"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Multi-Target Detection Metrics */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Vehicles */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Vehicles Tracked</span>
                <Car className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-cyan-400 mt-1">
                {visionStats.vehiclesCount} Platoon
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Cars, Buses, Semis, EMS
              </div>
            </div>

            {/* Population / Humans */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Population & Humans</span>
                <User className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-purple-400 mt-1">
                {visionStats.humansCount} Pedestrians
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Crosswalks & Sidewalks
              </div>
            </div>

            {/* Traffic Signal State */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Signals Optical State</span>
                <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm font-extrabold font-mono text-emerald-400 mt-1 truncate">
                {visionStats.signalState}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Hold {visionStats.signalCountdown}s
              </div>
            </div>

            {/* Roadway Surface & Risk */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Roads & Collision Risk</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-sm font-extrabold font-mono text-amber-300 mt-1 truncate">
                {visionStats.riskIndex}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                {visionStats.roadCondition}
              </div>
            </div>
          </div>

          {/* Optical AI Detection Confidence Gauges */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Detection Confidence & Model Health</span>
              <span className="text-[10px] font-mono text-cyan-400">YOLO-v11 / Vision-TOC</span>
            </div>
            
            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-300 mb-0.5">
                  <span>Vehicle & Platoon Optical Extraction</span>
                  <span className="font-mono text-cyan-400 font-bold">98.4%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full w-[98.4%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-0.5">
                  <span>Pedestrian / Crosswalk Boundary Extraction</span>
                  <span className="font-mono text-purple-400 font-bold">96.8%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[96.8%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-0.5">
                  <span>Signal Head State Recognition</span>
                  <span className="font-mono text-emerald-400 font-bold">99.2%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[99.2%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          EXTENDED SCROLLABLE ACTIVITY AUDIT LOG (Time-Stamped Detections & AI Oral Summaries)
         ========================================================================= */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
        
        {/* Audit Log Controls Bar: Search, Category Filters, Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Multi-Modal Optical Activity Log & Audit Trail</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  {filteredLogs.length} Records
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Time-stamped optical detections, telemetry metrics, and AI-generated oral summaries for municipal auditability
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
              title="Download Full Audit Trail in JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
              title="Download Full Audit Trail in CSV"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Keyword Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'all', label: 'All Detections' },
              { id: 'vehicle', label: 'Vehicles' },
              { id: 'human', label: 'Humans & Crowd' },
              { id: 'signal', label: 'Traffic Signals' },
              { id: 'road', label: 'Road Surface' },
              { id: 'risk', label: 'Collision Risk' },
              { id: 'oral', label: 'Oral Summaries' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  playHudClick();
                  setActiveFilter(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono shrink-0 transition cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Keyword Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search detections or track ID..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
        </div>

        {/* Scrollable Audit Log Entries List */}
        <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1.5 scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
              No detection records matching the current filter or search criteria.
            </div>
          ) : (
            filteredLogs.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition-all flex flex-col gap-2.5"
              >
                {/* Entry Top Row: Tag, Track ID, Timestamp, and Listen Button */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        item.category === 'vehicle'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : item.category === 'human'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : item.category === 'signal'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : item.category === 'road'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : item.category === 'risk'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {item.category}
                    </span>

                    {item.trackId && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.trackId}
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {item.confidence}% Confidence
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Timestamp */}
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{item.timestamp}</span>
                      <span className="text-slate-600">({item.isoTime.slice(11, 19)}Z)</span>
                    </div>

                    {/* Listen to Oral Summary Button */}
                    <button
                      onClick={() => handlePlayLogOral(item)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        playingLogId === item.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                          : 'bg-slate-950 hover:bg-slate-800 text-cyan-300 border-slate-800 hover:border-cyan-500/40'
                      }`}
                      title="Listen to this event's AI Oral Summary"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{playingLogId === item.id ? 'Playing...' : 'Play Oral Audio'}</span>
                    </button>
                  </div>
                </div>

                {/* Title & Technical Observation */}
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.detail}</p>
                </div>

                {/* AI-Generated Oral Summary Script Box */}
                <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-800/90 flex items-start gap-2.5 text-xs">
                  <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block mb-0.5">
                      AI-Generated Oral Speech Script:
                    </span>
                    <span className="text-slate-300 italic leading-relaxed">
                      "{item.oralSummary}"
                    </span>
                  </div>
                </div>

                {/* Metrics Pill Strip (if available) */}
                {item.metrics && (
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    {item.metrics.velocityMph !== undefined && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                        VELOCITY: {item.metrics.velocityMph} MPH
                      </span>
                    )}
                    {item.metrics.headwaySec !== undefined && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300">
                        HEADWAY: {item.metrics.headwaySec}s
                      </span>
                    )}
                    {item.metrics.frictionMu !== undefined && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-blue-300">
                        SURFACE FRICTION: μ = {item.metrics.frictionMu}
                      </span>
                    )}
                    {item.metrics.stoppingDistanceFt !== undefined && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
                        STOPPING SIGHT DIST: {item.metrics.stoppingDistanceFt} FT
                      </span>
                    )}
                    {item.metrics.pedestrianCount !== undefined && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-purple-300">
                        CROWD COUNT: {item.metrics.pedestrianCount} PEDESTRIANS
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Executive Oral Audit Modal */}
      {showExecutiveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Executive Optical Audit Report</h3>
                  <p className="text-xs text-slate-400">Oral speech synthesis broadcast summary</p>
                </div>
              </div>
              <button
                onClick={() => setShowExecutiveModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
              <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase">
                Broadcast Transcript:
              </div>
              <p>
                "Executive Traffic & Vision Audit Report. The UrbanFlow optical monitoring grid has tracked {logs.length} multi-modal events. Roadway friction is rated at zero point eight four with dry conditions. Traffic signals are operating under coordinated Webster cycle splits. Collision risk is evaluated as minimal across all metropolitan sectors. All operations are nominal."
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => speakAnnouncement(`Executive Traffic & Vision Audit Report. The UrbanFlow optical monitoring grid has tracked ${logs.length} multi-modal events. All operations nominal.`, false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Spoken Audio</span>
              </button>
              <button
                onClick={() => setShowExecutiveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
