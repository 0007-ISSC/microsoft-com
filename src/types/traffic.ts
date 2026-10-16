export type LevelOfService = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type SignalPhaseType = 'N-S' | 'E-W' | 'PROTECTED_LEFT';

export interface SignalPhase {
  id: string;
  name: string;
  direction: SignalPhaseType;
  durationSec: number;
  yellowSec: number;
  allRedSec: number;
}

export interface IntersectionNode {
  id: string;
  name: string;
  shortCode: string;
  x: number; // 0 to 1000 coordinate on SVG map
  y: number; // 0 to 1000 coordinate on SVG map
  zone: string;
  cycleLength: number; // e.g. 90s, 108s
  currentPhaseIndex: number;
  currentPhaseElapsed: number;
  phases: SignalPhase[];
  mode: 'adaptive' | 'fixed' | 'preempted';
  preemptionSource?: string;
  queueNorth: number; // vehicle queue count
  queueSouth: number;
  queueEast: number;
  queueWest: number;
  criticalVolumeToCapacityRatio: number; // 0.0 to 1.2
  cameraStatus: 'online' | 'degraded' | 'offline';
  sensorHealth: number; // 0 - 100%
  websterDelaySec: number;
}

export interface RoadCorridor {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthKm: number;
  speedLimitMph: number;
  currentSpeedMph: number;
  capacityVehPerHour: number;
  currentFlowVehPerHour: number;
  densityVehPerKm: number;
  congestionPercent: number;
  levelOfService: LevelOfService;
  hasGreenWave: boolean;
  lanes: number;
  activeIncidentsCount: number;
  pathPoints: { x: number; y: number }[];
}

export interface MovingVehicle {
  id: string;
  corridorId: string;
  type: 'car' | 'bus' | 'truck' | 'ambulance' | 'police' | 'bike';
  progress: number; // 0 to 1 along corridor
  speedMph: number;
  isEmergency: boolean;
  color: string;
  routeNodeIds: string[];
}

export interface TrafficIncident {
  id: string;
  title: string;
  type: 'collision' | 'stall' | 'roadwork' | 'debris' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  corridorId: string;
  locationName: string;
  reportedMinutesAgo: number;
  lanesBlocked: number;
  estimatedClearanceMinutes: number;
  status: 'active' | 'responding' | 'cleared';
  recommendedDetour: string;
}

export interface UrbanMetricSummary {
  cityCongestionIndex: number; // 0 - 100%
  levelOfService: LevelOfService;
  averageVelocityMph: number;
  totalActiveVehicles: number;
  carbonReductionTons: number;
  totalHoursSavedToday: number;
  adaptiveEfficiencyGainPct: number;
  activeGreenWavesCount: number;
  incidentCount: number;
  preemptionActive: boolean;
}

export interface NavigationRouteOption {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  distanceKm: number;
  durationMins: number;
  delayMins: number;
  avgSpeedMph: number;
  fuelLiter: number;
  carbonKg: number;
  stopsCount: number;
  corridorIds: string[];
  directions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isActionable?: boolean;
  actionType?: 'apply_optimization' | 'trigger_preemption' | 'view_incident' | 'view_route';
  actionData?: any;
}
