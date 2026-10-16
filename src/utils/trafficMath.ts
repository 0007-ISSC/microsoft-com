import { LevelOfService } from '../types/traffic';

/**
 * Calculates Level of Service (LOS) per Highway Capacity Manual (HCM) standards
 * based on control delay per vehicle at signalized intersections
 */
export function getLOSFromDelay(delaySec: number): LevelOfService {
  if (delaySec <= 10) return 'A';
  if (delaySec <= 20) return 'B';
  if (delaySec <= 35) return 'C';
  if (delaySec <= 55) return 'D';
  if (delaySec <= 80) return 'E';
  return 'F';
}

/**
 * Returns color code corresponding to Level of Service
 */
export function getLOSColor(los: LevelOfService): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (los) {
    case 'A':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: '#10b981' };
    case 'B':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30', dot: '#14b8a6' };
    case 'C':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', dot: '#06b6d4' };
    case 'D':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: '#f59e0b' };
    case 'E':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: '#f97316' };
    case 'F':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', dot: '#f43f5e' };
  }
}

/**
 * Webster's Optimum Cycle Length Formula:
 * C_opt = (1.5 * L + 5) / (1 - Y)
 * where:
 *   L = Total lost time per cycle (seconds), sum of yellow + all-red clearance loss
 *   Y = Sum of flow ratios for critical approaches: sum(q_i / s_i)
 *   q_i = actual flow rate (veh/hr)
 *   s_i = saturation flow rate (typical urban lane = 1800 - 1900 veh/hr/lane)
 */
export function calculateWebsterCycle(
  flowRatioNS: number,
  flowRatioEW: number,
  lostTimeSec: number = 12
): {
  optimumCycleSec: number;
  greenSecNS: number;
  greenSecEW: number;
  totalDelaySec: number;
} {
  const Y = Math.min(0.92, Math.max(0.15, flowRatioNS + flowRatioEW));
  const rawCycle = (1.5 * lostTimeSec + 5) / (1 - Y);
  
  // Constrain to realistic operational standards: 45s to 150s
  const optimumCycleSec = Math.round(Math.min(150, Math.max(45, rawCycle)));
  const effectiveGreen = optimumCycleSec - lostTimeSec;

  const greenSecNS = Math.round((flowRatioNS / Y) * effectiveGreen);
  const greenSecEW = effectiveGreen - greenSecNS;

  // Webster's average delay per vehicle:
  // d = c*(1 - lambda)^2 / (2*(1 - lambda*x)) + x^2 / (2*q*(1 - x)) - 0.65*(c / q^2)^(1/3) * x^(2 + 5*lambda)
  // Simplified robust approximation for real-time visualization:
  const lambdaNS = greenSecNS / optimumCycleSec;
  const x = Math.min(0.98, flowRatioNS / Math.max(0.01, lambdaNS));
  const uniformDelay = (optimumCycleSec * Math.pow(1 - lambdaNS, 2)) / (2 * (1 - lambdaNS * x));
  const randomDelay = Math.pow(x, 2) / (2 * Math.max(0.01, 1 - x));
  const totalDelaySec = Math.round((uniformDelay + randomDelay) * 10) / 10;

  return {
    optimumCycleSec,
    greenSecNS: Math.max(15, greenSecNS),
    greenSecEW: Math.max(15, greenSecEW),
    totalDelaySec: Math.min(120, Math.max(4, totalDelaySec)),
  };
}

/**
 * Greenshields Model for speed-density relationship:
 * v = v_f * (1 - k / k_j)
 * q = k * v
 */
export function calculateGreenshieldsSpeed(
  densityVehPerKm: number,
  freeFlowSpeedMph: number = 45,
  jamDensityVehPerKm: number = 130
): number {
  const speed = freeFlowSpeedMph * (1 - Math.min(1, densityVehPerKm / jamDensityVehPerKm));
  return Math.max(5, Math.round(speed * 10) / 10);
}

/**
 * Estimate Fuel Consumption and Carbon Emissions
 * Based on EPA standard: 1 gallon of gasoline = 8.887 kg CO2
 * Urban idling consumes ~0.65 liters/hour (0.17 gal/hr)
 */
export function estimateEmissionSavings(
  totalVehicles: number,
  avgDelaySavedSec: number
): {
  fuelSavedLiters: number;
  co2SavedKg: number;
} {
  const totalHoursSaved = (totalVehicles * avgDelaySavedSec) / 3600;
  const fuelSavedLiters = totalHoursSaved * 0.65;
  const co2SavedKg = fuelSavedLiters * 2.31; // ~2.31 kg CO2 per liter gasoline

  return {
    fuelSavedLiters: Math.round(fuelSavedLiters * 10) / 10,
    co2SavedKg: Math.round(co2SavedKg * 10) / 10,
  };
}
